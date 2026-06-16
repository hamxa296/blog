import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedPost, getApprovedPosts, type Post } from '../services/firebase';

const HOME_SECTIONS = [
  { id: 'home-hero', label: 'Home' },
  { id: 'section-01', label: 'Freshman Guide' },
  { id: 'section-02', label: 'Campus Calendar' },
  { id: 'section-03', label: 'Photo Gallery' },
  { id: 'posts-preview', label: 'Chronicles' },
] as const;

const ArrowLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <Link
    to={to}
    className="inline-flex items-center text-[#B3CFE5] hover:text-white transition-colors duration-300 group"
  >
    <span className="mr-2">{children}</span>
    <svg
      className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  </Link>
);

export const Home: React.FC = () => {
  const scrollRef = useRef<HTMLElement>(null);
  const [activeSection, setActiveSection] = useState<string>('home-hero');
  const [featuredPost, setFeaturedPost] = useState<Post | null>(null);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const featRes = await getFeaturedPost();
        if (featRes.success && featRes.post) setFeaturedPost(featRes.post);
      } catch (err) {
        console.error('Error loading featured post:', err);
      } finally {
        setFeaturedLoading(false);
      }

      try {
        const postsRes = await getApprovedPosts();
        if (postsRes.success && postsRes.posts) setRecentPosts(postsRes.posts.slice(0, 3));
      } catch (err) {
        console.error('Error loading recent posts:', err);
      } finally {
        setRecentLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const scrollToSection = useCallback((sectionId: string) => {
    const container = scrollRef.current;
    const section = document.getElementById(sectionId);
    if (container && section) {
      container.scrollTo({ top: section.offsetTop, behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollPos = container.scrollTop + container.clientHeight / 2;
      for (let i = HOME_SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(HOME_SECTIONS[i].id);
        if (el && scrollPos >= el.offsetTop) {
          setActiveSection(HOME_SECTIONS[i].id);
          break;
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const formatDate = (seconds: number | undefined) => {
    if (!seconds) return 'Date unknown';
    return new Date(seconds * 1000).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <main ref={scrollRef} className="home-scroll-root text-white relative z-10">
      {/* Dot navigation */}
      <div className="fixed right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col gap-2">
        {HOME_SECTIONS.slice(1, 5).map((section, i) => (
          <button
            key={section.id}
            type="button"
            onClick={() => scrollToSection(section.id)}
            className={`sidebar-item w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              activeSection === section.id ? 'sidebar-item-active' : ''
            }`}
          >
            {String(i + 1).padStart(2, '0')}
          </button>
        ))}
      </div>

      {/* Hero Section */}
      <section id="home-hero" className="home-snap-section relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-[#0A1931]/30 to-[#1A3D63]/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-[#4A7FA7]/20" />
        </div>

        <div className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-10 hidden lg:block">
          <div className="text-white text-center">
            <p className="text-sm font-medium mb-4 tracking-wider">Follow us</p>
            <a
              href="https://www.instagram.com/giki.chronicles?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              className="sidebar-item w-8 h-8 rounded-full flex items-center justify-center mx-auto"
              aria-label="Instagram"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="relative z-10 text-center text-white px-6 max-w-4xl">
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="w-16 h-px bg-white/60" />
              <span className="text-sm font-medium tracking-widest">A STUDENT BLOG</span>
              <div className="w-16 h-px bg-white/60" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold mb-8 leading-tight hero-title">
            Be Prepared For The
            <br />
            <span className="text-[#B3CFE5]">Valley & Beyond!</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Your one-stop hub for student life, engineering marvels, and campus tales at GIKI Institute.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <Link
              to="/guide"
              className="px-6 py-3 rounded-full font-bold text-sm bg-[#4A7FA7] hover:bg-[#1A3D63] text-white border border-[#B3CFE5]/30 transition shadow-lg"
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

          <button
            type="button"
            onClick={() => scrollToSection('section-01')}
            className="text-white/70 text-sm hover:text-white transition"
          >
            scroll down ↓
          </button>
        </div>
      </section>

      {/* Section 01: Freshman Guide */}
      <section id="section-01" className="home-snap-section section-bg-1 py-16 sm:py-24 relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="flex items-center mb-6">
                <span className="text-6xl sm:text-8xl font-bold text-[#4A7FA7]/30 mr-4 sm:mr-6 section-number">01</span>
                <div className="flex-1">
                  <div className="w-24 h-px bg-[#B3CFE5]/40 mb-2" />
                  <span className="text-sm font-medium text-[#B3CFE5] tracking-wider">GET STARTED</span>
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-6">
                Your Complete Freshman Survival Guide
              </h2>
              <p className="text-base sm:text-lg text-[#B3CFE5]/80 leading-relaxed mb-8">
                From packing essentials to navigating campus life, our comprehensive guide covers everything you need
                to know as a new GIKI student. Discover hostel information, mess schedules, weekend travel options,
                and essential contacts to make your transition smooth and exciting.
              </p>
              <ArrowLink to="/guide">Explore the guide</ArrowLink>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl hover-lift">
              <img src="/fman.jpg" alt="Freshman student guide" className="w-full h-[320px] sm:h-[500px] object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Section 02: Calendar */}
      <section id="section-02" className="home-snap-section section-bg-2 py-16 sm:py-24 relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1 rounded-2xl overflow-hidden shadow-2xl hover-lift">
              <img src="/calendar.jfif" alt="Campus calendar and events" className="w-full h-[320px] sm:h-[500px] object-cover" />
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center mb-6">
                <span className="text-6xl sm:text-8xl font-bold text-[#4A7FA7]/30 mr-4 sm:mr-6 section-number">02</span>
                <div className="flex-1">
                  <div className="w-24 h-px bg-[#B3CFE5]/40 mb-2" />
                  <span className="text-sm font-medium text-[#B3CFE5] tracking-wider">STAY CONNECTED</span>
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-6">
                Stay Updated with Campus Events!
              </h2>
              <p className="text-base sm:text-lg text-[#B3CFE5]/80 leading-relaxed mb-8">
                Never miss important campus events, academic deadlines, or social gatherings. Our comprehensive
                calendar keeps you informed about everything happening at GIK Institute, from lectures and workshops
                to cultural festivals and sports competitions.
              </p>
              <ArrowLink to="/calendar">View Calendar</ArrowLink>
            </div>
          </div>
        </div>
      </section>

      {/* Section 03: Gallery */}
      <section id="section-03" className="home-snap-section section-bg-1 py-16 sm:py-24 relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="flex items-center mb-6">
                <span className="text-6xl sm:text-8xl font-bold text-[#4A7FA7]/30 mr-4 sm:mr-6 section-number">03</span>
                <div className="flex-1">
                  <div className="w-24 h-px bg-[#B3CFE5]/40 mb-2" />
                  <span className="text-sm font-medium text-[#B3CFE5] tracking-wider">CAMPUS ESSENTIALS</span>
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-6">
                Explore Our Campus Through Photos!
              </h2>
              <p className="text-base sm:text-lg text-[#B3CFE5]/80 leading-relaxed mb-8">
                Discover the beauty and diversity of GIK Institute through our curated photo gallery. From academic
                blocks and hostel life to sports facilities and campus events, capture the essence of student life
                and share your own moments with the community.
              </p>
              <ArrowLink to="/gallery">Browse Gallery</ArrowLink>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl hover-lift">
              <img src="/camera.jpeg" alt="Camera and photography" className="w-full h-[320px] sm:h-[500px] object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured & Recent Posts */}
      <section id="posts-preview" className="home-snap-section section-bg-2 py-16 sm:py-24 relative min-h-0">
        <div className="container mx-auto px-6 relative z-10 max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">Featured Post</h2>
            <p className="text-[#B3CFE5]/80">Hand-picked from the latest stories</p>
          </div>

          {featuredLoading ? (
            <div className="w-full h-64 animate-pulse rounded-3xl bg-[#0A1931]/40 border border-white/5 mb-16" />
          ) : featuredPost ? (
            <div
              className="rounded-2xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 hover-lift mb-16 flex flex-col md:flex-row"
            >
              {featuredPost.photoUrl && (
                <div className="md:w-1/2 h-64 md:h-auto overflow-hidden bg-black/30">
                  <img src={featuredPost.photoUrl} alt={featuredPost.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap gap-2 text-sm text-[#B3CFE5] mb-3">
                    <span>{featuredPost.authorName}</span>
                    <span>•</span>
                    <span>{formatDate(featuredPost.createdAt?.seconds)}</span>
                    <span>•</span>
                    <span>{featuredPost.genre}</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    <Link to={`/posts/${featuredPost.id}`} className="hover:text-[#B3CFE5] transition">
                      {featuredPost.title}
                    </Link>
                  </h3>
                  <p className="text-[#EAF6FF]/90 leading-relaxed mb-6 line-clamp-3">{featuredPost.description}</p>
                </div>
                <Link
                  to={`/posts/${featuredPost.id}`}
                  className="inline-block px-5 py-2 bg-[#4A7FA7] text-white rounded-full hover:bg-[#0A1931] transition text-center w-fit"
                >
                  Read More
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border border-[#B3CFE5]/10 bg-white/5 rounded-3xl text-[#B3CFE5]/55 text-sm mb-16">
              No featured post pinned at the moment.
            </div>
          )}

          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-white">Recent Posts</h2>
          </div>

          {recentLoading ? (
            <div className="grid md:grid-cols-3 gap-6 pb-8">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-xl bg-[#0A1931]/40 border border-white/5" />
              ))}
            </div>
          ) : recentPosts.length === 0 ? (
            <div className="text-center py-10 text-[#B3CFE5]/80">No posts to show yet. Check back soon!</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/posts/${post.id}`}
                  className="rounded-xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 hover-lift block"
                >
                  {post.photoUrl ? (
                    <div
                      className="h-40 bg-cover bg-center"
                      style={{ backgroundImage: `url('${post.photoUrl}')` }}
                    />
                  ) : (
                    <div className="h-40 bg-gray-700 flex items-center justify-center text-white/60">No image</div>
                  )}
                  <div className="p-4">
                    <div className="text-xs text-[#B3CFE5] mb-1">{post.genre || 'Post'}</div>
                    <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">{post.title}</h3>
                    <div className="text-xs text-[#EAF6FF]/80 mb-2">
                      {post.authorName} • {formatDate(post.createdAt?.seconds)}
                    </div>
                    <p className="text-[#EAF6FF]/90 text-sm line-clamp-2">{post.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};
