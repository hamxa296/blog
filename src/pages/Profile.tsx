import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  db,
  updateUserProfile,
  type Post,
} from '../services/firebase';
import { uploadImageToCloudinary } from '../services/cloudinary';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc,
} from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { ProfileCard } from '../components/profile/ProfileCard';
import { Badge } from '../components/ui/badge';

export const Profile: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'bookmarks' | 'comments'>(
    'posts',
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [editInstagramUrl, setEditInstagramUrl] = useState('');
  const [editTwitterUrl, setEditTwitterUrl] = useState('');
  const [editThreadsUrl, setEditThreadsUrl] = useState('');

  const [stats, setStats] = useState({ posts: 0, comments: 0, reactions: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [myPostsLoading, setMyPostsLoading] = useState(true);

  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(true);

  const [comments, setComments] = useState<
    Array<{
      id: string;
      postId?: string;
      text?: string;
      content?: string;
      createdAt?: { seconds: number };
      postTitle?: string;
      postAuthorName?: string;
    }>
  >([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  const [hasLoadedPosts, setHasLoadedPosts] = useState(false);
  const [hasLoadedBookmarks, setHasLoadedBookmarks] = useState(false);
  const [hasLoadedComments, setHasLoadedComments] = useState(false);

  const [bioText, setBioText] = useState('No bio yet.');

  useEffect(() => {
    if (profile) {
      setEditDisplayName(profile.displayName || user?.displayName || '');
      setEditBio(profile.bio || '');
      setBioText(profile.bio || 'No bio yet.');
      setEditInstagramUrl(profile.instagramUrl || '');
      setEditTwitterUrl(profile.twitterUrl || '');
      setEditThreadsUrl(profile.threadsUrl || '');
    }
  }, [profile, user]);

  const loadStatsAndBio = async () => {
    if (!user) return;
    setStatsLoading(true);

    try {
      // Bio is already loaded from profile context (users collection), no need to fetch from profiles collection.

      const postsQuery = query(
        collection(db, 'posts'),
        where('authorId', '==', user.uid),
      );
      const postsSnap = await getDocs(postsQuery);
      const approvedPostsCount = postsSnap.docs.filter(d => d.data().status === 'approved').length;

      const commentsQuery = query(
        collection(db, 'comments'),
        where('authorId', '==', user.uid),
      );
      const commentsSnap = await getDocs(commentsQuery);
      const commentsCount = commentsSnap.size;

      const reactionsQuery = query(
        collection(db, 'reactions'),
        where('targetAuthorId', '==', user.uid),
      );
      const reactionsSnap = await getDocs(reactionsQuery);
      const reactionsCount = reactionsSnap.size;

      setStats({
        posts: approvedPostsCount, // Only show published posts in public stats
        comments: commentsCount,
        reactions: reactionsCount,
      });

      // Background check for Badge Upgrade
      const score = (approvedPostsCount * 100) + (reactionsCount * 10) + commentsCount;
      const thresholds = [
        { name: "Novice", score: 0 },
        { name: "Contributor", score: 100 },
        { name: "Creator", score: 500 },
        { name: "Luminary", score: 2000 }
      ];
      let currentBadgeIndex = 0;
      for (let i = thresholds.length - 1; i >= 0; i--) {
        if (score >= thresholds[i].score) {
          currentBadgeIndex = i;
          break;
        }
      }
      
      const newBadgeName = thresholds[currentBadgeIndex].name;
      const oldBadgeIndex = profile?.badge 
        ? thresholds.findIndex(t => t.name === profile.badge) 
        : -1;
        
      if (currentBadgeIndex > oldBadgeIndex) {
        await updateUserProfile(user.uid, { badge: newBadgeName });
        await refreshProfile();
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadMyPosts = async () => {
    if (!user || hasLoadedPosts) return;
    setMyPostsLoading(true);

    try {
      const q = query(
        collection(db, 'posts'),
        where('authorId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(9),
      );
      const snapshot = await getDocs(q);
      const postsList = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Post,
      );
      setMyPosts(postsList);
      setHasLoadedPosts(true);
    } catch (err) {
      console.error('Error loading my posts:', err);
    } finally {
      setMyPostsLoading(false);
    }
  };

  const loadBookmarks = async () => {
    if (!user || hasLoadedBookmarks) return;
    setBookmarksLoading(true);

    try {
      let postIds: string[] = [];
      const subBookmarks = query(
        collection(db, 'users', user.uid, 'bookmarks'),
        orderBy('createdAt', 'desc'),
        limit(24),
      );
      const subSnap = await getDocs(subBookmarks);
      if (!subSnap.empty) {
        postIds = subSnap.docs.map((d) => d.data().postId).filter(Boolean);
      } else {
        const rootBookmarks = query(
          collection(db, 'bookmarks'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(24),
        );
        const rootSnap = await getDocs(rootBookmarks);
        postIds = rootSnap.docs
          .map((d) => d.data().postId || d.data().postRefId)
          .filter(Boolean);
      }

      if (postIds.length === 0) {
        setBookmarks([]);
        return;
      }

      const fetchedPosts: Post[] = [];
      for (const pid of postIds) {
        const postDoc = await getDoc(doc(db, 'posts', pid));
        if (postDoc.exists()) {
          fetchedPosts.push({ id: postDoc.id, ...postDoc.data() } as Post);
        }
      }
      setBookmarks(fetchedPosts);
      setHasLoadedBookmarks(true);
    } catch (err) {
      console.error('Error loading bookmarks:', err);
    } finally {
      setBookmarksLoading(false);
    }
  };

  const loadComments = async () => {
    if (!user || hasLoadedComments) return;
    setCommentsLoading(true);

    try {
      const q = query(
        collection(db, 'comments'),
        where('authorId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(24),
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as any));

      const enrichedList = await Promise.all(
        list.map(async (c) => {
          if (c.postId) {
            try {
              const postDoc = await getDoc(doc(db, 'posts', c.postId));
              if (postDoc.exists()) {
                const pData = postDoc.data();
                c.postTitle = pData.title;
                c.postAuthorName = pData.authorName || pData.authorDisplayName;
              }
            } catch (e) {
              console.error("Failed to fetch post for comment", e);
            }
          }
          return c;
        })
      );

      setComments(enrichedList);
      setHasLoadedComments(true);
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadStatsAndBio();
      loadMyPosts();
      loadBookmarks();
      loadComments();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      if (activeTab === 'posts') loadMyPosts();
      if (activeTab === 'bookmarks') loadBookmarks();
      if (activeTab === 'comments') loadComments();
    }
  }, [activeTab, user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaveLoading(true);

    try {
      let finalPhotoURL = profile?.photoURL || user.photoURL || '';

      if (avatarFile) {
        const uploadRes = await uploadImageToCloudinary(avatarFile);
        if (uploadRes.success && uploadRes.imageUrl) {
          finalPhotoURL = uploadRes.imageUrl;
        } else {
          alert('Failed to upload avatar: ' + uploadRes.error);
        }
      }

      await updateProfile(user, {
        displayName: editDisplayName,
        photoURL: finalPhotoURL,
      });

      await updateUserProfile(user.uid, {
        displayName: editDisplayName,
        photoURL: finalPhotoURL,
        bio: editBio,
        instagramUrl: editInstagramUrl,
        twitterUrl: editTwitterUrl,
        threadsUrl: editThreadsUrl,
      });



      setBioText(editBio);
      await refreshProfile();
      setIsEditModalOpen(false);
      setAvatarFile(null);
      setAvatarPreviewUrl('');
    } catch (err: unknown) {
      alert(
        'Error saving profile details: ' +
          (err instanceof Error ? err.message : 'Unknown error'),
      );
    } finally {
      setSaveLoading(false);
    }
  };

  const getStatusBadge = (status: Post['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/15 text-green-400 border-green-500/30">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/15 text-red-400 border-red-500/30">Rejected</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return null;
    }
  };

  return (
    <main className="min-h-[calc(100vh-88px)] bg-background text-foreground py-12 relative z-10 pb-24">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <div className="grid lg:grid-cols-[320px_1fr] gap-8 items-start">
          
          {/* Left Column - Sticky Profile Card */}
          <div className="lg:sticky lg:top-24 h-fit">
            <ProfileCard
              name={
                profile?.displayName || user?.displayName || 'GIKian Member'
              }
              title={bioText}
              avatarUrl={
                profile?.photoURL ||
                user?.photoURL ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.displayName || 'U')}`
              }
              likes={statsLoading ? 0 : stats.reactions}
              posts={statsLoading ? 0 : stats.posts}
              views={statsLoading ? 0 : stats.comments}
              badgeName={profile?.badge || 'Novice'}
              instagramUrl={profile?.instagramUrl}
              twitterUrl={profile?.twitterUrl}
              threadsUrl={profile?.threadsUrl}
              onEdit={() => setIsEditModalOpen(true)}
              editLabel="Edit Profile"
            />
          </div>

          {/* Right Column - Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="space-y-6"
          >
            
            {/* Header Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card border border-border rounded-2xl p-5 shadow-sm gap-4">
              <div>
                <p className="text-sm text-muted-foreground font-light mb-1">
                  Logged in as <span className="font-medium text-foreground">{user?.email}</span>
                </p>
                <Badge variant={profile?.isAdmin ? "default" : "secondary"} className="text-[10px] tracking-widest uppercase rounded-full">
                  {profile?.isAdmin ? 'Administrator' : 'Student Member'}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Link
                  to="/write"
                  className="flex-1 sm:flex-none text-center rounded-xl px-5 py-2.5 text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
                >
                  Write Post
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    loadStatsAndBio();
                    if (activeTab === 'posts') loadMyPosts();
                    if (activeTab === 'bookmarks') loadBookmarks();
                    if (activeTab === 'comments') loadComments();
                  }}
                  className="flex-1 sm:flex-none rounded-xl px-5 py-2.5 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Main Tabs Container */}
            <div className="rounded-[2rem] border border-border bg-card shadow-sm overflow-hidden min-h-[300px] flex flex-col relative">
              
              {/* Pill Tabs */}
              <div className="p-3 sm:p-4 border-b border-border bg-background/30">
                <div className="flex p-1 bg-secondary/50 rounded-2xl overflow-x-auto no-scrollbar gap-1 relative z-10">
                  {(
                    [
                      ['posts', 'My Posts'],
                      ['bookmarks', 'Bookmarked'],
                      ['comments', 'Comments'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveTab(key)}
                      className={`flex-1 min-w-[100px] px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                        activeTab === key
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-4 sm:p-6 flex-1 bg-card overflow-y-auto max-h-[380px] no-scrollbar">
                {activeTab === 'posts' && (
                  <div className="h-full flex flex-col">
                    {myPostsLoading ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-20 min-h-[300px]">
                        <div className="w-10 h-10 border-4 border-sky-start/30 border-t-sky-start rounded-full animate-spin mb-4"></div>
                        <p className="text-sm text-muted-foreground animate-pulse">Loading posts...</p>
                      </div>
                    ) : myPosts.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl bg-secondary/20 border border-dashed border-border">
                        <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mb-4">
                          <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </div>
                        <h3 className="font-semibold text-foreground text-lg mb-2">No posts written yet</h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-sm">Start sharing your experiences, academic tips, and stories with the GIKI community.</p>
                        <Link to="/write" className="rounded-full bg-foreground text-background px-6 py-2.5 text-sm font-medium hover:opacity-90 transition">
                          Write your first post
                        </Link>
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {myPosts.map((post) => (
                          <div key={post.id} className="rounded-2xl border border-border bg-background p-5 flex flex-col justify-between hover:border-foreground/30 transition group">
                            <div>
                              <div className="flex justify-between items-start mb-3 gap-2">
                                <Badge variant="secondary" className="bg-secondary/50">{post.genre}</Badge>
                                {getStatusBadge(post.status)}
                              </div>
                              <h4 className="font-semibold text-base mb-2 line-clamp-1 group-hover:text-sky-start transition-colors">
                                {post.title}
                              </h4>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                                {post.description}
                              </p>
                            </div>
                            <div className="flex gap-2 mt-auto">
                              <Link to={`/posts/${post.id}`} className="text-xs flex-1 text-center rounded-xl border border-border py-2 hover:bg-secondary transition">
                                View
                              </Link>
                              {post.status !== 'approved' && (
                                <Link to={`/write?edit=${post.id}`} className="text-xs flex-1 text-center rounded-xl bg-secondary py-2 hover:bg-secondary/80 transition">
                                  Edit
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'bookmarks' && (
                  <div className="h-full flex flex-col">
                    {bookmarksLoading ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-20 min-h-[300px]">
                        <div className="w-10 h-10 border-4 border-sky-start/30 border-t-sky-start rounded-full animate-spin mb-4"></div>
                        <p className="text-sm text-muted-foreground animate-pulse">Loading bookmarks...</p>
                      </div>
                    ) : bookmarks.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl bg-secondary/20 border border-dashed border-border">
                        <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mb-4">
                          <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                        </div>
                        <h3 className="font-semibold text-foreground text-lg mb-2">No bookmarks</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">Save posts from the blog browser to read them later.</p>
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {bookmarks.map((post) => (
                          <Link key={post.id} to={`/posts/${post.id}`} className="rounded-2xl border border-border bg-background p-5 hover:border-foreground/30 transition block group">
                            <Badge variant="secondary" className="mb-3 bg-secondary/50">
                              {post.genre}
                            </Badge>
                            <h4 className="font-semibold text-base mb-2 line-clamp-1 group-hover:text-sky-start transition-colors">
                              {post.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {post.description}
                            </p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'comments' && (
                  <div className="h-full flex flex-col">
                    {commentsLoading ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-20 min-h-[300px]">
                        <div className="w-10 h-10 border-4 border-sky-start/30 border-t-sky-start rounded-full animate-spin mb-4"></div>
                        <p className="text-sm text-muted-foreground animate-pulse">Loading comments...</p>
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl bg-secondary/20 border border-dashed border-border">
                        <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mb-4">
                          <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </div>
                        <h3 className="font-semibold text-foreground text-lg mb-2">No comments</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">When you interact with articles and write comments, they will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {comments.map((c) => (
                          <div key={c.id} className="rounded-2xl border border-border bg-background p-5 hover:border-foreground/30 transition">
                            <div className="flex justify-between items-center text-xs text-muted-foreground mb-3">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                                On post:{' '}
                                <Link to={`/posts/${c.postId}`} className="text-foreground hover:text-sky-start transition-colors font-medium">
                                  {c.postTitle ? `"${c.postTitle}"` : c.postId} {c.postAuthorName ? `by ${c.postAuthorName}` : ''}
                                </Link>
                              </span>
                              <span>
                                {c.createdAt ? new Date(c.createdAt.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed text-card-foreground">{c.text || c.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Scroll Indicator */}
              {((activeTab === 'posts' && myPosts.length > 4) ||
                (activeTab === 'bookmarks' && bookmarks.length > 4) ||
                (activeTab === 'comments' && comments.length > 4)) && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card via-card/80 to-transparent pointer-events-none flex items-end justify-center pb-2 z-10">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/80 bg-background/50 px-3 py-1 rounded-full backdrop-blur-md border border-border/50 shadow-sm animate-bounce">
                    Scroll for more <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md z-50">
          <div className="w-full max-w-md rounded-[2rem] p-8 border border-border bg-card shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold">Edit Profile</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Update display name, avatar, and bio
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-secondary hover:opacity-80"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-3 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Profile bio
                </label>
                <textarea
                  rows={4}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="w-full bg-background border border-border rounded-xl p-3 focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Profile photo
                </label>
                {avatarPreviewUrl && (
                  <div className="mb-3">
                    <img src={avatarPreviewUrl} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-primary" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-secondary file:text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={editInstagramUrl}
                  onChange={(e) => setEditInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full bg-background border border-border rounded-xl p-3 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Twitter/X URL
                </label>
                <input
                  type="url"
                  value={editTwitterUrl}
                  onChange={(e) => setEditTwitterUrl(e.target.value)}
                  placeholder="https://twitter.com/..."
                  className="w-full bg-background border border-border rounded-xl p-3 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Threads URL
                </label>
                <input
                  type="url"
                  value={editThreadsUrl}
                  onChange={(e) => setEditThreadsUrl(e.target.value)}
                  placeholder="https://threads.net/..."
                  className="w-full bg-background border border-border rounded-xl p-3 focus:outline-none focus:border-primary"
                />
              </div>

              {saveLoading && (
                <div className="text-center text-xs text-muted-foreground animate-pulse py-1">
                  Uploading files and updating database...
                </div>
              )}

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2 rounded-full text-sm font-medium border border-border hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-5 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground disabled:opacity-60"
                >
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
