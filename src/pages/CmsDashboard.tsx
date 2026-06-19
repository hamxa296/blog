import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getAllPosts,
  updatePostStatus, 
  deletePostPermanently,
  getGalleryPhotos,
  updateGalleryPhotoStatus,
  deleteGalleryPhoto,
  getAllUsers,
  toggleBlockUser,
  getAllComments,
  deleteComment,
  updateUserRole,
  updateUserProfile,
  uploadProfilePicture,
  updatePost,
  togglePhotoHighlight,
  toggleFeaturedStatus,
  type Post,
  type GalleryPhoto,
  type UserProfile
} from '../services/firebase';

interface CmsComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  content: string;
  createdAt: any;
}

export const CmsDashboard: React.FC = () => {
  const { user, profile, role, refreshProfile } = useAuth();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'gallery' | 'comments' | 'profile' | 'rights'>('overview');

  // Overview metrics
  const [metrics, setMetrics] = useState({
    totalPosts: 0,
    pendingPosts: 0,
    totalPhotos: 0,
    pendingPhotos: 0,
    totalComments: 0,
    totalUsers: 0
  });

  // States
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postFilter, setPostFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'draft'>('all');
  const [searchPostQuery, setSearchPostQuery] = useState('');

  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photoFilter, setPhotoFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const [comments, setComments] = useState<CmsComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [searchCommentQuery, setSearchCommentQuery] = useState('');

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState('');

  // Editing / Moderating Modals
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');

  const [rejectionPostId, setRejectionPostId] = useState<string | null>(null);
  const [rejectionPhotoId, setRejectionPhotoId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Profile Edit fields
  const [profileName, setProfileName] = useState(profile?.displayName || '');
  const [profileBio, setProfileBio] = useState(profile?.bio || '');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(profile?.photoURL || '');
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  // Sync profile edits with state
  useEffect(() => {
    if (profile) {
      setProfileName(profile.displayName || '');
      setProfileBio(profile.bio || '');
      setProfileAvatarUrl(profile.photoURL || '');
    }
  }, [profile]);

  // Load Overview statistics
  const fetchOverviewMetrics = async () => {
    try {
      const postsRes = await getAllPosts();
      const photosRes = await getGalleryPhotos('all');
      const commentsRes = await getAllComments();
      const usersRes = await getAllUsers();

      const postsList = postsRes.success ? postsRes.posts || [] : [];
      const photosList = photosRes.success ? photosRes.photos || [] : [];
      const commentsList = commentsRes.success ? commentsRes.comments || [] : [];
      const usersList = usersRes.success ? usersRes.users || [] : [];

      setMetrics({
        totalPosts: postsList.length,
        pendingPosts: postsList.filter(p => p.status === 'pending').length,
        totalPhotos: photosList.length,
        pendingPhotos: photosList.filter(p => p.status === 'pending').length,
        totalComments: commentsList.length,
        totalUsers: usersList.length
      });
    } catch (err) {
      console.error('Error fetching metrics', err);
    }
  };

  useEffect(() => {
    fetchOverviewMetrics();
  }, []);

  // Fetch functions
  const loadPosts = async () => {
    setPostsLoading(true);
    const res = await getAllPosts(postFilter);
    if (res.success && res.posts) {
      setPosts(res.posts);
    }
    setPostsLoading(false);
  };

  const loadPhotos = async () => {
    setPhotosLoading(true);
    const res = await getGalleryPhotos(photoFilter);
    if (res.success && res.photos) {
      setPhotos(res.photos);
    }
    setPhotosLoading(false);
  };

  const loadComments = async () => {
    setCommentsLoading(true);
    const res = await getAllComments();
    if (res.success && res.comments) {
      setComments(res.comments);
    }
    setCommentsLoading(false);
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    const res = await getAllUsers();
    if (res.success && res.users) {
      setUsers(res.users);
    }
    setUsersLoading(false);
  };

  // Trigger loads based on active tab
  useEffect(() => {
    if (activeTab === 'overview') fetchOverviewMetrics();
    if (activeTab === 'posts') loadPosts();
    if (activeTab === 'gallery') loadPhotos();
    if (activeTab === 'comments') loadComments();
    if (activeTab === 'rights') loadUsers();
  }, [activeTab, postFilter, photoFilter]);

  // Authorization checks
  const canModeratePosts = role === 'admin' || role === 'editor';
  const canModerateGallery = role === 'admin' || role === 'editor' || role === 'moderator';
  const canModerateComments = role === 'admin' || role === 'editor' || role === 'moderator';
  const isCmsAdmin = role === 'admin';

  // Format Helper
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Draft/Pending';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString();
  };

  // Actions: Post
  const handleApprovePost = async (id: string) => {
    if (!window.confirm("Approve this article for publishing?")) return;
    setActionLoading(true);
    const res = await updatePostStatus(id, 'approved');
    if (res.success) {
      alert("Post approved!");
      loadPosts();
      fetchOverviewMetrics();
    } else {
      alert("Failed: " + res.error);
    }
    setActionLoading(false);
  };

  const handleRejectPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionPostId) return;
    setActionLoading(true);
    const res = await updatePostStatus(rejectionPostId, 'rejected', rejectionReason);
    if (res.success) {
      alert("Post rejected with feedback.");
      setRejectionPostId(null);
      setRejectionReason('');
      loadPosts();
      fetchOverviewMetrics();
    } else {
      alert("Failed: " + res.error);
    }
    setActionLoading(false);
  };

  const handleToggleFeatured = async (id: string, isFeatured: boolean) => {
    setActionLoading(true);
    const res = await toggleFeaturedStatus(id, !isFeatured);
    if (res.success) {
      alert("Featured status updated!");
      loadPosts();
    } else {
      alert("Failed: " + res.error);
    }
    setActionLoading(false);
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm("Permanently delete this article? This action is irreversible.")) return;
    setActionLoading(true);
    const res = await deletePostPermanently(id);
    if (res.success) {
      alert("Post deleted.");
      loadPosts();
      fetchOverviewMetrics();
    } else {
      alert("Failed: " + res.error);
    }
    setActionLoading(false);
  };

  const handleOpenEdit = (post: Post) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditDesc(post.description);
    setEditContent(post.content);
    setEditGenre(post.genre);
    setEditTags(post.tags.join(', '));
    setEditPhotoUrl(post.photoUrl);
  };

  const handleUpdatePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !editingPost.id) return;
    setActionLoading(true);
    
    // Check if current user is either admin/editor OR the author of the post
    if (!canModeratePosts && editingPost.authorId !== user?.uid) {
      alert("Unauthorized to edit this post.");
      setActionLoading(false);
      return;
    }

    const res = await updatePost(editingPost.id, {
      title: editTitle,
      content: editContent,
      description: editDesc,
      photoUrl: editPhotoUrl,
      genre: editGenre,
      tags: editTags
    });

    if (res.success) {
      alert("Post updated successfully! Note: Modified posts return to 'pending' review status.");
      setEditingPost(null);
      loadPosts();
    } else {
      alert("Failed to update post: " + res.error);
    }
    setActionLoading(false);
  };

  // Actions: Gallery
  const handleApprovePhoto = async (id: string) => {
    setActionLoading(true);
    const res = await updateGalleryPhotoStatus(id, 'approved');
    if (res.success) {
      alert("Photo approved.");
      loadPhotos();
      fetchOverviewMetrics();
    } else {
      alert("Failed: " + res.error);
    }
    setActionLoading(false);
  };

  const handleRejectPhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionPhotoId) return;
    setActionLoading(true);
    const res = await updateGalleryPhotoStatus(rejectionPhotoId, 'rejected', rejectionReason);
    if (res.success) {
      alert("Photo rejected.");
      setRejectionPhotoId(null);
      setRejectionReason('');
      loadPhotos();
      fetchOverviewMetrics();
    } else {
      alert("Failed: " + res.error);
    }
    setActionLoading(false);
  };

  const handleTogglePhotoHighlight = async (id: string, isHighlighted: boolean) => {
    setActionLoading(true);
    const res = await togglePhotoHighlight(id, !isHighlighted);
    if (res.success) {
      alert("Highlight status toggled.");
      loadPhotos();
    } else {
      alert("Failed: " + res.error);
    }
    setActionLoading(false);
  };

  const handleDeletePhoto = async (id: string) => {
    if (!window.confirm("Permanently delete this photo?")) return;
    setActionLoading(true);
    const res = await deleteGalleryPhoto(id);
    if (res.success) {
      alert("Photo deleted.");
      loadPhotos();
      fetchOverviewMetrics();
    } else {
      alert("Failed: " + res.error);
    }
    setActionLoading(false);
  };

  // Actions: Comments
  const handleDeleteComment = async (id: string) => {
    if (!window.confirm("Delete this comment?")) return;
    setActionLoading(true);
    const res = await deleteComment(id);
    if (res.success) {
      alert("Comment removed.");
      loadComments();
      fetchOverviewMetrics();
    } else {
      alert("Failed: " + res.error);
    }
    setActionLoading(false);
  };

  // Actions: Rights
  const handleRoleChange = async (uid: string, newRole: 'admin' | 'editor' | 'moderator' | 'author' | 'user') => {
    if (!window.confirm(`Change this user's role to ${newRole}?`)) return;
    setActionLoading(true);
    const res = await updateUserRole(uid, newRole);
    if (res.success) {
      alert("User role updated successfully.");
      loadUsers();
    } else {
      alert("Failed: " + res.error);
    }
    setActionLoading(false);
  };

  const handleToggleUserBlock = async (uid: string, currentBlocked: boolean) => {
    if (!window.confirm(`Are you sure you want to ${currentBlocked ? 'unblock' : 'block'} this account?`)) return;
    setActionLoading(true);
    const res = await toggleBlockUser(uid, !currentBlocked);
    if (res.success) {
      alert("User status updated.");
      loadUsers();
    } else {
      alert("Failed: " + res.error);
    }
    setActionLoading(false);
  };

  // Actions: Profile
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileLoading(true);

    try {
      let finalAvatarUrl = profileAvatarUrl;

      if (profileFile) {
        const uploadRes = await uploadProfilePicture(user.uid, profileFile);
        if (uploadRes.success && uploadRes.url) {
          finalAvatarUrl = uploadRes.url;
        } else {
          alert("Avatar upload failed: " + uploadRes.error);
        }
      }

      const updateRes = await updateUserProfile(user.uid, {
        displayName: profileName,
        bio: profileBio,
        photoURL: finalAvatarUrl
      });

      if (updateRes.success) {
        alert("Profile details updated successfully!");
        setProfileFile(null);
        await refreshProfile();
      } else {
        alert("Failed to update profile: " + updateRes.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  // Filters / Searches client side
  const filteredPosts = posts.filter(post => {
    const titleMatch = post.title.toLowerCase().includes(searchPostQuery.toLowerCase());
    const authorMatch = post.authorName.toLowerCase().includes(searchPostQuery.toLowerCase());
    return titleMatch || authorMatch;
  });

  const filteredComments = comments.filter(comment => {
    return comment.content.toLowerCase().includes(searchCommentQuery.toLowerCase()) ||
           comment.authorName.toLowerCase().includes(searchCommentQuery.toLowerCase());
  });

  const filteredUsers = users.filter(usr => {
    return usr.displayName.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
           usr.email.toLowerCase().includes(searchUserQuery.toLowerCase());
  });

  return (
    <main className="min-h-[calc(100vh-88px)] text-white py-12 relative z-10">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        {/* Title Banner */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif tracking-tight mb-2 flex items-center gap-3">
              🛡️ GIKI Chronicles <span className="text-[#B3CFE5]">CMS Panel</span>
            </h1>
            <p className="text-sm text-[#B3CFE5]/60">
              Manage articles, moderate gallery snapshots, oversee discussions, and configure roles.
            </p>
          </div>
          <div className="bg-[#1A3D63]/80 border border-[#B3CFE5]/30 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-lg">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-[#B3CFE5]/40" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#4A7FA7] flex items-center justify-center font-bold text-lg text-white">
                {profileName.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <div className="font-bold text-white leading-tight">{profileName || user?.email}</div>
              <div className="text-xs text-[#B3CFE5] uppercase font-extrabold tracking-wider">{role}</div>
            </div>
          </div>
        </div>

        {/* Outer Layout Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Side CMS navigation menu */}
          <div className="lg:col-span-3 space-y-2 bg-[#0A1931]/60 border border-[#B3CFE5]/20 p-5 rounded-3xl backdrop-blur-md">
            <div className="text-xs font-extrabold uppercase text-[#B3CFE5]/40 px-3 mb-2 tracking-widest">Navigation</div>
            
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-4 py-3 rounded-2xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer ${
                activeTab === 'overview' ? 'bg-[#4A7FA7]/30 border border-[#B3CFE5]/35 text-white' : 'text-[#B3CFE5]/70 hover:bg-white/5 border border-transparent'
              }`}
            >
              📊 Dashboard Overview
            </button>

            <button
              onClick={() => setActiveTab('posts')}
              className={`w-full text-left px-4 py-3 rounded-2xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer ${
                activeTab === 'posts' ? 'bg-[#4A7FA7]/30 border border-[#B3CFE5]/35 text-white' : 'text-[#B3CFE5]/70 hover:bg-white/5 border border-transparent'
              }`}
            >
              📝 Articles Manager
            </button>

            {canModerateGallery && (
              <button
                onClick={() => setActiveTab('gallery')}
                className={`w-full text-left px-4 py-3 rounded-2xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer ${
                  activeTab === 'gallery' ? 'bg-[#4A7FA7]/30 border border-[#B3CFE5]/35 text-white' : 'text-[#B3CFE5]/70 hover:bg-white/5 border border-transparent'
                }`}
              >
                🖼️ Gallery Approvals
              </button>
            )}

            {canModerateComments && (
              <button
                onClick={() => setActiveTab('comments')}
                className={`w-full text-left px-4 py-3 rounded-2xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer ${
                  activeTab === 'comments' ? 'bg-[#4A7FA7]/30 border border-[#B3CFE5]/35 text-white' : 'text-[#B3CFE5]/70 hover:bg-white/5 border border-transparent'
                }`}
              >
                💬 Comments Moderator
              </button>
            )}

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-3 rounded-2xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer ${
                activeTab === 'profile' ? 'bg-[#4A7FA7]/30 border border-[#B3CFE5]/35 text-white' : 'text-[#B3CFE5]/70 hover:bg-white/5 border border-transparent'
              }`}
            >
              👤 Profile Details
            </button>

            {isCmsAdmin && (
              <button
                onClick={() => setActiveTab('rights')}
                className={`w-full text-left px-4 py-3 rounded-2xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer ${
                  activeTab === 'rights' ? 'bg-[#4A7FA7]/30 border border-[#B3CFE5]/35 text-white' : 'text-[#B3CFE5]/70 hover:bg-white/5 border border-transparent'
                }`}
              >
                🔐 Rights & Roles Config
              </button>
            )}
          </div>

          {/* Central Panel Area */}
          <div 
            className="lg:col-span-9 rounded-3xl p-6 sm:p-8 border border-[#B3CFE5]/25 shadow-2xl backdrop-blur-md relative"
            style={{
              background: 'linear-gradient(135deg, rgba(10,25,49,0.85), rgba(26,61,99,0.85))',
            }}
          >
            
            {/* Overview / Analytics Panel */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold font-serif mb-2">System Metrics</h2>
                  <p className="text-sm text-[#B3CFE5]/60">Brief numerical view of the current state of GIKI Chronicles.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">
                    <div className="text-[#B3CFE5]/60 text-xs font-bold uppercase tracking-wider">Total Articles</div>
                    <div className="text-3xl font-bold mt-2 text-white">{metrics.totalPosts}</div>
                    <div className="text-xs text-[#B3CFE5]/40 mt-1">{metrics.pendingPosts} awaiting reviews</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">
                    <div className="text-[#B3CFE5]/60 text-xs font-bold uppercase tracking-wider">Gallery Images</div>
                    <div className="text-3xl font-bold mt-2 text-white">{metrics.totalPhotos}</div>
                    <div className="text-xs text-[#B3CFE5]/40 mt-1">{metrics.pendingPhotos} pending approval</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition col-span-2 md:col-span-1">
                    <div className="text-[#B3CFE5]/60 text-xs font-bold uppercase tracking-wider">Total Comments</div>
                    <div className="text-3xl font-bold mt-2 text-white">{metrics.totalComments}</div>
                    <div className="text-xs text-[#B3CFE5]/40 mt-1">Across all active blogs</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">
                    <div className="text-[#B3CFE5]/60 text-xs font-bold uppercase tracking-wider">Registered Accounts</div>
                    <div className="text-3xl font-bold mt-2 text-white">{metrics.totalUsers}</div>
                    <div className="text-xs text-[#B3CFE5]/40 mt-1">GIKI campus users</div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-lg">System Permissions Summary</h3>
                  <div className="text-sm text-[#B3CFE5]/80 space-y-2">
                    <p>🎭 Your current role is <strong className="text-white uppercase">{role}</strong>.</p>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#B3CFE5]/70">
                      <li><strong>Admins</strong> can edit all articles, delete comments, approve/reject photos, toggle blocks, and change roles.</li>
                      <li><strong>Editors</strong> can moderate and edit all posts, approve gallery photos, and moderate comments.</li>
                      <li><strong>Moderators</strong> can approve gallery photos and delete comments.</li>
                      <li><strong>Authors</strong> can publish their own posts (pending approval) and edit their own articles.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Articles Manager Panel */}
            {activeTab === 'posts' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold font-serif">Articles Manager</h2>
                    <p className="text-sm text-[#B3CFE5]/60">Manage publishing workflows, edit articles, and review queues.</p>
                  </div>
                  
                  {/* Status Filter tabs */}
                  <div className="flex bg-[#0A1931]/80 rounded-xl p-1 border border-white/5 text-xs font-bold">
                    {(['all', 'pending', 'approved', 'rejected', 'draft'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setPostFilter(f)}
                        className={`px-3 py-1.5 rounded-lg capitalize cursor-pointer transition ${
                          postFilter === f ? 'bg-[#4A7FA7] text-white' : 'text-[#B3CFE5]/60 hover:text-white'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchPostQuery}
                    onChange={(e) => setSearchPostQuery(e.target.value)}
                    placeholder="Search posts by title or author name..."
                    className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-white transition"
                  />
                </div>

                {postsLoading ? (
                  <div className="text-center py-12 text-[#B3CFE5]/60">Retrieving articles queue...</div>
                ) : filteredPosts.length === 0 ? (
                  <div className="text-center py-12 text-[#B3CFE5]/50">No articles match the current filter/search.</div>
                ) : (
                  <div className="space-y-4">
                    {filteredPosts.map(post => {
                      const isOwner = post.authorId === user?.uid;
                      const canEditThis = canModeratePosts || isOwner;
                      return (
                        <div 
                          key={post.id} 
                          className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-5 hover:bg-white/10 transition"
                        >
                          <div className="space-y-2.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] bg-[#4A7FA7]/20 border border-[#4A7FA7]/30 text-[#B3CFE5] font-extrabold uppercase px-2 py-0.5 rounded">
                                {post.genre}
                              </span>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                                post.status === 'approved' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                                post.status === 'rejected' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                                post.status === 'draft' ? 'bg-gray-500/10 border-gray-500/30 text-gray-400' :
                                'bg-blue-500/10 border-blue-500/30 text-blue-400'
                              }`}>
                                {post.status}
                              </span>
                              <span className="text-xs text-[#B3CFE5]/50">Submitted {formatDate(post.createdAt)}</span>
                            </div>
                            <h3 className="text-lg font-bold text-white leading-tight">{post.title}</h3>
                            <p className="text-xs text-[#B3CFE5]/80 line-clamp-2 leading-relaxed">{post.description}</p>
                            
                            <div className="text-xs text-[#B3CFE5]/50 flex justify-between items-center pt-2">
                              <span>By <strong className="text-white">{post.authorName}</strong> {isOwner && '(You)'}</span>
                              {post.isFeatured && <span className="text-xs text-yellow-400 font-bold">⭐ Featured</span>}
                            </div>
                            {post.rejectionReason && post.status === 'rejected' && (
                              <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-xl text-xs">
                                <strong>Rejection Feedback:</strong> {post.rejectionReason}
                              </div>
                            )}
                          </div>

                          {/* Post controls */}
                          <div className="flex md:flex-col justify-end gap-2 min-w-[130px] self-start md:self-stretch">
                            {post.status === 'pending' && canModeratePosts && (
                              <>
                                <button
                                  disabled={actionLoading}
                                  onClick={() => handleApprovePost(post.id!)}
                                  className="px-3 py-1.5 text-xs font-bold bg-green-600 hover:bg-green-700 rounded-lg text-white border border-green-500/30 transition cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  disabled={actionLoading}
                                  onClick={() => setRejectionPostId(post.id!)}
                                  className="px-3 py-1.5 text-xs font-bold bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white border border-yellow-500/30 transition cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            
                            {canModeratePosts && post.status === 'approved' && (
                              <button
                                disabled={actionLoading}
                                onClick={() => handleToggleFeatured(post.id!, post.isFeatured)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                                  post.isFeatured 
                                    ? 'bg-yellow-600/30 border-yellow-500/40 text-yellow-400 hover:bg-yellow-600/50' 
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                              >
                                {post.isFeatured ? 'Unfeature' : 'Feature Article'}
                              </button>
                            )}

                            {canEditThis && (
                              <button
                                disabled={actionLoading}
                                onClick={() => handleOpenEdit(post)}
                                className="px-3 py-1.5 text-xs font-bold bg-[#1A3D63] hover:bg-[#4A7FA7] rounded-lg text-white border border-[#B3CFE5]/30 transition cursor-pointer"
                              >
                                Edit Post
                              </button>
                            )}

                            {(canModeratePosts || isOwner) && (
                              <button
                                disabled={actionLoading}
                                onClick={() => handleDeletePost(post.id!)}
                                className="px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 rounded-lg text-white border border-red-500/30 transition cursor-pointer"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Gallery Moderation Panel */}
            {activeTab === 'gallery' && canModerateGallery && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold font-serif">Gallery Approvals</h2>
                    <p className="text-sm text-[#B3CFE5]/60">Approve user-submitted snapshots, toggle homepage highlights, or remove photos.</p>
                  </div>
                  
                  {/* Photo status tab filter */}
                  <div className="flex bg-[#0A1931]/80 rounded-xl p-1 border border-white/5 text-xs font-bold">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setPhotoFilter(f)}
                        className={`px-3 py-1.5 rounded-lg capitalize cursor-pointer transition ${
                          photoFilter === f ? 'bg-[#4A7FA7] text-white' : 'text-[#B3CFE5]/60 hover:text-white'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {photosLoading ? (
                  <div className="text-center py-12 text-[#B3CFE5]/60">Retrieving photo uploads...</div>
                ) : photos.length === 0 ? (
                  <div className="text-center py-12 text-[#B3CFE5]/50">No gallery images found for this category.</div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {photos.map(photo => (
                      <div 
                        key={photo.id}
                        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="h-44 w-full overflow-hidden bg-black/45 relative">
                            <img src={photo.imageUrl} alt={photo.caption} className="w-full h-full object-cover" />
                            <div className="absolute top-3 left-3 flex gap-1.5">
                              <span className="bg-[#4A7FA7] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-[#B3CFE5]/30">
                                {photo.category}
                              </span>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                                photo.status === 'approved' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
                                photo.status === 'rejected' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
                                'bg-blue-500/20 border-blue-500/30 text-blue-400'
                              }`}>
                                {photo.status}
                              </span>
                            </div>
                            {photo.isHighlighted && (
                              <span className="absolute top-3 right-3 bg-yellow-500/90 text-black text-[9px] font-extrabold px-2 py-0.5 rounded shadow">
                                HIGHLIGHT
                              </span>
                            )}
                          </div>
                          <div className="p-4 space-y-2">
                            <p className="text-sm font-semibold text-white">"{photo.caption}"</p>
                            <div className="text-xs text-[#B3CFE5]/60 flex justify-between items-center">
                              <span>Uploaded by <strong className="text-white">{photo.uploaderName}</strong></span>
                              <span>{formatDate(photo.createdAt)}</span>
                            </div>
                            {photo.rejectionReason && (
                              <div className="bg-red-500/10 text-red-300 text-xs p-2 rounded-lg border border-red-500/25">
                                Reason: {photo.rejectionReason}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Control buttons */}
                        <div className="px-4 pb-4 pt-2 border-t border-white/5 flex gap-2">
                          {photo.status === 'pending' && (
                            <>
                              <button
                                disabled={actionLoading}
                                onClick={() => handleApprovePhoto(photo.id!)}
                                className="flex-1 py-1.5 text-xs font-bold bg-green-600 hover:bg-green-700 rounded-lg text-white border border-green-500/30 transition cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                disabled={actionLoading}
                                onClick={() => setRejectionPhotoId(photo.id!)}
                                className="flex-1 py-1.5 text-xs font-bold bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white border border-yellow-500/30 transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          
                          {photo.status === 'approved' && (
                            <button
                              disabled={actionLoading}
                              onClick={() => handleTogglePhotoHighlight(photo.id!, photo.isHighlighted)}
                              className={`flex-grow py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                                photo.isHighlighted
                                  ? 'bg-yellow-600/20 border-yellow-500/30 text-yellow-400 hover:bg-yellow-600/40'
                                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                              }`}
                            >
                              {photo.isHighlighted ? 'Unhighlight' : 'Highlight'}
                            </button>
                          )}

                          <button
                            disabled={actionLoading}
                            onClick={() => handleDeletePhoto(photo.id!)}
                            className="py-1.5 px-3 text-xs font-bold bg-red-600 hover:bg-red-700 rounded-lg text-white border border-red-500/30 transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Comments Moderation Panel */}
            {activeTab === 'comments' && canModerateComments && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold font-serif">Comments Moderator</h2>
                  <p className="text-sm text-[#B3CFE5]/60">Oversee discussions, view recent feedback across all blog posts, and delete inappropriate content.</p>
                </div>

                {/* Search Comments */}
                <input
                  type="text"
                  value={searchCommentQuery}
                  onChange={(e) => setSearchCommentQuery(e.target.value)}
                  placeholder="Filter comments by author or content keywords..."
                  className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-white transition"
                />

                {commentsLoading ? (
                  <div className="text-center py-12 text-[#B3CFE5]/60">Loading comment feed...</div>
                ) : filteredComments.length === 0 ? (
                  <div className="text-center py-12 text-[#B3CFE5]/50">No comments found matching search filters.</div>
                ) : (
                  <div className="space-y-3">
                    {filteredComments.map(comment => (
                      <div 
                        key={comment.id}
                        className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 justify-between items-start hover:bg-white/10 transition"
                      >
                        <div className="flex gap-3 min-w-0">
                          {comment.authorPhotoURL ? (
                            <img src={comment.authorPhotoURL} alt={comment.authorName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#1A3D63] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                              {comment.authorName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-white">{comment.authorName}</span>
                              <span className="text-[10px] text-[#B3CFE5]/40">{formatDate(comment.createdAt)}</span>
                              <span className="text-[10px] bg-white/5 text-[#B3CFE5]/60 px-2 py-0.5 rounded border border-white/5">
                                Post ID: {comment.postId}
                              </span>
                            </div>
                            <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                          </div>
                        </div>

                        <button
                          disabled={actionLoading}
                          onClick={() => handleDeleteComment(comment.id)}
                          className="px-3 py-1.5 text-xs font-bold bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/40 rounded-lg transition cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Settings Panel */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold font-serif">Profile Details</h2>
                  <p className="text-sm text-[#B3CFE5]/60">Customize your public writer card details visible in article footnotes.</p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-5 max-w-xl">
                  {/* Photo details */}
                  <div className="flex items-center gap-5">
                    {profileAvatarUrl ? (
                      <img src={profileAvatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border border-[#B3CFE5]/40" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-[#1A3D63] text-white flex items-center justify-center font-extrabold text-3xl">
                        {profileName.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#B3CFE5]/80 uppercase">Update Avatar Image</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setProfileFile(file);
                            setProfileAvatarUrl(URL.createObjectURL(file));
                          }
                        }}
                        className="text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border file:border-white/10 file:bg-white/5 file:text-white file:font-semibold hover:file:bg-white/10 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#B3CFE5]/80 uppercase">Writer Display Name</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3 text-sm focus:outline-none focus:border-white transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#B3CFE5]/80 uppercase">Author Bio / Background</label>
                    <textarea
                      rows={4}
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      placeholder="Share a short summary about your articles, department, or interests at GIKI..."
                      className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3 text-sm focus:outline-none focus:border-white transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="px-6 py-2.5 rounded-full font-bold text-sm bg-[#4A7FA7] hover:bg-[#1A3D63] border border-[#B3CFE5]/30 transition shadow cursor-pointer disabled:opacity-50"
                  >
                    {profileLoading ? 'Saving Profile...' : 'Save Profile Details'}
                  </button>
                </form>
              </div>
            )}

            {/* Rights & Roles Config Panel (Admin Only) */}
            {activeTab === 'rights' && isCmsAdmin && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold font-serif">Rights & Roles Configuration</h2>
                  <p className="text-sm text-[#B3CFE5]/60">Assign roles (`admin`, `editor`, `moderator`, `author`, `user`) to registered users and toggle account blocks.</p>
                </div>

                {/* Search user */}
                <input
                  type="text"
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  placeholder="Find user by display name or email address..."
                  className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-white transition"
                />

                {usersLoading ? (
                  <div className="text-center py-12 text-[#B3CFE5]/60">Loading registered accounts...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12 text-[#B3CFE5]/50">No users found in catalog.</div>
                ) : (
                  <div className="overflow-x-auto border border-white/10 rounded-2xl">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-white/5 border-b border-[#B3CFE5]/10 text-[#B3CFE5]/60 text-xs uppercase font-extrabold">
                          <th className="py-3 px-4">User Details</th>
                          <th className="py-3 px-4">Current Role</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(u => {
                          const isSelf = u.uid === user?.uid;
                          return (
                            <tr key={u.uid} className="border-b border-white/5 hover:bg-white/5 transition">
                              <td className="py-3 px-4">
                                <div className="font-semibold text-white">{u.displayName}</div>
                                <div className="text-xs text-[#B3CFE5]/50">{u.email}</div>
                              </td>
                              <td className="py-3 px-4">
                                {isSelf ? (
                                  <span className="px-2.5 py-1 rounded text-xs bg-red-500/10 text-red-400 border border-red-500/20 font-bold uppercase">
                                    {u.role || 'admin'}
                                  </span>
                                ) : (
                                  <select
                                    value={u.role || 'user'}
                                    disabled={actionLoading}
                                    onChange={(e) => handleRoleChange(u.uid, e.target.value as any)}
                                    className="bg-[#0A1931] border border-[#B3CFE5]/30 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                  >
                                    <option value="admin">Admin</option>
                                    <option value="editor">Editor</option>
                                    <option value="moderator">Moderator</option>
                                    <option value="author">Author</option>
                                    <option value="user">User</option>
                                  </select>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {u.isBlocked ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">Blocked</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">Active</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {isSelf ? (
                                  <span className="text-xs text-[#B3CFE5]/40 italic">You</span>
                                ) : (
                                  <button
                                    disabled={actionLoading}
                                    onClick={() => handleToggleUserBlock(u.uid, u.isBlocked || false)}
                                    className={`px-3 py-1 rounded text-xs font-semibold border transition cursor-pointer ${
                                      u.isBlocked
                                        ? 'bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/40'
                                        : 'bg-red-600/20 border-red-500/30 text-red-400 hover:bg-red-600/40'
                                    }`}
                                  >
                                    {u.isBlocked ? 'Unblock' : 'Block'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm z-50 overflow-y-auto">
          <div 
            className="w-full max-w-2xl rounded-3xl p-6 border border-[#B3CFE5]/30 shadow-2xl relative text-white my-8"
            style={{
              background: 'linear-gradient(135deg, rgba(10,25,49,0.98), rgba(20,45,75,0.98))',
            }}
          >
            <h3 className="text-xl font-bold mb-4 font-serif">Edit Blog Post Details</h3>
            <form onSubmit={handleUpdatePostSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#B3CFE5] uppercase">Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#B3CFE5] uppercase">Genre / Category</label>
                  <input
                    type="text"
                    required
                    value={editGenre}
                    onChange={(e) => setEditGenre(e.target.value)}
                    className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#B3CFE5] uppercase">Description</label>
                <input
                  type="text"
                  required
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#B3CFE5] uppercase">Cover Photo URL</label>
                <input
                  type="text"
                  value={editPhotoUrl}
                  onChange={(e) => setEditPhotoUrl(e.target.value)}
                  className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#B3CFE5] uppercase">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#B3CFE5] uppercase">Content Body (HTML allowed)</label>
                <textarea
                  rows={8}
                  required
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3 text-sm text-white focus:outline-none resize-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 rounded-full text-sm font-semibold border border-white/10 bg-white/5 hover:bg-white/10 text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-full text-sm font-bold bg-green-600 hover:bg-green-700 text-white border border-green-500/30 transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Rejection Modal */}
      {rejectionPostId && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm z-50">
          <div 
            className="w-full max-w-md rounded-3xl p-8 border border-[#B3CFE5]/30 shadow-2xl relative text-white"
            style={{
              background: 'linear-gradient(135deg, rgba(10,25,49,0.98), rgba(20,45,75,0.98))',
            }}
          >
            <h3 className="text-xl font-bold mb-4 font-serif">Post Rejection Reason</h3>
            <form onSubmit={handleRejectPostSubmit} className="space-y-4">
              <textarea
                required
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="State why the article is rejected (visible to author)..."
                className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3 text-white focus:outline-none focus:border-white focus:ring-3 focus:ring-white/10 transition resize-none text-sm"
              />
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setRejectionPostId(null); setRejectionReason(''); }}
                  className="px-4 py-2 rounded-full text-sm font-semibold border border-white/10 bg-white/5 hover:bg-white/10 text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-full text-sm font-bold bg-yellow-600 hover:bg-yellow-700 text-white border border-yellow-500/30 transition cursor-pointer disabled:opacity-60"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Rejection Modal */}
      {rejectionPhotoId && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm z-50">
          <div 
            className="w-full max-w-md rounded-3xl p-8 border border-[#B3CFE5]/30 shadow-2xl relative text-white"
            style={{
              background: 'linear-gradient(135deg, rgba(10,25,49,0.98), rgba(20,45,75,0.98))',
            }}
          >
            <h3 className="text-xl font-bold mb-4 font-serif">Photo Rejection Reason</h3>
            <form onSubmit={handleRejectPhotoSubmit} className="space-y-4">
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejection (optional)..."
                className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3 text-white focus:outline-none focus:border-white focus:ring-3 focus:ring-white/10 transition resize-none text-sm"
              />
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setRejectionPhotoId(null); setRejectionReason(''); }}
                  className="px-4 py-2 rounded-full text-sm font-semibold border border-white/10 bg-white/5 hover:bg-white/10 text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-full text-sm font-bold bg-yellow-600 hover:bg-yellow-700 text-white border border-yellow-500/30 transition cursor-pointer disabled:opacity-60"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
