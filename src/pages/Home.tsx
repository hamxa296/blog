import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedPost, getApprovedPosts, type Post } from '../services/firebase';

export const Home: React.FC = () => {
  const [featuredPost, setFeaturedPost] = useState<Post | null>(null);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      // Load featured post
      try {
        const featRes = await getFeaturedPost();
        if (featRes.success && featRes.post) {
          setFeaturedPost(featRes.post);
        }
      } catch (err) {
        console.error("Error loading featured post:", err);
      } finally {
        setFeaturedLoading(false);
      }

      // Load recent approved posts
      try {
        const postsRes = await getApprovedPosts();
        if (postsRes.success && postsRes.posts) {
          // Take top 3 recent posts
          setRecentPosts(postsRes.posts.slice(0, 3));
        }
      } catch (err) {
        console.error("Error loading recent posts:", err);
      } finally {
        setRecentLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const formatDate = (seconds: number | undefined) => {
    if (!seconds) return 'Date unknown';
    return new Date(seconds * 1000).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <main className="min-h-screen text-white relative z-10">
      {/* Hero Header */}
      <section className="container mx-auto px-6 py-20 text-center flex flex-col justify-center items-center">
        <div 
          className="max-w-3xl bg-black/45 p-8 sm:p-12 rounded-[2.5rem] border border-white/10 backdrop-blur-md shadow-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(10,25,49,0.75) 0%, rgba(26,61,99,0.65) 100%)',
          }}
        >
          {/* Visual decorative line */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 4px)',
            }}
          />

          <h1 className="text-4xl sm:text-6xl font-serif font-extrabold mb-6 leading-tight tracking-tight">
            Be Prepared For The<br />
            <span className="bg-gradient-to-r from-[#B3CFE5] to-[#4A7FA7] bg-clip-text text-transparent">
              Valley & Beyond!
            </span>
          </h1>
          <p className="text-base sm:text-lg text-[#B3CFE5] max-w-xl mx-auto mb-8 leading-relaxed">
            GIKI Chronicles is your student-run repository of survival guides, interactive academic calendars, community galleries, and blogs.
          </p>
          <div className="flex flex-wrap gap-4 justify-center relative z-20">
            <Link 
              to="/guide" 
              className="px-6 py-3 rounded-full font-bold text-sm bg-[#4A7FA7] hover:bg-[#1A3D63] text-white border border-[#B3CFE5]/30 transition shadow-lg hover:scale-[1.01]"
            >
              Freshman Survival Guide
            </Link>
            <Link 
              to="/browse" 
              className="px-6 py-3 rounded-full font-bold text-sm bg-white/5 border border-white/10 text-[#B3CFE5] hover:bg-white/10 hover:text-white transition"
            >
              Browse Chronicles
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Post Segment */}
      <section className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="text-left mb-6">
          <h2 className="text-2xl font-bold font-serif text-white tracking-tight flex items-center gap-2">
            ⭐ Featured <span className="text-[#B3CFE5]">Chronicle</span>
          </h2>
        </div>

        {featuredLoading ? (
          <div className="w-full h-64 animate-pulse rounded-3xl bg-[#1A3D63]/30 border border-white/5"></div>
        ) : featuredPost ? (
          <div 
            className="rounded-3xl border border-[#B3CFE5]/20 overflow-hidden flex flex-col md:flex-row hover:shadow-2xl transition duration-500"
            style={{
              background: 'linear-gradient(135deg, rgba(10, 25, 49, 0.6), rgba(26, 61, 99, 0.5))',
              backdropFilter: 'blur(10px)',
            }}
          >
            {/* Left Cover Photo */}
            {featuredPost.photoUrl && (
              <div className="md:w-1/2 h-64 md:h-auto overflow-hidden relative bg-black/30 border-b md:border-b-0 md:border-r border-[#B3CFE5]/10">
                <img 
                  src={featuredPost.photoUrl} 
                  alt={featuredPost.title} 
                  className="w-full h-full object-cover" 
                />
              </div>
            )}
            
            {/* Right Contents */}
            <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-[#B3CFE5]/50 bg-black/20 px-2 py-0.5 rounded uppercase tracking-wider mb-3 inline-block">
                  {featuredPost.genre}
                </span>
                <h3 className="text-2xl font-bold text-white mb-3 hover:text-[#B3CFE5] transition leading-snug">
                  <Link to={`/posts/${featuredPost.id}`}>{featuredPost.title}</Link>
                </h3>
                <p className="text-sm text-[#B3CFE5]/80 leading-relaxed mb-6 line-clamp-3">
                  {featuredPost.description}
                </p>
              </div>
              
              <div className="w-full pt-4 border-t border-[#B3CFE5]/10 flex flex-col gap-3">
                <div className="flex justify-between text-xs text-[#B3CFE5]/60">
                  <span>By <strong className="text-white">{featuredPost.authorName}</strong></span>
                  <span>{formatDate(featuredPost.createdAt?.seconds)}</span>
                </div>
                <Link 
                  to={`/posts/${featuredPost.id}`}
                  className="w-full py-2.5 rounded-xl bg-[#4A7FA7]/20 border border-[#4A7FA7]/30 hover:bg-[#4A7FA7]/40 text-white font-bold text-center text-sm transition"
                >
                  Read Featured Chronicle
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 border border-[#B3CFE5]/10 bg-white/5 rounded-3xl text-[#B3CFE5]/55 text-sm">
            No featured post pinned at the moment.
          </div>
        )}
      </section>

      {/* Recent Posts Grid */}
      <section className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="text-left mb-6">
          <h2 className="text-2xl font-bold font-serif text-white tracking-tight flex items-center gap-2">
            📝 Recent <span className="text-[#B3CFE5]">Submissions</span>
          </h2>
        </div>

        {recentLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="h-64 animate-pulse rounded-3xl bg-[#1A3D63]/30 border border-white/5"></div>
            <div className="h-64 animate-pulse rounded-3xl bg-[#1A3D63]/30 border border-white/5"></div>
            <div className="h-64 animate-pulse rounded-3xl bg-[#1A3D63]/30 border border-white/5"></div>
          </div>
        ) : recentPosts.length === 0 ? (
          <div className="text-center py-12 border border-[#B3CFE5]/10 bg-white/5 rounded-3xl text-[#B3CFE5]/55 text-sm">
            No blog posts published yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {recentPosts.map(post => (
              <div 
                key={post.id}
                className="bg-[#1A3D63]/20 border border-[#B3CFE5]/10 rounded-3xl overflow-hidden hover:bg-[#1A3D63]/40 hover:scale-[1.01] transition duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="h-40 overflow-hidden bg-black/20 border-b border-[#B3CFE5]/10 relative">
                    {post.photoUrl && (
                      <img src={post.photoUrl} alt={post.title} className="w-full h-full object-cover" />
                    )}
                    <span className="absolute top-3 left-3 bg-[#4A7FA7]/90 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded">
                      {post.genre}
                    </span>
                  </div>
                  <div className="p-5">
                    <h4 className="font-bold text-white text-base mb-2 line-clamp-1">
                      <Link to={`/posts/${post.id}`} className="hover:underline">{post.title}</Link>
                    </h4>
                    <p className="text-xs text-[#B3CFE5]/80 line-clamp-2 leading-relaxed mb-2">
                      {post.description}
                    </p>
                  </div>
                </div>
                <div className="px-5 pb-5 pt-3 border-t border-[#B3CFE5]/5 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] text-[#B3CFE5]/65">
                    <span>By <strong>{post.authorName}</strong></span>
                    <span>{formatDate(post.createdAt?.seconds)}</span>
                  </div>
                  <Link 
                    to={`/posts/${post.id}`}
                    className="w-full text-xs bg-[#4A7FA7]/10 border border-[#4A7FA7]/20 hover:bg-[#4A7FA7]/35 text-white py-2 rounded-lg text-center font-semibold transition"
                  >
                    Read More
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Interactive Teasers Block */}
      <section className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Guide Teaser */}
          <Link 
            to="/guide" 
            className="p-6 rounded-3xl border border-[#B3CFE5]/15 bg-[#1A3D63]/25 hover:bg-[#1A3D63]/45 transition duration-300 group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#4A7FA7]/20 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                📚
              </div>
              <h4 className="font-bold text-lg text-white mb-1">Survival Guide</h4>
              <p className="text-xs text-[#B3CFE5]/80 leading-relaxed">
                Check packing checklists, hostel layouts, society directories, and mess timings.
              </p>
            </div>
            <span className="text-[10px] text-[#B3CFE5] mt-4 font-bold uppercase tracking-wider flex items-center gap-1 group-hover:text-white">
              Explore Guide →
            </span>
          </Link>

          {/* Calendar Teaser */}
          <Link 
            to="/calendar" 
            className="p-6 rounded-3xl border border-[#B3CFE5]/15 bg-[#1A3D63]/25 hover:bg-[#1A3D63]/45 transition duration-300 group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#4A7FA7]/20 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                📅
              </div>
              <h4 className="font-bold text-lg text-white mb-1">Campus Calendar</h4>
              <p className="text-xs text-[#B3CFE5]/80 leading-relaxed">
                Check out upcoming engineering teams, cultural, and sports events happening around.
              </p>
            </div>
            <span className="text-[10px] text-[#B3CFE5] mt-4 font-bold uppercase tracking-wider flex items-center gap-1 group-hover:text-white">
              View Calendar →
            </span>
          </Link>

          {/* Map Teaser */}
          <Link 
            to="/map" 
            className="p-6 rounded-3xl border border-[#B3CFE5]/15 bg-[#1A3D63]/25 hover:bg-[#1A3D63]/45 transition duration-300 group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#4A7FA7]/20 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                🗺️
              </div>
              <h4 className="font-bold text-lg text-white mb-1">Interactive Map</h4>
              <p className="text-xs text-[#B3CFE5]/80 leading-relaxed">
                Explore a detailed coordinates pin locator mapping buildings and hostels.
              </p>
            </div>
            <span className="text-[10px] text-[#B3CFE5] mt-4 font-bold uppercase tracking-wider flex items-center gap-1 group-hover:text-white">
              Open Map →
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
};
