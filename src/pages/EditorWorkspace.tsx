import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { RefreshCw, Users } from 'lucide-react';
import galleryBg from '../assets/homepc.webp';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useMediaQuery';
import { Footer } from '../components/nav/Footer';
import { MobileFooter } from '../components/nav/MobileFooter';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import type { Post, PostStatus } from '../services/firebase';
import {
  getEditorialQueue,
  getPublishedByEditor,
  reassignPost,
  listActiveEditors,
  type EditorProfile,
} from '../services/editorialService';

type WorkspaceTab = 'queue' | 'team' | 'archive';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  under_review: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  changes_requested: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  approved: 'bg-green-500/15 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
  draft: 'bg-secondary text-secondary-foreground',
};

function StatusBadge({ status }: { status: PostStatus }) {
  const label = status.replace(/_/g, ' ');
  return (
    <Badge className={`capitalize border ${STATUS_STYLES[status] || ''}`}>
      {label}
    </Badge>
  );
}

function PostCard({
  post,
  showAssignee,
  action,
}: {
  post: Post;
  showAssignee?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
      <div className="aspect-[16/9] overflow-hidden relative">
        <img
          src={post.photoUrl || '/background.webp'}
          alt={post.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
        <div className="absolute top-3 left-3">
          <StatusBadge status={post.status} />
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            {post.genre} · {post.authorName}
          </p>
          <h3 className="text-lg font-semibold tracking-tight line-clamp-2">{post.title}</h3>
          <p className="text-sm text-muted-foreground font-light line-clamp-2 mt-1">
            {post.description}
          </p>
        </div>
        {showAssignee && (
          <p className="text-xs text-muted-foreground">
            Assigned:{' '}
            <span className="text-foreground font-medium">
              {post.assignedEditorName || 'Unassigned'}
            </span>
          </p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {post.id && post.status !== 'approved' && (
            <Link
              to={`/editor/review/${post.id}`}
              className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs uppercase tracking-widest font-medium hover:opacity-90 transition"
            >
              Open Review
            </Link>
          )}
          {post.id && post.status === 'approved' && (
            <Link
              to={`/posts/${post.id}`}
              className="inline-flex items-center justify-center rounded-full border border-border/60 px-4 py-2 text-xs uppercase tracking-widest font-medium hover:bg-secondary transition"
            >
              View Live
            </Link>
          )}
          {action}
        </div>
      </div>
    </article>
  );
}

export const EditorWorkspace: React.FC = () => {
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<WorkspaceTab>('queue');
  const [loading, setLoading] = useState(true);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [teamPosts, setTeamPosts] = useState<Post[]>([]);
  const [archivePosts, setArchivePosts] = useState<Post[]>([]);
  const [teamEditors, setTeamEditors] = useState<EditorProfile[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [mine, team, archive, editors] = await Promise.all([
        getEditorialQueue({ assignedEditorId: user.uid }),
        getEditorialQueue(),
        getPublishedByEditor(user.uid),
        listActiveEditors(),
      ]);

      if (mine.success && mine.posts) setMyPosts(mine.posts);
      else toast.error(mine.error || 'Failed to load your queue.');

      if (team.success && team.posts) setTeamPosts(team.posts);
      else toast.error(team.error || 'Failed to load team board.');

      if (archive.success && archive.posts) setArchivePosts(archive.posts);

      if (editors.success && editors.editors) setTeamEditors(editors.editors);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load editorial workspace.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const awaitingMine = useMemo(
    () => myPosts.filter((p) => p.status === 'pending' || p.status === 'under_review'),
    [myPosts],
  );
  const waitingAuthor = useMemo(
    () => myPosts.filter((p) => p.status === 'changes_requested'),
    [myPosts],
  );

  const handlePickUp = async (post: Post) => {
    if (!user || !post.id) return;
    setBusyId(post.id);
    try {
      const res = await reassignPost(post.id, {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || 'Editor',
      });
      if (res.success) {
        toast.success(`"${post.title}" is now in your queue.`);
        await load();
      } else {
        toast.error(res.error || 'Could not pick up article.');
      }
    } finally {
      setBusyId(null);
    }
  };

  const tabs: { id: WorkspaceTab; label: string }[] = [
    { id: 'queue', label: 'My Queue' },
    { id: 'team', label: 'Team Board' },
    { id: 'archive', label: 'Published Archive' },
  ];

  return (
    <main className="relative z-10 min-h-screen">
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${galleryBg})` }}
      />

      <div className="max-w-6xl mx-auto px-4 pt-10 sm:pt-14 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-muted-foreground font-medium">
              Editorial Board
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
              Review Workspace
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground font-light leading-relaxed">
              Allotted submissions, team visibility, and articles you have published.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-full self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-medium transition border ${
                tab === t.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card/30 text-muted-foreground border-border/50 hover:border-primary/50 backdrop-blur-sm'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {tab === 'queue' && (
              <div className="space-y-10">
                <section className="space-y-4">
                  <h2 className="text-sm uppercase tracking-widest text-yellow-400/90 font-medium">
                    Awaiting My Review ({awaitingMine.length})
                  </h2>
                  {awaitingMine.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No articles waiting in your queue.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {awaitingMine.map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  )}
                </section>

                <section className="space-y-4">
                  <h2 className="text-sm uppercase tracking-widest text-orange-400/90 font-medium">
                    Waiting for Author Revisions ({waitingAuthor.length})
                  </h2>
                  {waitingAuthor.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No revision loops open.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {waitingAuthor.map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {tab === 'team' && (
              <div className="space-y-10">
                {/* ── Active Submissions ── */}
                <section className="space-y-4">
                  <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-medium">
                    All Active Submissions ({teamPosts.length})
                  </h2>
                  {teamPosts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">The team board is clear.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teamPosts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          showAssignee
                          action={
                            post.assignedEditorId !== user?.uid ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={busyId === post.id}
                                onClick={() => void handlePickUp(post)}
                                className="rounded-full text-xs uppercase tracking-widest"
                              >
                                {busyId === post.id ? 'Assigning…' : 'Pick Up / Reassign to Me'}
                              </Button>
                            ) : null
                          }
                        />
                      ))}
                    </div>
                  )}
                </section>

                {/* ── Editorial Team Roster ── */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-medium">
                      Editorial Team ({teamEditors.length})
                    </h2>
                  </div>
                  {teamEditors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No editors found.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {teamEditors.map((editor) => (
                        <div
                          key={editor.uid}
                          className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md p-4 flex items-center gap-4 shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
                        >
                          {editor.photoURL ? (
                            <img
                              src={editor.photoURL}
                              alt={editor.displayName}
                              className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                              onError={(e) => {
                                const t = e.currentTarget;
                                t.onerror = null;
                                t.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(editor.displayName)}&background=1a3d63&color=ffffff&size=80&bold=true&format=png`;
                              }}
                            />
                          ) : (
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(editor.displayName)}&background=1a3d63&color=ffffff&size=80&bold=true&format=png`}
                              alt={editor.displayName}
                              className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{editor.displayName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                className={`text-[10px] capitalize border ${
                                  editor.role === 'admin'
                                    ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                                    : editor.role === 'moderator'
                                    ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                }`}
                              >
                                {editor.role}
                              </Badge>
                              <span className="text-[11px] text-muted-foreground">
                                {editor.editorialLoad} active
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {tab === 'archive' && (
              <div className="space-y-4">
                <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-medium">
                  Published by You ({archivePosts.length})
                </h2>
                {archivePosts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Articles you approve will appear here.
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {archivePosts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {!isMobile && (
        <div className="relative z-20">
          <Footer />
        </div>
      )}
      {isMobile && <MobileFooter />}
    </main>
  );
};

export default EditorWorkspace;
