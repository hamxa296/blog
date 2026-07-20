import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  db,
  uploadProfilePicture,
  updateUserProfile,
  type Post,
} from '../services/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc,
  setDoc,
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
  const [saveLoading, setSaveLoading] = useState(false);

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
    }>
  >([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  const [bioText, setBioText] = useState('No bio yet.');

  useEffect(() => {
    if (profile) {
      setEditDisplayName(profile.displayName || user?.displayName || '');
      setEditBio(profile.bio || '');
      setBioText(profile.bio || 'No bio yet.');
    }
  }, [profile, user]);

  const loadStatsAndBio = async () => {
    if (!user) return;
    setStatsLoading(true);

    try {
      const profDoc = await getDoc(doc(db, 'profiles', user.uid));
      if (profDoc.exists()) {
        const data = profDoc.data();
        if (data.bio) {
          setBioText(data.bio);
          setEditBio(data.bio);
        }
      }

      const postsQuery = query(
        collection(db, 'posts'),
        where('authorId', '==', user.uid),
      );
      const postsSnap = await getDocs(postsQuery);
      const postsCount = postsSnap.size;

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
        posts: postsCount,
        comments: commentsCount,
        reactions: reactionsCount,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadMyPosts = async () => {
    if (!user) return;
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
    } catch (err) {
      console.error('Error loading my posts:', err);
    } finally {
      setMyPostsLoading(false);
    }
  };

  const loadBookmarks = async () => {
    if (!user) return;
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
    } catch (err) {
      console.error('Error loading bookmarks:', err);
    } finally {
      setBookmarksLoading(false);
    }
  };

  const loadComments = async () => {
    if (!user) return;
    setCommentsLoading(true);

    try {
      const q = query(
        collection(db, 'comments'),
        where('authorId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(24),
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setComments(list);
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
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaveLoading(true);

    try {
      let finalPhotoURL = profile?.photoURL || user.photoURL || '';

      if (avatarFile) {
        const uploadRes = await uploadProfilePicture(user.uid, avatarFile);
        if (uploadRes.success && uploadRes.url) {
          finalPhotoURL = uploadRes.url;
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
      });

      await setDoc(doc(db, 'profiles', user.uid), { bio: editBio }, { merge: true });

      setBioText(editBio);
      await refreshProfile();
      setIsEditModalOpen(false);
      setAvatarFile(null);
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
        <div className="grid lg:grid-cols-[320px_1fr] gap-8 items-start mb-8">
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
            onEdit={() => setIsEditModalOpen(true)}
            editLabel="Edit"
          />

          <div className="space-y-4">
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Logged in as {user?.email}
              </p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                {profile?.isAdmin ? 'Administrator' : 'Student Member'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('bookmarks')}
                  className="rounded-full px-5 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:opacity-90"
                >
                  My Bookmarks
                </button>
                <Link
                  to="/write"
                  className="rounded-full px-5 py-2 text-sm font-medium bg-primary text-primary-foreground"
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
                  className="rounded-full px-5 py-2 text-sm font-medium border border-border hover:bg-secondary"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-card shadow-lg overflow-hidden">
          <div className="flex border-b border-border px-2 sm:px-4 overflow-x-auto">
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
                className={`px-5 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === key
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'posts' && (
              <div>
                {myPostsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading your articles...</p>
                ) : myPosts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="font-semibold text-foreground text-lg mb-1">
                      No posts written yet
                    </p>
                    <p className="text-sm mb-4">Start sharing your GIKI stories today!</p>
                    <Link
                      to="/write"
                      className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                    >
                      Write your first post
                    </Link>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myPosts.map((post) => (
                      <div
                        key={post.id}
                        className="rounded-2xl border border-border bg-background/50 p-5 flex flex-col justify-between hover:border-primary/40 transition"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3 gap-2">
                            <Badge variant="secondary">{post.genre}</Badge>
                            {getStatusBadge(post.status)}
                          </div>
                          <h4 className="font-semibold text-base mb-1 line-clamp-1">
                            {post.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                            {post.description}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            to={`/posts/${post.id}`}
                            className="text-xs flex-1 text-center rounded-lg border border-border py-1.5 hover:bg-secondary"
                          >
                            View
                          </Link>
                          {post.status !== 'approved' && (
                            <Link
                              to={`/write?edit=${post.id}`}
                              className="text-xs flex-1 text-center rounded-lg bg-secondary py-1.5"
                            >
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
              <div>
                {bookmarksLoading ? (
                  <p className="text-sm text-muted-foreground">Loading bookmarked posts...</p>
                ) : bookmarks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="font-semibold text-foreground text-lg mb-1">
                      No bookmarked posts
                    </p>
                    <p className="text-sm">
                      Save posts from the blog browser to read them later.
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bookmarks.map((post) => (
                      <Link
                        key={post.id}
                        to={`/posts/${post.id}`}
                        className="rounded-2xl border border-border bg-background/50 p-5 hover:border-primary/40 transition block"
                      >
                        <Badge variant="secondary" className="mb-2">
                          {post.genre}
                        </Badge>
                        <h4 className="font-semibold text-base mb-1 line-clamp-1">
                          {post.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {post.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div>
                {commentsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading your comments...</p>
                ) : comments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="font-semibold text-foreground text-lg mb-1">
                      No comments written yet
                    </p>
                    <p className="text-sm">
                      Comments you write on blog posts will show up here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-2xl border border-border bg-background/50 p-5"
                      >
                        <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                          <span>
                            On post:{' '}
                            <Link
                              to={`/posts/${c.postId}`}
                              className="underline text-foreground font-semibold"
                            >
                              {c.postId}
                            </Link>
                          </span>
                          <span>
                            {c.createdAt
                              ? new Date(c.createdAt.seconds * 1000).toLocaleDateString()
                              : ''}
                          </span>
                        </div>
                        <p className="text-sm">{c.text || c.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
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
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-secondary file:text-foreground"
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
