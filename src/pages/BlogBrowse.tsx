import React, { useState, useEffect } from 'react';
import { getApprovedPosts, type Post } from '../services/firebase';
import { Link } from 'react-router-dom';

export const BlogBrowse: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');

  const genres = ['all', 'Academic', 'Cultural', 'Sports', 'General'];

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getApprovedPosts();
        if (res.success && res.posts) {
          setPosts(res.posts);
        } else {
          setError(res.error || 'Failed to fetch posts.');
        }
      } catch (err: any) {
        setError(err.message || 'Error occurred while loading posts.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Filter and sort posts
  const filteredPosts = posts
    .filter(post => {
      // Genre filter
      if (selectedGenre !== 'all' && post.genre.toLowerCase() !== selectedGenre.toLowerCase()) {
        return false;
      }
      // Search term filter
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const titleMatch = post.title.toLowerCase().includes(term);
        const descMatch = post.description.toLowerCase().includes(term);
        const authorMatch = post.authorName.toLowerCase().includes(term);
        const tagsMatch = post.tags.some(tag => tag.toLowerCase().includes(term));
        return titleMatch || descMatch || authorMatch || tagsMatch;
      }
      return true;
    })
    .sort((a, b) => {
      // Sorting
      if (sortBy === 'newest') {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      }
      if (sortBy === 'oldest') {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateA - dateB;
      }
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  const formatDate = (seconds: number | undefined) => {
    if (!seconds) return 'Date unknown';
    return new Date(seconds * 1000).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <main className="min-h-[calc(100vh-88px)] text-white py-12 relative z-10">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 font-serif">
            Chronicles <span className="text-[#B3CFE5]">Blog Feed</span>
          </h1>
          <p className="text-lg text-[#B3CFE5]/80 max-w-2xl mx-auto">
            Discover student stories, guides, and updates from the GIKI community.
          </p>
        </div>

        {/* Filter bar */}
        <div 
          className="rounded-3xl p-6 border border-[#B3CFE5]/25 shadow-2xl backdrop-blur-md mb-10 relative"
          style={{
            background: 'linear-gradient(135deg, rgba(10,25,49,0.85), rgba(26,61,99,0.85))',
          }}
        >
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center relative z-10">
            {/* Search */}
            <div className="w-full md:max-w-md relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, description, or tags..."
                className="w-full bg-white/10 border border-[#B3CFE5]/30 rounded-full px-5 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white focus:ring-3 focus:ring-white/10 transition-all text-sm pl-12"
              />
              <svg className="w-5 h-5 text-[#B3CFE5]/60 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Sorter */}
            <div className="flex gap-3 w-full md:w-auto items-center justify-end">
              <span className="text-xs font-bold text-[#B3CFE5]/60 uppercase tracking-wider hidden sm:inline">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white/10 border border-[#B3CFE5]/30 rounded-full px-4 py-2.5 text-white focus:outline-none focus:border-white focus:ring-3 focus:ring-white/10 transition-all text-sm appearance-none cursor-pointer pr-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23B3CFE5' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 12px center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '16px',
                }}
              >
                <option value="newest" className="bg-[#0A1931] text-white">Newest First</option>
                <option value="oldest" className="bg-[#0A1931] text-white">Oldest First</option>
                <option value="alphabetical" className="bg-[#0A1931] text-white">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Genre tabs */}
          <div className="flex flex-wrap gap-2 mt-6 border-t border-[#B3CFE5]/10 pt-4 relative z-10">
            {genres.map(genre => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  selectedGenre.toLowerCase() === genre.toLowerCase()
                    ? 'bg-white text-[#0A1931] border-white'
                    : 'bg-white/5 border-white/10 text-[#B3CFE5] hover:bg-white/10 hover:text-white'
                }`}
              >
                {genre === 'all' ? 'All Genres' : genre}
              </button>
            ))}
          </div>
        </div>

        {/* Loading/Error states */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#B3CFE5]/30 border-t-[#B3CFE5] rounded-full animate-spin"></div>
            <p className="mt-4 text-[#B3CFE5]/60 text-sm animate-pulse">Loading chronicles feed...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-300 bg-red-950/20 border border-red-500/20 rounded-3xl p-6">
            <p>{error}</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 text-[#B3CFE5]/60">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
            <h3 className="font-bold text-white text-xl mb-1">No articles found</h3>
            <p className="text-sm">Try adjustment parameters or clean the search field.</p>
          </div>
        ) : (
          /* Posts Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map(post => (
              <article 
                key={post.id}
                className="bg-[#1A3D63]/30 border border-[#B3CFE5]/15 rounded-3xl overflow-hidden hover:bg-[#1A3D63]/55 hover:scale-[1.01] hover:shadow-2xl transition duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Photo Preview */}
                  <div className="h-48 overflow-hidden bg-black/40 border-b border-[#B3CFE5]/10 relative">
                    {post.photoUrl ? (
                      <img 
                        src={post.photoUrl} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[#B3CFE5]/40 p-4">
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs">No image provided</span>
                      </div>
                    )}
                    <span className="absolute top-4 left-4 bg-[#4A7FA7] text-[#F6FAFD] text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-[#B3CFE5]/30">
                      {post.genre}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-white line-clamp-1 hover:text-[#B3CFE5] transition">
                      <Link to={`/posts/${post.id}`}>{post.title}</Link>
                    </h3>
                    <p className="text-[#B3CFE5]/70 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {post.description}
                    </p>
                  </div>
                </div>

                {/* Footer stats */}
                <div className="px-6 pb-6 pt-4 border-t border-[#B3CFE5]/10 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs text-[#B3CFE5]/60">
                    <span>By <strong className="text-white">{post.authorName}</strong></span>
                    <span>{formatDate(post.createdAt?.seconds)}</span>
                  </div>

                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[#B3CFE5]/80">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <Link 
                    to={`/posts/${post.id}`}
                    className="w-full mt-2 py-2.5 rounded-xl bg-[#4A7FA7]/20 border border-[#4A7FA7]/30 hover:bg-[#4A7FA7]/40 text-white font-bold text-center text-sm transition"
                  >
                    Read Article
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};
