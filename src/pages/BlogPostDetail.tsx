import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  db, 
  getPostById, 
  type Post 
} from '../services/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  orderBy 
} from 'firebase/firestore';

interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  content: string;
  createdAt: any;
}

export const BlogPostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const [post, setPost] = useState<Post | null>(null);
  const [postLoading, setPostLoading] = useState(true);
  const [postError, setPostError] = useState('');

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Fetch Post Content
  useEffect(() => {
    if (!id) return;
    
    const fetchPost = async () => {
      setPostLoading(true);
      setPostError('');
      try {
        const res = await getPostById(id);
        if (res.success && res.post) {
          setPost(res.post);
        } else {
          setPostError(res.error || 'Article not found.');
        }
      } catch (err: any) {
        setPostError(err.message || 'Error occurred while loading post.');
      } finally {
        setPostLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  // Subscribe to Comments
  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, 'comments'),
      where('postId', '==', id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Comment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          postId: data.postId,
          authorId: data.authorId,
          authorName: data.authorName,
          authorPhotoURL: data.authorPhotoURL,
          content: data.content || data.text || '',
          createdAt: data.createdAt
        });
      });
      setComments(items);
    }, (error) => {
      console.error("Comments subscription error:", error);
    });

    return () => unsubscribe();
  }, [id]);

  // Handle Comment Submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || commentInput.trim() === '') return;

    setCommentSubmitting(true);

    try {
      await addDoc(collection(db, 'comments'), {
        postId: id,
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'User',
        authorPhotoURL: user.photoURL || '',
        content: commentInput.trim(),
        createdAt: serverTimestamp()
      });
      setCommentInput('');
    } catch (err: any) {
      alert("Failed to submit comment: " + err.message);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCommentTime = (timestamp: any) => {
    if (!timestamp) return 'just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    const diff = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
    
    const intervals = [
      { seconds: 31536000, label: 'y ago' },
      { seconds: 2592000, label: 'mo ago' },
      { seconds: 86400, label: 'd ago' },
      { seconds: 3600, label: 'h ago' },
      { seconds: 60, label: 'm ago' }
    ];

    for (const interval of intervals) {
      const count = Math.floor(diff / interval.seconds);
      if (count >= 1) return `${count}${interval.label}`;
    }
    return 'just now';
  };

  if (postLoading) {
    return (
      <div className="min-h-[calc(100vh-88px)] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-[#B3CFE5]/30 border-t-[#B3CFE5] rounded-full animate-spin"></div>
        <p className="mt-4 text-[#B3CFE5]/60 text-sm animate-pulse">Retrieving post content...</p>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <main className="container mx-auto px-6 py-20 text-center text-white min-h-[calc(100vh-88px)] flex flex-col justify-center items-center">
        <div className="max-w-md w-full bg-black/40 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
          <h1 className="text-3xl font-bold mb-4 text-red-400">Post Not Found</h1>
          <p className="text-sm text-white/60 mb-6">
            {postError || 'The article you are trying to view is no longer available.'}
          </p>
          <Link to="/browse" className="inline-block bg-[#1A3D63] border border-[#4A7FA7] hover:bg-[#4A7FA7] text-white px-6 py-2 rounded-full transition duration-300 font-semibold">
            Back to Articles
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-88px)] text-white py-12 relative z-10">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <div 
          className="rounded-[2rem] p-4 sm:p-6 lg:p-8 border border-[#B3CFE5]/20 shadow-2xl relative"
          style={{
            background: 'linear-gradient(180deg, rgba(8, 22, 40, 0.88), rgba(15, 43, 73, 0.82))',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Header image cover shell */}
          {post.photoUrl && (
            <div className="w-full h-64 sm:h-[400px] overflow-hidden rounded-2xl border border-white/10 mb-6 relative">
              <img 
                src={post.photoUrl} 
                alt={post.title} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent"></div>
            </div>
          )}

          {/* Badge & Title */}
          <div className="mb-4">
            <span className="bg-[#4A7FA7] text-[#F6FAFD] text-xs font-bold uppercase px-3 py-1 rounded-full border border-[#B3CFE5]/30">
              {post.genre}
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4 text-white">
            {post.title}
          </h1>

          {/* Author Details box */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm">
              <div className="text-[#B3CFE5]/60 text-xs font-semibold uppercase tracking-wider">Author</div>
              <div className="font-bold text-white text-base">{post.authorName}</div>
            </div>
            <div className="text-sm">
              <div className="text-[#B3CFE5]/60 text-xs font-semibold uppercase tracking-wider">Published On</div>
              <div className="font-bold text-white text-base">{formatDate(post.createdAt)}</div>
            </div>
            <div>
              <Link to="/browse" className="text-xs bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2 rounded-full transition inline-block">
                Back to Feed
              </Link>
            </div>
          </div>

          {/* Post Content Prose */}
          <article className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 mb-8">
            <div 
              className="prose prose-invert max-w-none text-[#EAF6FF] text-base sm:text-lg leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag, idx) => (
                <span key={idx} className="bg-white/5 border border-white/10 px-3.5 py-1 rounded-full text-sm text-[#B3CFE5]/80 font-semibold">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Discussion section */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="font-serif text-2xl font-semibold mb-6">Discussion</h2>

            {/* Comment Composer */}
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                disabled={!user || commentSubmitting}
                rows={4}
                placeholder={user ? "Share your thoughts about this post..." : "Sign in to join the conversation."}
                className="w-full bg-[#081628]/70 border border-white/10 rounded-2xl p-4 text-white placeholder-white/35 focus:outline-none focus:border-[#B3CFE5] transition-all resize-none text-sm"
              />
              {user ? (
                <button
                  type="submit"
                  disabled={commentSubmitting || commentInput.trim() === ''}
                  className="mt-3 px-5 py-2.5 rounded-full font-bold text-sm bg-[#4A7FA7] hover:bg-[#1A3D63] border border-[#B3CFE5]/30 transition shadow cursor-pointer disabled:opacity-50"
                >
                  {commentSubmitting ? 'Posting comment...' : 'Post Comment'}
                </button>
              ) : (
                <div className="mt-3 flex gap-2">
                  <Link to={`/login?next=${encodeURIComponent(window.location.pathname)}`} className="px-5 py-2.5 rounded-full font-bold text-sm bg-[#4A7FA7] hover:bg-[#1A3D63] border border-[#B3CFE5]/30 transition inline-block">
                    Log in to Comment
                  </Link>
                </div>
              )}
            </form>

            {/* Comments List */}
            <div className="space-y-4 border-t border-[#B3CFE5]/10 pt-6">
              {comments.length === 0 ? (
                <p className="text-[#B3CFE5]/50 text-sm">No comments yet. Be the first to share your thoughts!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex gap-3 items-start">
                    {comment.authorPhotoURL ? (
                      <img src={comment.authorPhotoURL} alt={comment.authorName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#1A3D63] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {comment.authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1 gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#B3CFE5]">{comment.authorName}</span>
                        <span className="text-xs text-white/45">{formatCommentTime(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-white/80 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};
