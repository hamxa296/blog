import React, { useState, useEffect } from 'react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
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
  getContactMessages,
  deleteContactMessage,
  type ContactMessage,
  type Post,
  type GalleryPhoto,
  type UserProfile
} from '../services/firebase';
import {
  fetchAnalyticsSummary,
  logAdminAudit,
  type AnalyticsSummary,
  type AnalyticsEvent,
  type AdminAuditEntry,
  type PackingListUserSummary,
} from '../services/analyticsService';
import {
  TrendingUp,
  Users as UsersIcon,
  Package as PackageIcon,
  Eye,
  Activity,
  FileText,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Download,
  Smartphone,
  Laptop,
  Search as SearchIcon,
  ShieldAlert,
  ListChecks,
  Compass,
  MessageSquare,
  Sparkles,
  MapPin,
  Image as ImageIcon,
  BarChart3,
  Flame,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageOptimization';
import { BlockEditor } from '../components/editor/BlockEditor';
import {
  type Block,
  serializeBlocks,
  deserializeContent,
  createBlock,
} from '../types/blockTypes';
import { sanitizeBlocks } from '../utils/sanitize';
import { toast } from 'sonner';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'posts' | 'gallery' | 'comments' | 'profile' | 'rights' | 'inbox'>('overview');

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<'today' | '7d' | '30d' | 'all'>('all');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'activity' | 'packing' | 'traffic' | 'audit'>('activity');
  const [activityFilter, setActivityFilter] = useState<'all' | 'traffic' | 'guide' | 'packing' | 'blog' | 'admin' | 'engagement'>('all');
  const [searchActivityQuery, setSearchActivityQuery] = useState('');

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

  const [inboxMessages, setInboxMessages] = useState<ContactMessage[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);

  // Editing / Moderating Modals
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editBlocks, setEditBlocks] = useState<Block[]>([createBlock('paragraph')]);
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

  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; variant: 'primary' | 'danger' | 'warning'; onConfirm: () => void }>({ isOpen: false, title: '', message: '', variant: 'primary', onConfirm: () => {} });
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' | 'info') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 3000);
  };

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

  const loadAnalytics = async (timeRange = analyticsTimeRange) => {
    setAnalyticsLoading(true);
    try {
      const summary = await fetchAnalyticsSummary(timeRange);
      setAnalyticsData(summary);
    } catch (err) {
      console.error('Error loading analytics:', err);
      toast.error('Failed to load live analytics data.');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!analyticsData) return;
    const rows = [
      ['Event Type', 'Category', 'Title', 'Path', 'User', 'Device', 'Browser', 'Timestamp'],
      ...analyticsData.recentActivities.map(e => [
        `"${e.type}"`,
        `"${e.category}"`,
        `"${(e.title || '').replace(/"/g, '""')}"`,
        `"${e.path}"`,
        `"${e.userEmail || 'Anonymous'}"`,
        `"${e.device}"`,
        `"${e.browser || 'Unknown'}"`,
        `"${e.createdAt}"`,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `giki_chronicles_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Analytics CSV exported successfully.');
  };

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

  const loadInbox = async () => {
    setInboxLoading(true);
    const res = await getContactMessages();
    if (res.success && res.messages) {
      setInboxMessages(res.messages);
    }
    setInboxLoading(false);
  };

  // Trigger loads based on active tab
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverviewMetrics();
      loadAnalytics(analyticsTimeRange);
    }
    if (activeTab === 'analytics') loadAnalytics(analyticsTimeRange);
    if (activeTab === 'posts') loadPosts();
    if (activeTab === 'gallery') loadPhotos();
    if (activeTab === 'comments') loadComments();
    if (activeTab === 'rights') loadUsers();
    if (activeTab === 'inbox') loadInbox();
  }, [activeTab, postFilter, photoFilter, analyticsTimeRange]);

  const handleRefresh = () => {
    if (activeTab === 'overview') {
      fetchOverviewMetrics();
      loadAnalytics(analyticsTimeRange);
    }
    if (activeTab === 'analytics') loadAnalytics(analyticsTimeRange);
    if (activeTab === 'posts') loadPosts();
    if (activeTab === 'gallery') loadPhotos();
    if (activeTab === 'comments') loadComments();
    if (activeTab === 'rights') loadUsers();
    if (activeTab === 'inbox') loadInbox();
  };

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

  const formatRelativeTime = (isoString?: string | number) => {
    if (!isoString) return 'recently';
    const date = typeof isoString === 'number' ? new Date(isoString) : new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Actions: Post
  const handleApprovePost = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: "Approve Article",
      message: "Are you sure you want to approve this article for publishing?",
      variant: 'primary',
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setActionLoading(true);
        const res = await updatePostStatus(id, 'approved');
        if (res.success) {
          showStatus("Post approved!", "success");
          logAdminAudit('Approve Article', 'post', id);
          setPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
          fetchOverviewMetrics();
        } else {
          showStatus("Failed: " + res.error, "error");
        }
        setActionLoading(false);
      }
    });
  };

  const handleRejectPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionPostId) return;
    setActionLoading(true);
    const res = await updatePostStatus(rejectionPostId, 'rejected', rejectionReason);
    if (res.success) {
      showStatus("Post rejected with feedback.", "success");
      logAdminAudit('Reject Article', 'post', rejectionPostId, { reason: rejectionReason });
      setPosts(prev => prev.map(p => p.id === rejectionPostId ? { ...p, status: 'rejected', rejectionReason } : p));
      setRejectionPostId(null);
      setRejectionReason('');
      fetchOverviewMetrics();
    } else {
      showStatus("Failed: " + res.error, "error");
    }
    setActionLoading(false);
  };

  const handleToggleFeatured = async (id: string, isFeatured: boolean) => {
    setActionLoading(true);
    const res = await toggleFeaturedStatus(id, !isFeatured);
    if (res.success) {
      showStatus("Featured status updated!", "success");
      logAdminAudit('Toggle Featured Article', 'post', id, { isFeatured: !isFeatured });
      setPosts(prev => prev.map(p => p.id === id ? { ...p, isFeatured: !isFeatured } : p));
    } else {
      showStatus("Failed: " + res.error, "error");
    }
    setActionLoading(false);
  };

  const handleDeletePost = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: "Delete Article",
      message: "Are you sure you want to permanently delete this article? This action cannot be undone.",
      variant: 'danger',
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setActionLoading(true);
        const res = await deletePostPermanently(id);
        if (res.success) {
          showStatus("Post deleted.", "success");
          logAdminAudit('Delete Article Permanently', 'post', id);
          setPosts(prev => prev.filter(p => p.id !== id));
          fetchOverviewMetrics();
        } else {
          showStatus("Failed: " + res.error, "error");
        }
        setActionLoading(false);
      }
    });
  };

  const handleDeleteMessage = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: "Delete Message",
      message: "Are you sure you want to delete this message?",
      variant: 'danger',
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setActionLoading(true);
        const res = await deleteContactMessage(id);
        if (res.success) {
          showStatus("Message deleted.", "success");
          logAdminAudit('Delete Contact Message', 'inbox', id);
          setInboxMessages(prev => prev.filter(m => m.id !== id));
        } else {
          showStatus("Failed: " + res.error, "error");
        }
        setActionLoading(false);
      }
    });
  };

  const handleOpenEdit = (post: Post) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditDesc(post.description);
    setEditGenre(post.genre);
    setEditTags(post.tags.join(', '));
    setEditPhotoUrl(post.photoUrl);
    const { blocks: loaded, isLegacy } = deserializeContent(post.content || '');
    if (isLegacy && post.content) {
      setEditBlocks([{ id: 'legacy', type: 'paragraph', data: { html: post.content } }]);
    } else {
      setEditBlocks(loaded.length > 0 ? loaded : [createBlock('paragraph')]);
    }
  };

  const handleUpdatePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !editingPost.id) return;
    setActionLoading(true);
    
    if (!canModeratePosts && editingPost.authorId !== user?.uid) {
      toast.error("Unauthorized to edit this post.");
      setActionLoading(false);
      return;
    }

    const content = serializeBlocks(sanitizeBlocks(editBlocks));
    const res = await updatePost(editingPost.id, {
      title: editTitle,
      content,
      description: editDesc,
      photoUrl: editPhotoUrl,
      genre: editGenre,
      tags: editTags
    });

    if (res.success) {
      toast.success("Post updated successfully!");
      logAdminAudit('Edit Article Content', 'post', editingPost.id, { title: editTitle });
      setEditingPost(null);
      loadPosts();
    } else {
      toast.error("Failed to update post: " + (res.error ? res.error : ""));
    }
    setActionLoading(false);
  };

  // Actions: Gallery
  const handleApprovePhoto = async (id: string) => {
    setActionLoading(true);
    const res = await updateGalleryPhotoStatus(id, 'approved');
    if (res.success) {
      toast.success("Photo approved.");
      logAdminAudit('Approve Gallery Photo', 'gallery', id);
      loadPhotos();
      fetchOverviewMetrics();
    } else {
      toast.error("Failed: " + (res.error ? res.error : ""));
    }
    setActionLoading(false);
  };

  const handleRejectPhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionPhotoId) return;
    setActionLoading(true);
    const res = await updateGalleryPhotoStatus(rejectionPhotoId, 'rejected', rejectionReason);
    if (res.success) {
      toast.success("Photo rejected.");
      logAdminAudit('Reject Gallery Photo', 'gallery', rejectionPhotoId, { reason: rejectionReason });
      setRejectionPhotoId(null);
      setRejectionReason('');
      loadPhotos();
      fetchOverviewMetrics();
    } else {
      toast.error("Failed: " + (res.error ? res.error : ""));
    }
    setActionLoading(false);
  };

  const handleTogglePhotoHighlight = async (id: string, isHighlighted: boolean) => {
    setActionLoading(true);
    const res = await togglePhotoHighlight(id, !isHighlighted);
    if (res.success) {
      toast.success("Highlight status toggled.");
      logAdminAudit('Toggle Photo Highlight', 'gallery', id, { isHighlighted: !isHighlighted });
      loadPhotos();
    } else {
      toast.error("Failed: " + (res.error ? res.error : ""));
    }
    setActionLoading(false);
  };

  const handleDeletePhoto = async (id: string) => {
    if (!window.confirm("Permanently delete this photo?")) return;
    setActionLoading(true);
    const res = await deleteGalleryPhoto(id);
    if (res.success) {
      toast.success("Photo deleted.");
      logAdminAudit('Delete Photo Permanently', 'gallery', id);
      loadPhotos();
      fetchOverviewMetrics();
    } else {
      toast.error("Failed: " + (res.error ? res.error : ""));
    }
    setActionLoading(false);
  };

  // Actions: Comments
  const handleDeleteComment = async (id: string) => {
    if (!window.confirm("Delete this comment?")) return;
    setActionLoading(true);
    const res = await deleteComment(id);
    if (res.success) {
      toast.success("Comment removed.");
      logAdminAudit('Delete Comment', 'comment', id);
      loadComments();
      fetchOverviewMetrics();
    } else {
      toast.error("Failed: " + (res.error ? res.error : ""));
    }
    setActionLoading(false);
  };

  // Actions: Rights
  const handleRoleChange = async (uid: string, newRole: 'admin' | 'editor' | 'moderator' | 'author' | 'user') => {
    if (!window.confirm(`Change this user's role to ${newRole}?`)) return;
    setActionLoading(true);
    const res = await updateUserRole(uid, newRole);
    if (res.success) {
      toast.success("User role updated successfully.");
      logAdminAudit('Update User Role', 'user', uid, { newRole });
      loadUsers();
    } else {
      toast.error("Failed: " + (res.error ? res.error : ""));
    }
    setActionLoading(false);
  };

  const handleToggleUserBlock = async (uid: string, currentBlocked: boolean) => {
    if (!window.confirm(`Are you sure you want to ${currentBlocked ? 'unblock' : 'block'} this account?`)) return;
    setActionLoading(true);
    const res = await toggleBlockUser(uid, !currentBlocked);
    if (res.success) {
      toast.success("User status updated.");
      logAdminAudit(currentBlocked ? 'Unblock User' : 'Block User', 'user', uid);
      loadUsers();
    } else {
      toast.error("Failed: " + (res.error ? res.error : ""));
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
          toast.error("Avatar upload failed: " + uploadRes.error);
        }
      }

      const updateRes = await updateUserProfile(user.uid, {
        displayName: profileName,
        bio: profileBio,
        photoURL: finalAvatarUrl
      });

      if (updateRes.success) {
        toast.success("Profile details updated successfully!");
        setProfileFile(null);
        await refreshProfile();
      } else {
        toast.error("Failed to update profile: " + (updateRes.error ? updateRes.error : ""));
      }
    } catch (err: any) {
      toast.error("Error: " + (err.message ? err.message : ""));
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

  const filteredComments = comments.filter(c => {
    return c.content.toLowerCase().includes(searchCommentQuery.toLowerCase()) ||
           c.authorName.toLowerCase().includes(searchCommentQuery.toLowerCase());
  });

  const filteredUsers = users.filter(u => {
    const nameMatch = (u.displayName || '').toLowerCase().includes(searchUserQuery.toLowerCase());
    const emailMatch = (u.email || '').toLowerCase().includes(searchUserQuery.toLowerCase());
    return nameMatch || emailMatch;
  });

  const filteredActivities = (analyticsData?.recentActivities || []).filter(item => {
    if (activityFilter !== 'all') {
      if (activityFilter === 'traffic' && item.type !== 'page_view') return false;
      if (activityFilter === 'guide' && item.category !== 'guide') return false;
      if (activityFilter === 'packing' && item.category !== 'packing') return false;
      if (activityFilter === 'blog' && item.category !== 'blog') return false;
      if (activityFilter === 'admin' && item.category !== 'admin') return false;
      if (activityFilter === 'engagement' && item.category !== 'engagement') return false;
    }
    if (searchActivityQuery.trim()) {
      const q = searchActivityQuery.toLowerCase();
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchPath = (item.path || '').toLowerCase().includes(q);
      const matchUser = (item.userEmail || '').toLowerCase().includes(q);
      return matchTitle || matchPath || matchUser;
    }
    return true;
  });

  const renderActivityIcon = (event: AnalyticsEvent) => {
    switch (event.category) {
      case 'packing':
        return <PackageIcon className="w-4 h-4 text-pink-400" />;
      case 'guide':
        return <Compass className="w-4 h-4 text-emerald-400" />;
      case 'blog':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'map':
        return <MapPin className="w-4 h-4 text-amber-400" />;
      case 'gallery':
        return <ImageIcon className="w-4 h-4 text-purple-400" />;
      case 'admin':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'engagement':
        return <MessageSquare className="w-4 h-4 text-cyan-400" />;
      default:
        return <Eye className="w-4 h-4 text-[#B3CFE5]" />;
    }
  };

  return (
    <main className="min-h-screen bg-[#06101E] text-white p-4 sm:p-6 lg:p-10 font-sans pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header Card */}
        <div className="bg-[#0A1931]/80 border border-[#B3CFE5]/20 rounded-3xl p-6 sm:p-8 backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4A7FA7]/20 border border-[#4A7FA7]/40 text-[#B3CFE5] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Content Management & Analytics Hub
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif tracking-tight text-white">
              GIKI Chronicles Admin CMS
            </h1>
            <p className="text-sm text-[#B3CFE5]/70 mt-1">
              Live visitor analytics, packing list metrics, editorial review queues, and user permissions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-[#4A7FA7]/20 hover:bg-[#4A7FA7]/40 border border-[#B3CFE5]/30 rounded-2xl px-4 py-3 text-sm font-semibold transition cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              Refresh
            </button>
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
              onClick={() => setActiveTab('analytics')}
              className={`w-full text-left px-4 py-3 rounded-2xl font-semibold text-sm transition flex items-center justify-between cursor-pointer ${
                activeTab === 'analytics' ? 'bg-[#4A7FA7]/30 border border-[#B3CFE5]/35 text-white' : 'text-[#B3CFE5]/70 hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                📈 Live Analytics & Activity
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
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

            {isCmsAdmin && (
              <button
                onClick={() => setActiveTab('inbox')}
                className={`w-full text-left px-4 py-3 rounded-2xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer ${
                  activeTab === 'inbox' ? 'bg-[#4A7FA7]/30 border border-[#B3CFE5]/35 text-white' : 'text-[#B3CFE5]/70 hover:bg-white/5 border border-transparent'
                }`}
              >
                📥 Support Inbox
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
            {/* Status Message */}
            {statusMsg && (
              <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-sm font-semibold shadow-2xl backdrop-blur-md border animate-in fade-in slide-in-from-top-5 ${
                statusMsg.type === 'success' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                statusMsg.type === 'error' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}>
                {statusMsg.text}
              </div>
            )}
            
            <ConfirmModal 
              isOpen={modalConfig.isOpen}
              title={modalConfig.title}
              message={modalConfig.message}
              variant={modalConfig.variant}
              onConfirm={modalConfig.onConfirm}
              onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
            />
            
            {/* Overview / Analytics Panel */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold font-serif mb-1">System Overview & Activity</h2>
                    <p className="text-sm text-[#B3CFE5]/60">Numerical overview and live engagement indicators.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/30 border border-primary/40 text-primary-foreground text-xs font-bold hover:bg-primary/50 transition cursor-pointer"
                  >
                    Open Deep Analytics Hub <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">
                    <div className="flex items-center justify-between text-[#B3CFE5]/60 text-xs font-bold uppercase tracking-wider">
                      <span>Total Visits</span>
                      <Eye className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-3xl font-bold mt-2 text-white">{analyticsData?.totalPageviews ?? '...'}</div>
                    <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {analyticsData?.todayPageviews ?? 0} today
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">
                    <div className="flex items-center justify-between text-[#B3CFE5]/60 text-xs font-bold uppercase tracking-wider">
                      <span>Active Packing Lists</span>
                      <PackageIcon className="w-4 h-4 text-pink-400" />
                    </div>
                    <div className="text-3xl font-bold mt-2 text-white">
                      {analyticsData?.packingAnalytics.totalActiveLists ?? '...'}
                    </div>
                    <div className="text-xs text-[#B3CFE5]/50 mt-1">
                      {analyticsData?.packingAnalytics.totalItemsChecked ?? 0} items packed
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">
                    <div className="flex items-center justify-between text-[#B3CFE5]/60 text-xs font-bold uppercase tracking-wider">
                      <span>Published Blogs</span>
                      <FileText className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-3xl font-bold mt-2 text-white">{metrics.totalPosts}</div>
                    <div className="text-xs text-[#B3CFE5]/40 mt-1">{metrics.pendingPosts} awaiting review</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">
                    <div className="flex items-center justify-between text-[#B3CFE5]/60 text-xs font-bold uppercase tracking-wider">
                      <span>Users & Photos</span>
                      <UsersIcon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-3xl font-bold mt-2 text-white">{metrics.totalUsers}</div>
                    <div className="text-xs text-[#B3CFE5]/40 mt-1">{metrics.totalPhotos} gallery photos</div>
                  </div>
                </div>

                {/* Quick Packing Lists & Activity Preview */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Packing list completion overview */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <PackageIcon className="w-4 h-4 text-pink-400" />
                        Freshman Packing Progress
                      </h3>
                      <span className="text-xs font-extrabold text-pink-400 px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20">
                        {analyticsData?.packingAnalytics.averageCompletionRate ?? 0}% Avg Complete
                      </span>
                    </div>
                    <p className="text-xs text-[#B3CFE5]/70">
                      Tracking active packing sessions created by students preparing for GIKI arrival.
                    </p>
                    <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden border border-white/10">
                      <div 
                        className="bg-gradient-to-r from-pink-500 to-purple-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${analyticsData?.packingAnalytics.averageCompletionRate ?? 0}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                      <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                        <div className="text-[#B3CFE5]/50">Total Students</div>
                        <div className="text-lg font-bold text-white mt-0.5">
                          {analyticsData?.packingAnalytics.totalActiveLists ?? 0}
                        </div>
                      </div>
                      <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                        <div className="text-[#B3CFE5]/50">Total Items Checked</div>
                        <div className="text-lg font-bold text-white mt-0.5">
                          {analyticsData?.packingAnalytics.totalItemsChecked ?? 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Live Activity Snippet */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        Live Visitor Activity Feed
                      </h3>
                      <button 
                        onClick={() => setActiveTab('analytics')}
                        className="text-xs text-[#B3CFE5] hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        View All <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 text-xs">
                      {(analyticsData?.recentActivities || []).slice(0, 5).map((act, i) => (
                        <div key={act.id || i} className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition">
                          <div className="flex items-start gap-2.5">
                            <span className="p-1.5 rounded-lg bg-white/5 border border-white/10 mt-0.5">
                              {renderActivityIcon(act)}
                            </span>
                            <div>
                              <div className="font-semibold text-white leading-snug">{act.title}</div>
                              <div className="text-[11px] text-[#B3CFE5]/50 font-mono mt-0.5">{act.path}</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-[#B3CFE5]/40 whitespace-nowrap">
                            {formatRelativeTime(act.timestamp || act.createdAt)}
                          </span>
                        </div>
                      ))}
                      {(analyticsData?.recentActivities || []).length === 0 && (
                        <div className="text-center py-6 text-[#B3CFE5]/40 text-xs">
                          No visitor events logged yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Permissions Summary Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-lg">System Permissions Summary</h3>
                  <div className="text-sm text-[#B3CFE5]/80 space-y-2">
                    <p>🎭 Your current role is <strong className="text-white uppercase">{role}</strong>.</p>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#B3CFE5]/70">
                      <li><strong>Admins</strong> have full access to real-time analytics, article review queues, user roles, guide edits, and audit logs.</li>
                      <li><strong>Editors</strong> can moderate and edit all posts, approve gallery photos, and moderate comments.</li>
                      <li><strong>Moderators</strong> can approve gallery photos and delete comments.</li>
                      <li><strong>Authors</strong> can publish their own posts (pending approval) and edit their own articles.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* FULL ANALYTICS HUB PANEL */}
            {activeTab === 'analytics' && (
              <div className="space-y-8">
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold font-serif mb-1 flex items-center gap-2">
                      <BarChart3 className="w-6 h-6 text-primary" />
                      Live Visitor Analytics & Activity Stream
                    </h2>
                    <p className="text-sm text-[#B3CFE5]/60">
                      Monitor student traffic, packing checklist progress, content popularity, and system changes in real time.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Time Range Pills */}
                    <div className="flex bg-[#0A1931]/80 rounded-xl p-1 border border-white/10 text-xs font-bold">
                      {(['today', '7d', '30d', 'all'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => {
                            setAnalyticsTimeRange(t);
                            loadAnalytics(t);
                          }}
                          className={`px-3 py-1.5 rounded-lg capitalize cursor-pointer transition ${
                            analyticsTimeRange === t ? 'bg-[#4A7FA7] text-white' : 'text-[#B3CFE5]/60 hover:text-white'
                          }`}
                        >
                          {t === '7d' ? '7 Days' : t === '30d' ? '30 Days' : t === 'all' ? 'All Time' : 'Today'}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleExportCsv}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-[#B3CFE5] hover:text-white transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> CSV
                    </button>
                  </div>
                </div>

                {/* Top KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">
                    <div className="flex items-center justify-between text-[#B3CFE5]/60 text-xs font-bold uppercase tracking-wider">
                      <span>Total Pageviews</span>
                      <Eye className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-3xl font-bold mt-2 text-white">{analyticsData?.totalPageviews ?? '...'}</div>
                    <div className="text-xs text-[#B3CFE5]/50 mt-1 flex items-center justify-between">
                      <span>{analyticsData?.uniqueSessions ?? 0} unique sessions</span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">
                    <div className="flex items-center justify-between text-[#B3CFE5]/60 text-xs font-bold uppercase tracking-wider">
                      <span>Active Packing Lists</span>
                      <PackageIcon className="w-4 h-4 text-pink-400" />
                    </div>
                    <div className="text-3xl font-bold mt-2 text-pink-400">
                      {analyticsData?.packingAnalytics.totalActiveLists ?? '...'}
                    </div>
                    <div className="text-xs text-[#B3CFE5]/50 mt-1">
                      {analyticsData?.packingAnalytics.averageCompletionRate ?? 0}% avg completion
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">
                    <div className="flex items-center justify-between text-[#B3CFE5]/60 text-xs font-bold uppercase tracking-wider">
                      <span>Items Packed</span>
                      <ListChecks className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-3xl font-bold mt-2 text-white">
                      {analyticsData?.packingAnalytics.totalItemsChecked ?? '...'}
                    </div>
                    <div className="text-xs text-emerald-400/80 mt-1">Across all active freshmen</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">
                    <div className="flex items-center justify-between text-[#B3CFE5]/60 text-xs font-bold uppercase tracking-wider">
                      <span>Device Ratio</span>
                      <Smartphone className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold mt-2 text-white">
                      {analyticsData ? Math.round(((analyticsData.mobileCount || 1) / Math.max(1, (analyticsData.mobileCount + analyticsData.desktopCount))) * 100) : 0}% Mobile
                    </div>
                    <div className="text-xs text-[#B3CFE5]/50 mt-1">
                      {analyticsData?.desktopCount ?? 0} desktop sessions
                    </div>
                  </div>
                </div>

                {/* Sub-Tabs Selector */}
                <div className="flex border-b border-white/10 gap-4 overflow-x-auto pb-2 text-sm font-semibold">
                  <button
                    onClick={() => setAnalyticsSubTab('activity')}
                    className={`pb-2 px-1 border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                      analyticsSubTab === 'activity' ? 'border-[#4A7FA7] text-white' : 'border-transparent text-[#B3CFE5]/60 hover:text-white'
                    }`}
                  >
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Live Activity Stream ({filteredActivities.length})
                  </button>

                  <button
                    onClick={() => setAnalyticsSubTab('packing')}
                    className={`pb-2 px-1 border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                      analyticsSubTab === 'packing' ? 'border-[#4A7FA7] text-white' : 'border-transparent text-[#B3CFE5]/60 hover:text-white'
                    }`}
                  >
                    <PackageIcon className="w-4 h-4 text-pink-400" />
                    Packing Lists Deep Dive ({analyticsData?.packingAnalytics.totalActiveLists ?? 0})
                  </button>

                  <button
                    onClick={() => setAnalyticsSubTab('traffic')}
                    className={`pb-2 px-1 border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                      analyticsSubTab === 'traffic' ? 'border-[#4A7FA7] text-white' : 'border-transparent text-[#B3CFE5]/60 hover:text-white'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    Traffic & Searches
                  </button>

                  <button
                    onClick={() => setAnalyticsSubTab('audit')}
                    className={`pb-2 px-1 border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                      analyticsSubTab === 'audit' ? 'border-[#4A7FA7] text-white' : 'border-transparent text-[#B3CFE5]/60 hover:text-white'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Site Changes & Audit Trail ({analyticsData?.adminAuditLogs.length ?? 0})
                  </button>
                </div>

                {/* Sub-Tab 1: Live Activity Stream */}
                {analyticsSubTab === 'activity' && (
                  <div className="space-y-4">
                    {/* Filters & Search */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                      <div className="flex flex-wrap gap-1.5">
                        {(['all', 'traffic', 'guide', 'packing', 'blog', 'admin', 'engagement'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => setActivityFilter(f)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition cursor-pointer border ${
                              activityFilter === f ? 'bg-[#4A7FA7] border-[#B3CFE5]/50 text-white' : 'bg-black/20 border-white/10 text-[#B3CFE5]/60 hover:text-white'
                            }`}
                          >
                            {f === 'traffic' ? 'Visits' : f}
                          </button>
                        ))}
                      </div>

                      <div className="relative w-full sm:w-64">
                        <SearchIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#B3CFE5]/40" />
                        <input
                          type="text"
                          value={searchActivityQuery}
                          onChange={(e) => setSearchActivityQuery(e.target.value)}
                          placeholder="Filter activities..."
                          className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-white transition"
                        />
                      </div>
                    </div>

                    {/* Activity Feed */}
                    {analyticsLoading ? (
                      <div className="text-center py-16 text-[#B3CFE5]/60">Refreshing activity stream...</div>
                    ) : filteredActivities.length === 0 ? (
                      <div className="text-center py-16 text-[#B3CFE5]/40 bg-black/20 rounded-2xl border border-white/5">
                        No activity events match your current filter.
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                        {filteredActivities.map((act, idx) => (
                          <div
                            key={act.id || idx}
                            className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/10 transition"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-xl bg-black/30 border border-white/10 mt-0.5">
                                {renderActivityIcon(act)}
                              </div>
                              <div className="space-y-1">
                                <div className="font-semibold text-sm text-white flex items-center gap-2 flex-wrap">
                                  <span>{act.title}</span>
                                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/10 text-[#B3CFE5]/80 border border-white/10">
                                    {act.category}
                                  </span>
                                </div>
                                <div className="text-xs text-[#B3CFE5]/60 flex items-center gap-3 flex-wrap">
                                  <span className="font-mono">{act.path}</span>
                                  <span>•</span>
                                  <span className="text-[#B3CFE5]/80">{act.userEmail || 'Anonymous Guest'}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    {act.device === 'mobile' ? <Smartphone className="w-3 h-3" /> : <Laptop className="w-3 h-3" />}
                                    {act.device} ({act.browser || 'Browser'})
                                  </span>
                                </div>
                                {act.details && Object.keys(act.details).length > 0 && (
                                  <div className="flex items-center gap-2 flex-wrap pt-1">
                                    {Object.entries(act.details).map(([k, v]) => (
                                      <span key={k} className="text-[10px] bg-black/30 border border-white/10 px-2 py-0.5 rounded text-[#B3CFE5]/80">
                                        <strong className="text-white">{k}:</strong> {String(v)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-[#B3CFE5]/50 whitespace-nowrap sm:text-right">
                              {formatRelativeTime(act.timestamp || act.createdAt)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-Tab 2: Packing Lists Deep Dive */}
                {analyticsSubTab === 'packing' && (
                  <div className="space-y-8">
                    {/* Top Essentials Bar Chart */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-base flex items-center gap-2">
                          <Flame className="w-4 h-4 text-amber-400" />
                          Top 10 Most Packed Essentials Across GIKI
                        </h3>
                        <span className="text-xs text-[#B3CFE5]/60">Calculated across all saved student lists</span>
                      </div>

                      <div className="space-y-3">
                        {(analyticsData?.packingAnalytics.mostPackedItems || []).map((item, idx) => (
                          <div key={item.label} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-white">
                                #{idx + 1} {item.label}
                              </span>
                              <span className="text-[#B3CFE5]/70">
                                {item.count} students ({item.percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden border border-white/10">
                              <div
                                className="bg-gradient-to-r from-pink-500 to-purple-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                        {(analyticsData?.packingAnalytics.mostPackedItems || []).length === 0 && (
                          <div className="text-center py-6 text-[#B3CFE5]/40 text-xs">
                            No student packing data recorded yet.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Student Packing Lists Table */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <UsersIcon className="w-4 h-4 text-blue-400" />
                        Individual Student Packing Sessions
                      </h3>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-white/10 text-[#B3CFE5]/60 uppercase tracking-wider">
                              <th className="py-3 px-4">Student</th>
                              <th className="py-3 px-4">Items Packed</th>
                              <th className="py-3 px-4">Progress</th>
                              <th className="py-3 px-4">Last Active</th>
                              <th className="py-3 px-4">Sample Checked Items</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {(analyticsData?.packingAnalytics.userLists || []).map((userList) => (
                              <tr key={userList.userId} className="hover:bg-white/5 transition">
                                <td className="py-3 px-4 font-semibold text-white">
                                  {userList.userEmail || userList.userName || `User ${userList.userId.slice(0, 8)}...`}
                                </td>
                                <td className="py-3 px-4 text-white">
                                  {userList.checkedCount} / {userList.totalItems}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-20 bg-black/40 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className="bg-pink-500 h-full rounded-full"
                                        style={{ width: `${userList.percentage}%` }}
                                      />
                                    </div>
                                    <span className="font-mono text-[11px] text-pink-400">{userList.percentage}%</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-[#B3CFE5]/60">
                                  {formatRelativeTime(userList.lastUpdated)}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1 flex-wrap max-w-xs">
                                    {userList.checkedItemLabels.slice(0, 3).map((itemLabel, i) => (
                                      <span key={i} className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-[#B3CFE5]/80">
                                        {itemLabel}
                                      </span>
                                    ))}
                                    {userList.checkedItemLabels.length > 3 && (
                                      <span className="text-[10px] text-[#B3CFE5]/40">
                                        +{userList.checkedItemLabels.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {(analyticsData?.packingAnalytics.userLists || []).length === 0 && (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-[#B3CFE5]/40">
                                  No saved packing sessions found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-Tab 3: Traffic & Searches */}
                {analyticsSubTab === 'traffic' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Top Visited Pages */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                        Top Visited Routes
                      </h3>
                      <div className="space-y-3">
                        {(analyticsData?.topPages || []).map((page, idx) => (
                          <div key={page.path} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-white font-mono">{page.path}</span>
                              <span className="text-[#B3CFE5]/70">{page.count} visits</span>
                            </div>
                            <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-blue-500 h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.round((page.count / Math.max(1, (analyticsData?.topPages[0]?.count || 1))) * 100))}%`
                                }}
                              />
                            </div>
                          </div>
                        ))}
                        {(analyticsData?.topPages || []).length === 0 && (
                          <div className="text-center py-6 text-[#B3CFE5]/40 text-xs">No pageview data recorded yet.</div>
                        )}
                      </div>
                    </div>

                    {/* Top Guide Sections */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <Compass className="w-4 h-4 text-emerald-400" />
                        Top Viewed Guide Sections
                      </h3>
                      <div className="space-y-3">
                        {(analyticsData?.topGuideSections || []).map((sec) => (
                          <div key={sec.section} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-white">{sec.section}</span>
                              <span className="text-[#B3CFE5]/70">{sec.count} views</span>
                            </div>
                            <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.round((sec.count / Math.max(1, (analyticsData?.topGuideSections[0]?.count || 1))) * 100))}%`
                                }}
                              />
                            </div>
                          </div>
                        ))}
                        {(analyticsData?.topGuideSections || []).length === 0 && (
                          <div className="text-center py-6 text-[#B3CFE5]/40 text-xs">No section clicks recorded yet.</div>
                        )}
                      </div>
                    </div>

                    {/* Top Search Queries */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 md:col-span-2">
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <SearchIcon className="w-4 h-4 text-amber-400" />
                        Student Search Queries in Blog
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(analyticsData?.topSearches || []).map((search) => (
                          <span
                            key={search.query}
                            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white flex items-center gap-2"
                          >
                            <span>&quot;{search.query}&quot;</span>
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-bold text-[10px]">
                              {search.count} searches
                            </span>
                          </span>
                        ))}
                        {(analyticsData?.topSearches || []).length === 0 && (
                          <div className="text-center py-4 text-[#B3CFE5]/40 text-xs w-full">
                            No search terms logged yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-Tab 4: Admin Audit Trail */}
                {analyticsSubTab === 'audit' && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                        Audit Log: Every Content & Permission Change
                      </h3>
                      <span className="text-xs text-[#B3CFE5]/60">Permanent record of moderation actions</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-[#B3CFE5]/60 uppercase tracking-wider">
                            <th className="py-3 px-4">Action</th>
                            <th className="py-3 px-4">Performed By</th>
                            <th className="py-3 px-4">Target</th>
                            <th className="py-3 px-4">Details</th>
                            <th className="py-3 px-4">Date & Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {(analyticsData?.adminAuditLogs || []).map((entry) => (
                            <tr key={entry.id} className="hover:bg-white/5 transition">
                              <td className="py-3 px-4 font-bold text-white">
                                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10">
                                  {entry.action}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-[#B3CFE5]">
                                {entry.performedBy} <span className="text-[#B3CFE5]/40">({entry.performerEmail})</span>
                              </td>
                              <td className="py-3 px-4 font-mono text-[#B3CFE5]/70">
                                {entry.targetType ? `${entry.targetType}: ` : ''}{entry.targetId || '—'}
                              </td>
                              <td className="py-3 px-4 text-[#B3CFE5]/70 max-w-xs truncate">
                                {entry.details ? JSON.stringify(entry.details) : '—'}
                              </td>
                              <td className="py-3 px-4 text-[#B3CFE5]/50 whitespace-nowrap">
                                {formatRelativeTime(entry.timestamp || entry.createdAt)}
                              </td>
                            </tr>
                          ))}
                          {(analyticsData?.adminAuditLogs || []).length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-[#B3CFE5]/40">
                                No admin audit entries recorded yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
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
                              {post.isFeatured && (
                                <span className="text-[10px] uppercase font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                                  ★ Featured
                                </span>
                              )}
                            </div>

                            <h3 className="text-xl font-bold text-white">{post.title}</h3>
                            <p className="text-sm text-[#B3CFE5]/70 line-clamp-2">{post.description}</p>
                            
                            <div className="text-xs text-[#B3CFE5]/50 flex items-center gap-4 pt-1">
                              <span>By <strong className="text-white">{post.authorName}</strong></span>
                              <span>Date: {formatDate(post.createdAt)}</span>
                            </div>

                            {post.status === 'rejected' && post.rejectionReason && (
                              <div className="mt-2 text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 p-2.5 rounded-xl">
                                <strong>Feedback:</strong> {post.rejectionReason}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-row md:flex-col justify-end gap-2 shrink-0">
                            {canModeratePosts && post.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprovePost(post.id!)}
                                  disabled={actionLoading}
                                  className="px-3.5 py-1.5 rounded-xl bg-green-500/20 hover:bg-green-500/40 text-green-400 border border-green-500/30 text-xs font-bold transition cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => setRejectionPostId(post.id!)}
                                  disabled={actionLoading}
                                  className="px-3.5 py-1.5 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 border border-yellow-500/30 text-xs font-bold transition cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {canModeratePosts && (
                              <button
                                onClick={() => handleToggleFeatured(post.id!, !!post.isFeatured)}
                                disabled={actionLoading}
                                className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/30 text-amber-300 border border-amber-500/20 text-xs font-bold transition cursor-pointer"
                              >
                                {post.isFeatured ? 'Unfeature' : 'Feature'}
                              </button>
                            )}

                            {canEditThis && (
                              <button
                                onClick={() => handleOpenEdit(post)}
                                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 text-xs font-bold transition cursor-pointer"
                              >
                                Edit Post
                              </button>
                            )}

                            {canModeratePosts && (
                              <button
                                onClick={() => handleDeletePost(post.id!)}
                                disabled={actionLoading}
                                className="px-3.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 text-xs font-bold transition cursor-pointer"
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

            {/* Gallery Approvals Panel */}
            {activeTab === 'gallery' && canModerateGallery && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold font-serif">Gallery Approvals</h2>
                    <p className="text-sm text-[#B3CFE5]/60">Moderate photos uploaded by campus photographers.</p>
                  </div>
                  
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
                  <div className="text-center py-12 text-[#B3CFE5]/60">Loading photos queue...</div>
                ) : photos.length === 0 ? (
                  <div className="text-center py-12 text-[#B3CFE5]/50">No photos in this category.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {photos.map(photo => (
                      <div key={photo.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition flex flex-col justify-between">
                        <div className="relative aspect-video">
                          <img 
                            src={getOptimizedImageUrl(photo.url, 'medium')} 
                            alt={photo.caption || 'Campus photo'} 
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute top-2 right-2">
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                              photo.status === 'approved' ? 'bg-green-500/80 text-white' :
                              photo.status === 'rejected' ? 'bg-yellow-500/80 text-white' :
                              'bg-blue-500/80 text-white'
                            }`}>
                              {photo.status}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 space-y-2 flex-1">
                          <h4 className="font-bold text-white text-sm">{photo.caption || 'No caption provided'}</h4>
                          <p className="text-xs text-[#B3CFE5]/60">Uploader: {photo.uploaderName || 'Anonymous'}</p>
                          {photo.rejectionReason && (
                            <p className="text-xs text-yellow-300">Reason: {photo.rejectionReason}</p>
                          )}
                        </div>

                        <div className="p-4 pt-0 flex gap-2 flex-wrap">
                          {photo.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprovePhoto(photo.id!)}
                                className="flex-1 py-1.5 rounded-xl bg-green-500/20 hover:bg-green-500/40 text-green-400 text-xs font-bold transition border border-green-500/30"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectionPhotoId(photo.id!)}
                                className="flex-1 py-1.5 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 text-xs font-bold transition border border-yellow-500/30"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleTogglePhotoHighlight(photo.id!, !!photo.isHighlighted)}
                            className="py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 text-xs font-bold transition border border-amber-500/30"
                          >
                            {photo.isHighlighted ? '★ Highlighted' : 'Highlight'}
                          </button>
                          <button
                            onClick={() => handleDeletePhoto(photo.id!)}
                            className="py-1.5 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs font-bold transition border border-red-500/30"
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

            {/* Comments Moderator Panel */}
            {activeTab === 'comments' && canModerateComments && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold font-serif">Comments Moderator</h2>
                  <p className="text-sm text-[#B3CFE5]/60">Manage student discussions and remove inappropriate content.</p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={searchCommentQuery}
                    onChange={(e) => setSearchCommentQuery(e.target.value)}
                    placeholder="Search comments by author or content..."
                    className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-white transition"
                  />
                </div>

                {commentsLoading ? (
                  <div className="text-center py-12 text-[#B3CFE5]/60">Loading comments...</div>
                ) : filteredComments.length === 0 ? (
                  <div className="text-center py-12 text-[#B3CFE5]/50">No comments found.</div>
                ) : (
                  <div className="space-y-3">
                    {filteredComments.map(comment => (
                      <div key={comment.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-start gap-4 hover:bg-white/10 transition">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{comment.authorName}</span>
                            <span className="text-xs text-[#B3CFE5]/40">{formatDate(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-[#B3CFE5]/80">{comment.content}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs font-bold border border-red-500/30 transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Support Inbox Panel */}
            {activeTab === 'inbox' && isCmsAdmin && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold font-serif">Support & Contact Inbox</h2>
                  <p className="text-sm text-[#B3CFE5]/60">Messages submitted via the contact form.</p>
                </div>

                {inboxLoading ? (
                  <div className="text-center py-12 text-[#B3CFE5]/60">Loading inbox...</div>
                ) : inboxMessages.length === 0 ? (
                  <div className="text-center py-12 text-[#B3CFE5]/50">No incoming messages in inbox.</div>
                ) : (
                  <div className="space-y-4">
                    {inboxMessages.map(msg => (
                      <div key={msg.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="font-bold text-white text-base">{msg.subject || 'No Subject'}</div>
                            <div className="text-xs text-[#B3CFE5]/60 mt-0.5">
                              From <strong className="text-white">{msg.name}</strong> ({msg.email}) • {formatDate(msg.createdAt)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteMessage(msg.id!)}
                            className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs font-bold border border-red-500/30 transition"
                          >
                            Delete
                          </button>
                        </div>
                        <p className="text-sm text-[#B3CFE5]/90 whitespace-pre-wrap bg-black/20 p-3.5 rounded-xl border border-white/5">
                          {msg.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Edit Panel */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold font-serif">Your Profile Details</h2>
                  <p className="text-sm text-[#B3CFE5]/60">Update your public author credentials and avatar.</p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-5 max-w-lg">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#B3CFE5]/70 mb-2">Display Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#B3CFE5]/70 mb-2">Bio / Description</label>
                    <textarea
                      rows={3}
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white transition resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#B3CFE5]/70 mb-2">Profile Picture File</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProfileFile(e.target.files ? e.target.files[0] : null)}
                      className="w-full text-xs text-[#B3CFE5]/80 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#4A7FA7]/30 file:text-white hover:file:bg-[#4A7FA7]/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="px-6 py-3 rounded-full text-sm font-bold bg-[#4A7FA7] hover:bg-[#3B6686] text-white shadow-lg transition cursor-pointer disabled:opacity-60"
                  >
                    {profileLoading ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* Rights & Roles Panel */}
            {activeTab === 'rights' && isCmsAdmin && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold font-serif">Rights & Roles Configuration</h2>
                  <p className="text-sm text-[#B3CFE5]/60">Manage permissions, grant admin roles, or restrict accounts.</p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    placeholder="Search users by name or email..."
                    className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-white transition"
                  />
                </div>

                {usersLoading ? (
                  <div className="text-center py-12 text-[#B3CFE5]/60">Loading users roster...</div>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.map(u => (
                      <div key={u.uid} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/10 transition">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{u.displayName || 'Unnamed User'}</span>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white/10 text-[#B3CFE5]">
                              {u.role || 'author'}
                            </span>
                            {u.isBlocked && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                Blocked
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#B3CFE5]/50 mt-0.5">{u.email}</div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <select
                            value={u.role || 'author'}
                            onChange={(e) => handleRoleChange(u.uid, e.target.value as any)}
                            disabled={actionLoading || u.uid === user?.uid}
                            className="bg-[#0A1931] border border-[#B3CFE5]/30 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
                          >
                            <option value="user">User</option>
                            <option value="author">Author</option>
                            <option value="moderator">Moderator</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>

                          <button
                            onClick={() => handleToggleUserBlock(u.uid, !!u.isBlocked)}
                            disabled={actionLoading || u.uid === user?.uid}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              u.isBlocked 
                                ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/40' 
                                : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/40'
                            }`}
                          >
                            {u.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        </div>
                      </div>
                    ))}
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
            className="w-full max-w-3xl rounded-3xl p-6 sm:p-8 border border-[#B3CFE5]/30 shadow-2xl relative my-8 text-white"
            style={{
              background: 'linear-gradient(135deg, rgba(10,25,49,0.98), rgba(20,45,75,0.98))',
            }}
          >
            <h3 className="text-2xl font-bold mb-4 font-serif">Edit Chronicle Article</h3>
            <form onSubmit={handleUpdatePostSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#B3CFE5]/70 mb-1.5">Article Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#B3CFE5]/70 mb-1.5">Short Excerpt / Description</label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#B3CFE5]/70 mb-1.5">Genre</label>
                  <input
                    type="text"
                    value={editGenre}
                    onChange={(e) => setEditGenre(e.target.value)}
                    className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#B3CFE5]/70 mb-1.5">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#B3CFE5]/70 mb-1.5">Cover Photo URL</label>
                <input
                  type="text"
                  value={editPhotoUrl}
                  onChange={(e) => setEditPhotoUrl(e.target.value)}
                  className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#B3CFE5]/70 mb-1.5">Block Editor Content</label>
                <div className="border border-[#B3CFE5]/30 rounded-2xl p-4 bg-black/20 max-h-96 overflow-y-auto">
                  <BlockEditor blocks={editBlocks} onChange={setEditBlocks} />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold border border-white/10 bg-white/5 hover:bg-white/10 text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-full text-sm font-bold bg-[#4A7FA7] hover:bg-[#3B6686] text-white transition cursor-pointer disabled:opacity-60 shadow-lg"
                >
                  {actionLoading ? 'Updating...' : 'Save & Submit'}
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
            <h3 className="text-xl font-bold mb-4 font-serif">Article Rejection Reason</h3>
            <form onSubmit={handleRejectPostSubmit} className="space-y-4">
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide constructive feedback for the author..."
                required
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
