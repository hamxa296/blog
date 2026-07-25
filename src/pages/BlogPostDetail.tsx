import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, getPostById, type Post } from '../services/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Clock, ArrowLeft, BookOpen } from 'lucide-react';
import bgImage from "../assets/bgblog.png"; // adjust the path if needed

interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  content: string;
  createdAt: unknown;
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
      } catch (err: unknown) {
        setPostError(err instanceof Error ? err.message : 'Error occurred while loading post.');
      } finally {
        setPostLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, 'comments'),
      where('postId', '==', id),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Comment[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            postId: data.postId,
            authorId: data.authorId,
            authorName: data.authorName,
            authorPhotoURL: data.authorPhotoURL,
            content: data.content || data.text || '',
            createdAt: data.createdAt,
          });
        });
        setComments(items);
      },
      (error) => {
        console.error('Comments subscription error:', error);
      },
    );

    return () => unsubscribe();
  }, [id]);

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
        createdAt: serverTimestamp(),
      });
      setCommentInput('');
    } catch (err: unknown) {
      alert(
        'Failed to submit comment: ' +
          (err instanceof Error ? err.message : 'Unknown error'),
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  const formatDate = (timestamp: { toDate?: () => Date; seconds?: number } | null) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate
      ? timestamp.toDate()
      : new Date((timestamp.seconds || 0) * 1000);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCommentTime = (timestamp: { toDate?: () => Date; seconds?: number } | null) => {
    if (!timestamp) return 'just now';
    const date = timestamp.toDate
      ? timestamp.toDate()
      : new Date((timestamp.seconds || 0) * 1000);
    const diff = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));

    const intervals = [
      { seconds: 31536000, label: 'y ago' },
      { seconds: 2592000, label: 'mo ago' },
      { seconds: 86400, label: 'd ago' },
      { seconds: 3600, label: 'h ago' },
      { seconds: 60, label: 'm ago' },
    ];

    for (const interval of intervals) {
      const count = Math.floor(diff / interval.seconds);
      if (count >= 1) return `${count}${interval.label}`;
    }
    return 'just now';
  };

  if (postLoading) {
    return (
      <div className="min-h-[calc(100vh-88px)] flex flex-col items-center justify-center bg-background text-foreground pb-24">
        <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin" />
        <p className="mt-4 text-muted-foreground text-sm animate-pulse">
          Retrieving post content...
        </p>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <main className="container mx-auto px-6 py-20 text-center min-h-[calc(100vh-88px)] flex flex-col justify-center items-center bg-background text-foreground pb-24">
        <div className="max-w-md w-full rounded-2xl border border-border/50 bg-card/30 backdrop-blur-md p-8">
          <h1 className="text-3xl font-bold mb-4 text-destructive">Post Not Found</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {postError || 'The article you are trying to view is no longer available.'}
          </p>
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Articles
          </Link>
        </div>
      </main>
    );
  }

  const readTime = Math.max(
    1,
    Math.ceil((post.content || '').split(/\s+/).length / 200),
  );

  return (
    <main
      className="min-h-[calc(100vh-88px)] text-foreground py-12 relative z-10 pb-24 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-md overflow-hidden shadow-xl shadow-primary/5">
          {post.photoUrl && (
            <div className="relative w-full aspect-[16/9] overflow-hidden">
              <img
                src={post.photoUrl}
                alt={post.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-background/50 backdrop-blur-sm">
                  {post.genre}
                </Badge>
                {post.tags?.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-background/50 backdrop-blur-sm"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="p-6 sm:p-8 space-y-6">
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Feed
            </Link>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight">
              {post.title}
            </h1>

            <div className="flex items-center justify-between border-y border-border/50 py-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border/50">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(post.authorName || 'A')}`}
                    alt={post.authorName}
                  />
                  <AvatarFallback>{post.authorName?.[0] || 'A'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-sm">
                  <span className="font-medium">{post.authorName}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(post.createdAt as { seconds?: number })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{readTime} min read</span>
              </div>
            </div>

            {post.description && (
              <p className="text-muted-foreground text-lg leading-relaxed">
                {post.description}
              </p>
            )}

            <article
              className="prose prose-invert max-w-none text-foreground/90 text-base sm:text-lg leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <section className="border-t border-border/50 pt-8">
              <h2 className="flex items-center gap-2 text-2xl font-semibold mb-6">
                <BookOpen className="h-5 w-5" />
                Discussion
              </h2>

              <form onSubmit={handleCommentSubmit} className="mb-6">
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  disabled={!user || commentSubmitting}
                  rows={4}
                  placeholder={
                    user
                      ? 'Share your thoughts about this post...'
                      : 'Sign in to join the conversation.'
                  }
                  className="w-full rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all resize-none text-sm"
                />
                {user ? (
                  <button
                    type="submit"
                    disabled={commentSubmitting || commentInput.trim() === ''}
                    className="mt-3 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 disabled:opacity-50"
                  >
                    {commentSubmitting ? 'Posting comment...' : 'Post Comment'}
                  </button>
                ) : (
                  <Link
                    to={`/login?next=${encodeURIComponent(window.location.pathname)}`}
                    className="mt-3 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
                  >
                    Log in to Comment
                  </Link>
                )}
              </form>

              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-4 flex gap-3 items-start"
                    >
                      <Avatar className="h-8 w-8 border border-border/50 shrink-0">
                        <AvatarImage
                          src={comment.authorPhotoURL}
                          alt={comment.authorName}
                        />
                        <AvatarFallback>
                          {comment.authorName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1 gap-2 flex-wrap">
                          <span className="text-sm font-semibold">
                            {comment.authorName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatCommentTime(
                              comment.createdAt as {
                                toDate?: () => Date;
                                seconds?: number;
                              },
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};
