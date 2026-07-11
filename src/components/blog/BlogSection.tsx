import { Link } from 'react-router-dom';
import { LazyImage } from './LazyImage';
import type { Post } from '../../services/firebase';

interface BlogSectionProps {
  posts: Post[];
  loading?: boolean;
}

function formatDate(seconds: number | undefined) {
  if (!seconds) return 'Unknown date';
  return new Date(seconds * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function estimateReadTime(content: string) {
  const words = content.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function BlogSection({ posts, loading }: BlogSectionProps) {
  return (
    <div className="mx-auto w-full max-w-5xl grow relative">
      <div className="space-y-1 px-4 py-8">
        <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Chronicles</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Student Stories</h1>
        <p className="text-muted-foreground text-sm md:text-base font-light max-w-lg">
          Discover the latest stories, guides, and insights from the GIKI community.
        </p>
      </div>

      <div className="absolute inset-x-0 h-px w-full border-b border-border/50" />

      {loading ? (
        <div className="grid p-4 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-lg p-2">
              <div className="aspect-[3/4] bg-muted rounded-lg animate-pulse mb-3" />
              <div className="h-4 bg-muted rounded animate-pulse mb-2 w-3/4" />
              <div className="h-3 bg-muted rounded animate-pulse w-full" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-semibold text-foreground mb-2">No posts yet</p>
          <p className="text-sm font-light">Check back soon for new chronicles from the Valley.</p>
        </div>
      ) : (
        <div className="grid p-4 md:grid-cols-2 lg:grid-cols-3 z-10 gap-4">
          {posts.map((post) => (
            <Link
              to={`/posts/${post.id}`}
              key={post.id}
              className="group border border-border/30 hover:border-primary/50 transition-colors duration-700 overflow-hidden"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                <LazyImage
                  src={post.photoUrl || 'https://placehold.co/640x360?text=GIKI+Chronicles'}
                  fallback="https://placehold.co/640x360?text=GIKI+Chronicles"
                  inView
                  alt={post.title}
                  ratio={3 / 4}
                  className="transition-all duration-1000 grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100"
                />
              </div>
              <div className="space-y-2 px-4 py-5 text-center">
                <span className="text-[9px] text-muted-foreground uppercase tracking-[0.4em] font-light">
                  {post.genre || 'Chronicle'}
                </span>
                <h3 className="text-sm uppercase font-normal text-foreground line-clamp-2 tracking-widest">
                  {post.title}
                </h3>
                <div className="text-muted-foreground flex items-center justify-center gap-2 text-[10px] flex-wrap font-light">
                  <span>by {post.authorName}</span>
                  <span className="bg-muted-foreground/40 size-1 rounded-full" />
                  <span>{formatDate(post.createdAt?.seconds)}</span>
                  <span className="bg-muted-foreground/40 size-1 rounded-full" />
                  <span>{estimateReadTime(post.content)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
