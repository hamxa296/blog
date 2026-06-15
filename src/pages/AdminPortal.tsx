import React, { useState, useEffect } from 'react';
import { 
  getPendingPosts, 
  updatePostStatus, 
  deletePostPermanently,
  getGalleryPhotos,
  updateGalleryPhotoStatus,
  deleteGalleryPhoto,
  getAllUsers,
  toggleBlockUser,
  type Post,
  type GalleryPhoto,
  type UserProfile
} from '../services/firebase';

export const AdminPortal: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'posts' | 'photos' | 'users'>('posts');
  
  // States
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  
  const [pendingPhotos, setPendingPhotos] = useState<GalleryPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);

  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Modals / Action states
  const [rejectionPostId, setRejectionPostId] = useState<string | null>(null);
  const [rejectionPhotoId, setRejectionPhotoId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Load Pending Posts
  const loadPendingPosts = async () => {
    setPostsLoading(true);
    try {
      const res = await getPendingPosts();
      if (res.success && res.posts) {
        setPendingPosts(res.posts);
      }
    } catch (err) {
      console.error("Error loading pending posts:", err);
    } finally {
      setPostsLoading(false);
    }
  };

  // Load Pending Photos
  const loadPendingPhotos = async () => {
    setPhotosLoading(true);
    try {
      const res = await getGalleryPhotos('pending');
      if (res.success && res.photos) {
        setPendingPhotos(res.photos);
      }
    } catch (err) {
      console.error("Error loading pending photos:", err);
    } finally {
      setPhotosLoading(false);
    }
  };

  // Load Users List
  const loadUsersList = async () => {
    setUsersLoading(true);
    try {
      const res = await getAllUsers();
      if (res.success && res.users) {
        setUsersList(res.users);
      }
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'posts') loadPendingPosts();
    if (activeSubTab === 'photos') loadPendingPhotos();
    if (activeSubTab === 'users') loadUsersList();
  }, [activeSubTab]);

  // Handle Post Actions
  const handleApprovePost = async (id: string) => {
    if (!window.confirm("Approve this post for publishing?")) return;
    setActionLoading(true);
    try {
      const res = await updatePostStatus(id, 'approved');
      if (res.success) {
        setPendingPosts(prev => prev.filter(p => p.id !== id));
        alert("Post approved successfully!");
      } else {
        alert("Error approving post: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionPostId) return;

    setActionLoading(true);
    try {
      const res = await updatePostStatus(rejectionPostId, 'rejected', rejectionReason);
      if (res.success) {
        setPendingPosts(prev => prev.filter(p => p.id !== rejectionPostId));
        setRejectionPostId(null);
        setRejectionReason('');
        alert("Post marked as rejected.");
      } else {
        alert("Error rejecting post: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this post? This cannot be undone.")) return;
    setActionLoading(true);
    try {
      const res = await deletePostPermanently(id);
      if (res.success) {
        setPendingPosts(prev => prev.filter(p => p.id !== id));
        alert("Post permanently deleted.");
      } else {
        alert("Error deleting post: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Photo Actions
  const handleApprovePhoto = async (id: string) => {
    if (!window.confirm("Approve this photo for the gallery?")) return;
    setActionLoading(true);
    try {
      const res = await updateGalleryPhotoStatus(id, 'approved');
      if (res.success) {
        setPendingPhotos(prev => prev.filter(p => p.id !== id));
        alert("Photo approved!");
      } else {
        alert("Error: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionPhotoId) return;

    setActionLoading(true);
    try {
      const res = await updateGalleryPhotoStatus(rejectionPhotoId, 'rejected', rejectionReason);
      if (res.success) {
        setPendingPhotos(prev => prev.filter(p => p.id !== rejectionPhotoId));
        setRejectionPhotoId(null);
        setRejectionReason('');
        alert("Photo rejected.");
      } else {
        alert("Error: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!window.confirm("Permanently delete this photo from database?")) return;
    setActionLoading(true);
    try {
      const res = await deleteGalleryPhoto(id);
      if (res.success) {
        setPendingPhotos(prev => prev.filter(p => p.id !== id));
        alert("Photo deleted.");
      } else {
        alert("Error: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle User Blocking
  const handleToggleBlock = async (uid: string, currentBlocked: boolean) => {
    const action = currentBlocked ? 'unblock' : 'block';
    if (!window.confirm(`Are you sure you want to ${action} this user account?`)) return;
    
    setActionLoading(true);
    try {
      const res = await toggleBlockUser(uid, !currentBlocked);
      if (res.success) {
        setUsersList(prev => prev.map(u => u.uid === uid ? { ...u, isBlocked: !currentBlocked } : u));
        alert(`User account ${action}ed successfully.`);
      } else {
        alert(`Error: ${res.error}`);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (seconds: number | undefined) => {
    if (!seconds) return 'Pending...';
    return new Date(seconds * 1000).toLocaleDateString();
  };

  return (
    <main className="min-h-[calc(100vh-88px)] text-white py-12 relative z-10">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-serif tracking-tight mb-2 flex items-center gap-3">
            🔐 Administrator <span className="text-[#B3CFE5]">Portal</span>
          </h1>
          <p className="text-sm text-[#B3CFE5]/60">
            Moderate post submissions, approve gallery snapshots, and configure user permissions.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#B3CFE5]/10 mb-8 bg-[#0A1931]/20 rounded-t-3xl overflow-hidden">
          <button
            onClick={() => setActiveSubTab('posts')}
            className={`flex-1 py-4 text-center font-bold text-sm border-b-2 cursor-pointer transition-all ${
              activeSubTab === 'posts' 
                ? 'border-[#B3CFE5] text-white bg-white/5' 
                : 'border-transparent text-[#B3CFE5]/60 hover:text-white'
            }`}
          >
            Pending Posts ({postsLoading ? '...' : pendingPosts.length})
          </button>
          <button
            onClick={() => setActiveSubTab('photos')}
            className={`flex-1 py-4 text-center font-bold text-sm border-b-2 cursor-pointer transition-all ${
              activeSubTab === 'photos' 
                ? 'border-[#B3CFE5] text-white bg-white/5' 
                : 'border-transparent text-[#B3CFE5]/60 hover:text-white'
            }`}
          >
            Pending Photos ({photosLoading ? '...' : pendingPhotos.length})
          </button>
          <button
            onClick={() => setActiveSubTab('users')}
            className={`flex-1 py-4 text-center font-bold text-sm border-b-2 cursor-pointer transition-all ${
              activeSubTab === 'users' 
                ? 'border-[#B3CFE5] text-white bg-white/5' 
                : 'border-transparent text-[#B3CFE5]/60 hover:text-white'
            }`}
          >
            Users Moderation ({usersLoading ? '...' : usersList.length})
          </button>
        </div>

        {/* Data Tables / Queues */}
        <div 
          className="rounded-3xl p-6 border border-[#B3CFE5]/25 shadow-2xl backdrop-blur-md relative"
          style={{
            background: 'linear-gradient(135deg, rgba(10,25,49,0.85), rgba(26,61,99,0.85))',
          }}
        >
          {/* Post Submissions Queue */}
          {activeSubTab === 'posts' && (
            <div>
              {postsLoading ? (
                <div className="text-center py-12 text-[#B3CFE5]/60">Loading pending post queue...</div>
              ) : pendingPosts.length === 0 ? (
                <div className="text-center py-12 text-[#B3CFE5]/50">No posts pending moderation.</div>
              ) : (
                <div className="space-y-6">
                  {pendingPosts.map(post => (
                    <div 
                      key={post.id} 
                      className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between gap-6 hover:bg-white/10 transition duration-300"
                    >
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] bg-[#4A7FA7]/20 border border-[#4A7FA7]/30 text-[#B3CFE5] font-extrabold uppercase px-2.5 py-0.5 rounded">
                            {post.genre}
                          </span>
                          <span className="text-xs text-[#B3CFE5]/60">Submitted on {formatDate(post.createdAt?.seconds)}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white leading-tight">{post.title}</h3>
                        <p className="text-sm text-[#B3CFE5]/80 leading-relaxed">{post.description}</p>
                        <div className="text-xs text-[#B3CFE5]/60">
                          By <strong className="text-white">{post.authorName}</strong> (UID: {post.authorId})
                        </div>
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {post.tags.map((tag, idx) => (
                              <span key={idx} className="text-[10px] bg-black/30 px-2 py-0.5 rounded text-[#B3CFE5]/80">#{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Control Operations */}
                      <div className="flex md:flex-col justify-end gap-2.5 min-w-[140px] relative z-20">
                        <button
                          disabled={actionLoading}
                          onClick={() => handleApprovePost(post.id!)}
                          className="px-4 py-2 text-xs font-bold bg-green-600 hover:bg-green-700 rounded-lg text-white border border-green-500/30 transition cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => setRejectionPostId(post.id!)}
                          className="px-4 py-2 text-xs font-bold bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white border border-yellow-500/30 transition cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleDeletePost(post.id!)}
                          className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 rounded-lg text-white border border-red-500/30 transition cursor-pointer"
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

          {/* Gallery Photos Queue */}
          {activeSubTab === 'photos' && (
            <div>
              {photosLoading ? (
                <div className="text-center py-12 text-[#B3CFE5]/60">Loading pending photos queue...</div>
              ) : pendingPhotos.length === 0 ? (
                <div className="text-center py-12 text-[#B3CFE5]/50">No photos pending moderation.</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {pendingPhotos.map(photo => (
                    <div 
                      key={photo.id}
                      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition duration-300 flex flex-col justify-between"
                    >
                      <div>
                        {/* Image Thumbnail */}
                        <div className="h-44 w-full overflow-hidden bg-black/35 relative">
                          <img src={photo.imageUrl} alt={photo.caption} className="w-full h-full object-cover" />
                          <span className="absolute top-3 left-3 bg-[#4A7FA7] text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded border border-[#B3CFE5]/30">
                            {photo.category}
                          </span>
                        </div>
                        <div className="p-5 space-y-2">
                          <p className="text-sm font-semibold text-white">"{photo.caption}"</p>
                          <div className="text-xs text-[#B3CFE5]/60">
                            Uploaded by <strong className="text-white">{photo.uploaderName}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Photo Actions */}
                      <div className="px-5 pb-5 pt-3 border-t border-white/5 flex gap-2 relative z-20">
                        <button
                          disabled={actionLoading}
                          onClick={() => handleApprovePhoto(photo.id!)}
                          className="flex-1 py-2 text-xs font-bold bg-green-600 hover:bg-green-700 rounded-lg text-white border border-green-500/30 transition cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => setRejectionPhotoId(photo.id!)}
                          className="flex-1 py-2 text-xs font-bold bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white border border-yellow-500/30 transition cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleDeletePhoto(photo.id!)}
                          className="flex-1 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 rounded-lg text-white border border-red-500/30 transition cursor-pointer"
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

          {/* User Moderation Directory */}
          {activeSubTab === 'users' && (
            <div>
              {usersLoading ? (
                <div className="text-center py-12 text-[#B3CFE5]/60">Loading user lists...</div>
              ) : usersList.length === 0 ? (
                <div className="text-center py-12 text-[#B3CFE5]/50">No users found in database.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-[#B3CFE5]/10 text-[#B3CFE5]/60">
                        <th className="py-3 px-4">Display Name</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map(item => (
                        <tr key={item.uid} className="border-b border-[#B3CFE5]/5 hover:bg-white/5 transition">
                          <td className="py-3.5 px-4 font-semibold text-white">{item.displayName}</td>
                          <td className="py-3.5 px-4 text-[#B3CFE5]/80">{item.email}</td>
                          <td className="py-3.5 px-4">
                            {item.isAdmin ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">Admin</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Student</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {item.isBlocked ? (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">Blocked</span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">Active</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right relative z-20">
                            {!item.isAdmin ? (
                              <button
                                disabled={actionLoading}
                                onClick={() => handleToggleBlock(item.uid, item.isBlocked || false)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                                  item.isBlocked
                                    ? 'bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/40'
                                    : 'bg-red-600/20 border-red-500/30 text-red-400 hover:bg-red-600/40'
                                }`}
                              >
                                {item.isBlocked ? 'Unblock Account' : 'Block Account'}
                              </button>
                            ) : (
                              <span className="text-xs text-[#B3CFE5]/40 italic">Protected</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Rejection Modal */}
      {rejectionPostId && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm z-50">
          <div 
            className="w-full max-w-md rounded-3xl p-8 border border-[#B3CFE5]/30 shadow-2xl relative text-white"
            style={{
              background: 'linear-gradient(135deg, rgba(10,25,49,0.98), rgba(20,45,75,0.98))',
            }}
          >
            <h3 className="text-xl font-bold mb-4">Post Rejection Reason</h3>
            <form onSubmit={handleRejectPostSubmit} className="space-y-4">
              <textarea
                required
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="State why the article is rejected (visible to author)..."
                className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3 text-white focus:outline-none focus:border-white focus:ring-3 focus:ring-white/10 transition-all resize-none text-sm"
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
            <h3 className="text-xl font-bold mb-4">Photo Rejection Reason</h3>
            <form onSubmit={handleRejectPhotoSubmit} className="space-y-4">
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejection (optional)..."
                className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3 text-white focus:outline-none focus:border-white focus:ring-3 focus:ring-white/10 transition-all resize-none text-sm"
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
