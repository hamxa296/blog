import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  db, 
  uploadProfilePicture, 
  updateUserProfile, 
  type Post 
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
  setDoc
} from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { Link } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'bookmarks' | 'comments'>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit form state
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({ posts: 0, comments: 0, reactions: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Tab Data Lists
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [myPostsLoading, setMyPostsLoading] = useState(true);

  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(true);

  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  const [bioText, setBioText] = useState('No bio yet.');

  // Initialize edit fields
  useEffect(() => {
    if (profile) {
      setEditDisplayName(profile.displayName || user?.displayName || '');
      setEditBio(profile.bio || '');
      setBioText(profile.bio || 'No bio yet.');
    }
  }, [profile, user]);

  // Load stats and bio
  const loadStatsAndBio = async () => {
    if (!user) return;
    setStatsLoading(true);

    try {
      // Fetch bio from profiles/{userId}
      const profDoc = await getDoc(doc(db, 'profiles', user.uid));
      if (profDoc.exists()) {
        const data = profDoc.data();
        if (data.bio) {
          setBioText(data.bio);
          setEditBio(data.bio);
        }
      }

      // Query posts count
      const postsQuery = query(collection(db, 'posts'), where('authorId', '==', user.uid));
      const postsSnap = await getDocs(postsQuery);
      const postsCount = postsSnap.size;

      // Query comments count
      const commentsQuery = query(collection(db, 'comments'), where('authorId', '==', user.uid));
      const commentsSnap = await getDocs(commentsQuery);
      const commentsCount = commentsSnap.size;

      // Query reactions count
      const reactionsQuery = query(collection(db, 'reactions'), where('targetAuthorId', '==', user.uid));
      const reactionsSnap = await getDocs(reactionsQuery);
      const reactionsCount = reactionsSnap.size;

      setStats({
        posts: postsCount,
        comments: commentsCount,
        reactions: reactionsCount
      });
    } catch (err) {
      console.error("Error loading stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Load my posts
  const loadMyPosts = async () => {
    if (!user) return;
    setMyPostsLoading(true);

    try {
      const q = query(
        collection(db, 'posts'),
        where('authorId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(9)
      );
      const snapshot = await getDocs(q);
      const postsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setMyPosts(postsList);
    } catch (err) {
      console.error("Error loading my posts:", err);
    } finally {
      setMyPostsLoading(false);
    }
  };

  // Load bookmarks
  const loadBookmarks = async () => {
    if (!user) return;
    setBookmarksLoading(true);

    try {
      // First try subcollection: users/{uid}/bookmarks
      let postIds: string[] = [];
      const subBookmarks = query(
        collection(db, 'users', user.uid, 'bookmarks'),
        orderBy('createdAt', 'desc'),
        limit(24)
      );
      const subSnap = await getDocs(subBookmarks);
      if (!subSnap.empty) {
        postIds = subSnap.docs.map(d => d.data().postId).filter(Boolean);
      } else {
        // Fallback to bookmarks collection
        const rootBookmarks = query(
          collection(db, 'bookmarks'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(24)
        );
        const rootSnap = await getDocs(rootBookmarks);
        postIds = rootSnap.docs.map(d => d.data().postId || d.data().postRefId).filter(Boolean);
      }

      if (postIds.length === 0) {
        setBookmarks([]);
        return;
      }

      // Fetch the actual posts
      const fetchedPosts: any[] = [];
      for (const pid of postIds) {
        const postDoc = await getDoc(doc(db, 'posts', pid));
        if (postDoc.exists()) {
          fetchedPosts.push({ id: postDoc.id, ...postDoc.data() });
        }
      }
      setBookmarks(fetchedPosts);
    } catch (err) {
      console.error("Error loading bookmarks:", err);
    } finally {
      setBookmarksLoading(false);
    }
  };

  // Load comments
  const loadComments = async () => {
    if (!user) return;
    setCommentsLoading(true);

    try {
      const q = query(
        collection(db, 'comments'),
        where('authorId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(24)
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setComments(list);
    } catch (err) {
      console.error("Error loading comments:", err);
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

      // Upload avatar if selected
      if (avatarFile) {
        const uploadRes = await uploadProfilePicture(user.uid, avatarFile);
        if (uploadRes.success && uploadRes.url) {
          finalPhotoURL = uploadRes.url;
        } else {
          alert("Failed to upload avatar: " + uploadRes.error);
        }
      }

      // Update Firebase Auth user details
      await updateProfile(user, {
        displayName: editDisplayName,
        photoURL: finalPhotoURL
      });

      // Update users/{uid} collection
      await updateUserProfile(user.uid, {
        displayName: editDisplayName,
        photoURL: finalPhotoURL,
        bio: editBio
      });

      // Update profiles/{uid} collection
      await setDoc(doc(db, 'profiles', user.uid), { bio: editBio }, { merge: true });

      setBioText(editBio);
      await refreshProfile();
      setIsEditModalOpen(false);
      setAvatarFile(null);
    } catch (err: any) {
      alert("Error saving profile details: " + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRefreshAll = () => {
    loadStatsAndBio();
    if (activeTab === 'posts') loadMyPosts();
    if (activeTab === 'bookmarks') loadBookmarks();
    if (activeTab === 'comments') loadComments();
  };

  const getStatusBadge = (status: Post['status']) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 border border-green-500/30 text-green-400">Approved</span>;
      case 'pending':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">Pending</span>;
      case 'rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-400">Rejected</span>;
      case 'draft':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/10 border border-gray-500/30 text-gray-400">Draft</span>;
      default:
        return null;
    }
  };

  return (
    <main className="min-h-[calc(100vh-88px)] text-[#1A3D63] py-12 relative z-10">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        
        {/* Profile Details Header Card */}
        <div 
          className="rounded-3xl p-6 md:p-8 border border-[#B3CFE5]/20 shadow-2xl text-white relative mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(10, 25, 49, 0.7), rgba(26, 61, 99, 0.6))',
            backdropFilter: 'blur(14px)',
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-[#4A7FA7] shadow-xl relative group">
                {profile?.photoURL || user?.photoURL ? (
                  <img 
                    src={profile?.photoURL || user?.photoURL || ''} 
                    alt="Profile Photo" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1A3D63] text-white flex items-center justify-center font-bold text-3xl font-serif">
                    {profile?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  {profile?.displayName || user?.displayName || 'GIKian Member'}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#4A7FA7]/20 border border-[#4A7FA7]/30 text-[#B3CFE5]">
                  <svg className="w-3 h-3 text-[#B3CFE5]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {profile?.isAdmin ? 'Administrator' : 'Student Member'}
                </span>
              </div>
              <p className="text-[#B3CFE5]/60 text-sm mb-2">
                Logged in as {user?.email}
              </p>
              <p className="text-[#B3CFE5]/80 text-sm leading-relaxed max-w-xl">
                {bioText}
              </p>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mt-4 relative z-20">
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-5 py-2 rounded-full font-semibold text-sm cursor-pointer transition-all duration-300 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] border border-[#B3CFE5]/35 hover:opacity-95 flex items-center gap-2 hover:scale-[1.01]"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>
                <button 
                  onClick={() => setActiveTab('bookmarks')}
                  className="px-5 py-2 rounded-full font-semibold text-sm cursor-pointer transition-all duration-300 bg-white/5 border border-white/10 text-[#B3CFE5] hover:bg-[#4A7FA7]/15 hover:text-white flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  My Bookmarks
                </button>
                <Link 
                  to="/write"
                  className="px-5 py-2 rounded-full font-semibold text-sm cursor-pointer transition-all duration-300 bg-white/5 border border-white/10 text-[#B3CFE5] hover:bg-[#4A7FA7]/15 hover:text-white flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Write Post
                </Link>
                <button 
                  onClick={handleRefreshAll}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-[#B3CFE5]/75 hover:bg-white/10 hover:text-white flex items-center gap-1.5 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-[#B3CFE5]/10">
            {/* Posts Written */}
            <div className="bg-[#1A3D63]/30 border border-[#B3CFE5]/10 p-4 rounded-2xl flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-[#0A1931]/30">
                <svg className="w-5 h-5 text-[#B3CFE5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white">
                  {statsLoading ? '—' : stats.posts}
                </div>
                <div className="text-[10px] text-[#B3CFE5]/60 font-bold uppercase tracking-wider">Posts Written</div>
              </div>
            </div>

            {/* Comments Made */}
            <div className="bg-[#1A3D63]/30 border border-[#B3CFE5]/10 p-4 rounded-2xl flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-[#0A1931]/30">
                <svg className="w-5 h-5 text-[#B3CFE5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white">
                  {statsLoading ? '—' : stats.comments}
                </div>
                <div className="text-[10px] text-[#B3CFE5]/60 font-bold uppercase tracking-wider">Comments Made</div>
              </div>
            </div>

            {/* Reactions Received */}
            <div className="bg-[#1A3D63]/30 border border-[#B3CFE5]/10 p-4 rounded-2xl flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-[#0A1931]/30">
                <svg className="w-5 h-5 text-[#B3CFE5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white">
                  {statsLoading ? '—' : stats.reactions}
                </div>
                <div className="text-[10px] text-[#B3CFE5]/60 font-bold uppercase tracking-wider">Reactions Given</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab panels card */}
        <div 
          className="rounded-3xl border border-[#B3CFE5]/20 shadow-2xl text-white overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(10, 25, 49, 0.7), rgba(26, 61, 99, 0.6))',
            backdropFilter: 'blur(14px)',
          }}
        >
          {/* Tab switches */}
          <div className="flex border-b border-[#B3CFE5]/10 px-4 bg-[#0A1931]/20">
            <button 
              onClick={() => setActiveTab('posts')}
              className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${activeTab === 'posts' ? 'border-[#B3CFE5] text-white' : 'border-transparent text-[#B3CFE5]/60 hover:text-white'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              My Posts
            </button>
            <button 
              onClick={() => setActiveTab('bookmarks')}
              className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${activeTab === 'bookmarks' ? 'border-[#B3CFE5] text-white' : 'border-transparent text-[#B3CFE5]/60 hover:text-white'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Bookmarked
            </button>
            <button 
              onClick={() => setActiveTab('comments')}
              className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${activeTab === 'comments' ? 'border-[#B3CFE5] text-white' : 'border-transparent text-[#B3CFE5]/60 hover:text-white'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Comments
            </button>
          </div>

          <div className="p-6">
            {/* My Posts Tab */}
            {activeTab === 'posts' && (
              <div>
                {myPostsLoading ? (
                  <div className="flex items-center gap-2 text-[#B3CFE5]/60 text-sm">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Loading your articles...
                  </div>
                ) : myPosts.length === 0 ? (
                  <div className="text-center py-12 text-[#B3CFE5]/60">
                    <svg className="w-12 h-12 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <p className="font-bold text-white text-lg mb-1">No posts written yet</p>
                    <p className="text-sm mb-4">Start sharing your GIKI stories today!</p>
                    <Link to="/write" className="px-5 py-2.5 rounded-full bg-[#4A7FA7] hover:bg-[#1A3D63] text-white font-bold text-sm shadow-md transition inline-block">
                      Write your first post
                    </Link>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myPosts.map(post => (
                      <div 
                        key={post.id} 
                        className="bg-[#1A3D63]/30 border border-[#B3CFE5]/15 rounded-2xl p-5 hover:bg-[#1A3D63]/55 transition duration-300 relative flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3 gap-2">
                            <span className="text-[10px] font-bold text-[#B3CFE5]/50 bg-black/20 px-2 py-0.5 rounded uppercase tracking-wider">{post.genre}</span>
                            {getStatusBadge(post.status)}
                          </div>
                          <h4 className="font-bold text-white text-base mb-1 line-clamp-1">{post.title}</h4>
                          <p className="text-xs text-[#B3CFE5]/70 line-clamp-2 mb-4">{post.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Link 
                            to={`/posts/${post.id}`} 
                            className="text-xs bg-[#4A7FA7]/20 border border-[#4A7FA7]/30 hover:bg-[#4A7FA7]/45 text-white px-3 py-1.5 rounded-lg transition text-center flex-1"
                          >
                            View
                          </Link>
                          {post.status !== 'approved' && (
                            <Link 
                              to={`/write?edit=${post.id}`} 
                              className="text-xs bg-white/5 border border-white/10 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg transition text-center flex-1"
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

            {/* Bookmarks Tab */}
            {activeTab === 'bookmarks' && (
              <div>
                {bookmarksLoading ? (
                  <div className="flex items-center gap-2 text-[#B3CFE5]/60 text-sm">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Loading bookmarked posts...
                  </div>
                ) : bookmarks.length === 0 ? (
                  <div className="text-center py-12 text-[#B3CFE5]/60">
                    <svg className="w-12 h-12 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <p className="font-bold text-white text-lg mb-1">No bookmarked posts</p>
                    <p className="text-sm">Save posts from the blog browser to read them later.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bookmarks.map(post => (
                      <Link 
                        key={post.id}
                        to={`/posts/${post.id}`}
                        className="bg-[#1A3D63]/30 border border-[#B3CFE5]/15 rounded-2xl p-5 hover:bg-[#1A3D63]/55 transition duration-300 block"
                      >
                        <span className="text-[10px] font-bold text-[#B3CFE5]/50 bg-black/20 px-2 py-0.5 rounded uppercase tracking-wider mb-2 inline-block">{post.genre}</span>
                        <h4 className="font-bold text-white text-base mb-1 line-clamp-1">{post.title}</h4>
                        <p className="text-xs text-[#B3CFE5]/70 line-clamp-2">{post.description}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div>
                {commentsLoading ? (
                  <div className="flex items-center gap-2 text-[#B3CFE5]/60 text-sm">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Loading your comments...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-12 text-[#B3CFE5]/60">
                    <svg className="w-12 h-12 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="font-bold text-white text-lg mb-1">No comments written yet</p>
                    <p className="text-sm">Comments you write on blog posts will show up here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map(c => (
                      <div key={c.id} className="bg-[#1A3D63]/30 border border-[#B3CFE5]/10 p-5 rounded-2xl">
                        <div className="flex justify-between items-center text-xs text-[#B3CFE5]/60 mb-2">
                          <span>On post ID: <Link to={`/posts/${c.postId}`} className="underline text-white font-semibold">{c.postId}</Link></span>
                          <span>{c.createdAt ? new Date(c.createdAt.seconds * 1000).toLocaleDateString() : ''}</span>
                        </div>
                        <p className="text-sm text-white">{c.text || c.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md z-50 animate-fade-in">
          <div 
            className="w-full max-w-md rounded-3xl p-8 border border-[#B3CFE5]/30 shadow-2xl relative text-white"
            style={{
              background: 'linear-gradient(135deg, rgba(10,25,49,0.98), rgba(20,45,75,0.98))',
            }}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Edit Profile</h3>
                <p className="text-xs text-[#B3CFE5]/50 mt-0.5">Update display name, avatar, and bio</p>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition text-white/60 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#B3CFE5] uppercase tracking-wider mb-2">Display Name</label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3 text-white focus:outline-none focus:border-white focus:ring-3 focus:ring-white/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#B3CFE5] uppercase tracking-wider mb-2">Profile bio</label>
                <textarea
                  rows={4}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell us about yourself - your year, batch, interests..."
                  className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3 text-white focus:outline-none focus:border-white focus:ring-3 focus:ring-white/10 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#B3CFE5] uppercase tracking-wider mb-2">Profile photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#4A7FA7]/20 file:text-white hover:file:bg-[#4A7FA7]/35 cursor-pointer text-[#B3CFE5]/70"
                />
                <p className="text-[10px] text-[#B3CFE5]/50 mt-1">Upload an image file (JPEG, PNG). Max 5MB.</p>
              </div>

              {saveLoading && (
                <div className="text-center text-xs text-[#B3CFE5] animate-pulse py-1">
                  Uploading files and updating database...
                </div>
              )}

              <div className="flex gap-3 justify-end mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2 rounded-full text-sm font-semibold border border-white/10 bg-white/5 hover:bg-white/10 text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saveLoading}
                  className="px-5 py-2 rounded-full text-sm font-bold bg-[#4A7FA7] hover:bg-[#1A3D63] text-white border border-[#B3CFE5]/40 transition shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {saveLoading ? 'Saving...' : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
