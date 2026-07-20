import { GlassBlogCard } from './GlassBlogCard';
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
    <div className="mx-auto w-full max-w-6xl grow relative">
      <div className="space-y-1 px-4 py-8">
        <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
          Chronicles
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
          Student Stories
        </h1>
        <p className="text-muted-foreground text-sm md:text-base font-light max-w-lg">
          Discover the latest stories, guides, and insights from the GIKI
          community.
        </p>
      </div>

      {loading ? (
        <div className="grid p-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden"
            >
              <div className="aspect-[16/9] bg-muted animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-3 bg-muted rounded animate-pulse w-full" />
                <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-semibold text-foreground mb-2">
            No posts yet
          </p>
          <p className="text-sm font-light">
            Check back soon for new chronicles from the Valley.
          </p>
        </div>
      ) : (
        <div className="grid p-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {posts.map((post, index) => (
            <GlassBlogCard
              key={post.id}
              href={`/posts/${post.id}`}
              title={post.title}
              excerpt={post.description || post.title}
              image={
                post.photoUrl ||
                'https://placehold.co/800x450?text=GIKI+Chronicles'
              }
              author={{
                name: post.authorName || 'Author',
                avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(post.authorName || 'A')}`,
              }}
              date={formatDate(post.createdAt?.seconds)}
              readTime={estimateReadTime(post.content || '')}
              tags={
                post.tags?.length
                  ? post.tags
                  : post.genre
                    ? [post.genre]
                    : ['Chronicle']
              }
              className={
                index % 5 === 0
                  ? 'sm:col-span-2 lg:col-span-1'
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
