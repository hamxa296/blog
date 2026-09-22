import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, MessageSquareWarning, Ban, UserPlus } from 'lucide-react';
import galleryBg from '../assets/homepc.webp';
import { useAuth } from '../context/AuthContext';
import { getPostById, type Post, type PostFeedbackEntry } from '../services/firebase';
import {
  approvePost,
  listActiveEditors,
  markUnderReview,
  reassignPost,
  rejectPost,
  requestChanges,
  type EditorRef,
} from '../services/editorialService';
import { BlockRenderer } from '../components/renderer/BlockRenderer';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { calculateReadTime } from '../types/blockTypes';

function formatFeedbackTime(entry: PostFeedbackEntry): string {
  const ts = entry.createdAt;
  if (!ts) return '';
  try {
    const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date((ts as { seconds: number }).seconds * 1000);
    return date.toLocaleString();
  } catch {
    return '';
  }
}

export const EditorReviewDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [editors, setEditors] = useState<EditorRef[]>([]);
  const [reassignTo, setReassignTo] = useState('');

  const load = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await getPostById(postId);
      if (!res.success || !res.post) {
        toast.error(res.error || 'Post not found.');
        navigate('/editor');
        return;
      }
      setPost(res.post);
      if (res.post.status === 'pending') {
        await markUnderReview(postId);
        setPost({ ...res.post, status: 'under_review' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load article.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    void listActiveEditors().then((res) => {
      if (res.success && res.editors) setEditors(res.editors);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const readMins = useMemo(
    () => (post ? calculateReadTime(post.content || '') : 1),
    [post],
  );

  const history = post?.feedbackHistory || [];

  const runAction = async (fn: () => Promise<{ success: boolean; error?: string }>, okMsg: string) => {
    setBusy(true);
    try {
      const res = await fn();
      if (res.success) {
        toast.success(okMsg);
        navigate('/editor');
      } else {
        toast.error(res.error || 'Action failed.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="relative z-10 min-h-screen flex items-center justify-center">
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${galleryBg})` }}
        />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </main>
    );
  }

  if (!post) return null;

  return (
    <main className="relative z-10 min-h-screen pb-24">
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${galleryBg})` }}
      />

      <div className="max-w-7xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link
            to="/editor"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to workspace
          </Link>
          <Badge className="capitalize border bg-card/50">
            {post.status.replace(/_/g, ' ')}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.75fr)] gap-6 items-start">
          {/* Left: article inspector */}
          <article className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="aspect-[16/9] overflow-hidden relative">
              <img
                src={post.photoUrl || '/background.webp'}
                alt={post.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
            </div>
            <div className="p-5 sm:p-8 space-y-4">
              <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>{post.genre}</span>
                <span>·</span>
                <span>{readMins} min read</span>
                <span>·</span>
                <span>By {post.authorName}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{post.title}</h1>
              {post.description && (
                <p className="text-muted-foreground font-light leading-relaxed">{post.description}</p>
              )}
              {post.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border/50 px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="border-t border-border/40 pt-6">
                <BlockRenderer content={post.content} />
              </div>
            </div>
          </article>

          {/* Right: action console */}
          <aside className="lg:sticky lg:top-24 space-y-4">
            <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-md p-5 space-y-4 shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
              <div>
                <h2 className="text-sm font-semibold tracking-tight">Editorial Console</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Assigned to {post.assignedEditorName || 'Unassigned'}
                </p>
              </div>

              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Audit Log</p>
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No prior feedback rounds.</p>
                ) : (
                  [...history].reverse().map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-border/40 bg-background/40 p-3 space-y-1"
                    >
                      <div className="flex justify-between gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                        <span>{entry.editorName}</span>
                        <span>{entry.statusSnapshot.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{entry.feedbackText}</p>
                      <p className="text-[10px] text-muted-foreground">{formatFeedbackTime(entry)}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Feedback Composer
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={5}
                  placeholder="Concrete revision points for the author…"
                  className="w-full rounded-xl bg-card/50 border border-border/50 px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 resize-y min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  disabled={busy || post.status === 'approved'}
                  onClick={() =>
                    void runAction(() => approvePost(post.id!), 'Article approved and published.')
                  }
                  className="w-full rounded-full bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve & Publish
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void runAction(
                      () => requestChanges(post.id!, feedback),
                      'Revision request sent to author.',
                    )
                  }
                  className="w-full rounded-full border-orange-500/40 text-orange-300 hover:bg-orange-500/10"
                >
                  <MessageSquareWarning className="h-4 w-4 mr-2" />
                  Request Revisions
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void runAction(
                      () => rejectPost(post.id!, feedback || post.rejectionReason || ''),
                      'Article rejected.',
                    )
                  }
                  className="w-full rounded-full border-red-500/40 text-red-300 hover:bg-red-500/10"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>

              <div className="border-t border-border/40 pt-4 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <UserPlus className="h-3.5 w-3.5" />
                  Reassign
                </p>
                <select
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  className="w-full appearance-none rounded-full bg-card/50 border border-border/50 px-4 py-2.5 text-sm focus:outline-none"
                >
                  <option value="">Select editor…</option>
                  {editors
                    .filter((e) => e.uid !== post.assignedEditorId)
                    .map((e) => (
                      <option key={e.uid} value={e.uid}>
                        {e.displayName}
                      </option>
                    ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy || !reassignTo}
                  onClick={() => {
                    const target = editors.find((e) => e.uid === reassignTo);
                    if (!target || !post.id) return;
                    void runAction(
                      () => reassignPost(post.id!, target),
                      `Reassigned to ${target.displayName}.`,
                    );
                  }}
                  className="w-full rounded-full"
                >
                  Confirm Reassign
                </Button>
                {user && post.assignedEditorId !== user.uid && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() =>
                      void runAction(
                        () =>
                          reassignPost(post.id!, {
                            uid: user.uid,
                            displayName:
                              profile?.displayName || user.displayName || 'Editor',
                          }),
                        'Article moved to your queue.',
                      )
                    }
                    className="w-full rounded-full text-xs"
                  >
                    Take over this review
                  </Button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default EditorReviewDetail;
