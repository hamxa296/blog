import React, { useState, useEffect } from 'react';
import { getApprovedPosts, type Post } from '../services/firebase';
import { BlogSection } from '../components/blog/BlogSection';

import mobileBg from "../assets/plainbg.png"
export const BlogBrowse: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');

  const genres = ['all', 'Academic', 'Cultural', 'Sports', 'General'];

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await getApprovedPosts();
        if (res.success && res.posts) setPosts(res.posts);
      } catch (err) {
        console.error('Error loading posts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter((post) => {
    if (selectedGenre !== 'all' && post.genre.toLowerCase() !== selectedGenre.toLowerCase()) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        post.title.toLowerCase().includes(term) ||
        post.description.toLowerCase().includes(term) ||
        post.authorName.toLowerCase().includes(term) ||
        post.tags.some((tag) => tag.toLowerCase().includes(term))
      );
    }
    return true;
  });

  return (
    <main
      className="relative z-10 min-h-screen bg-cover bg-center bg-fixed bg-no-repeat pb-24"
      style={{
        backgroundImage: `url(${mobileBg})`,
      }}
    >
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search chronicles..."
            className="flex-1 bg-card/50 border border-border/50 backdrop-blur-sm rounded-full px-5 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 text-sm font-light"
          />
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-medium transition border ${
                  selectedGenre.toLowerCase() === genre.toLowerCase()
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card/30 text-muted-foreground border-border/50 hover:border-primary/50 backdrop-blur-sm'
                }`}
              >
                {genre === 'all' ? 'All' : genre}
              </button>
            ))}
          </div>
        </div>
      </div>
      <BlogSection posts={filteredPosts} loading={loading} />
    </main>
  );
};
