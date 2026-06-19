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

    const observerOptions = {
      root: container,
      rootMargin: '-40% 0px -40% 0px', // Triggers when section occupies the active middle portion
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    HOME_SECTIONS.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
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
      <div className="fixed right-5 sm:right-7 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col gap-3">
        {HOME_SECTIONS.slice(1, 5).map((section) => (
          <button
            key={section.id}
            type="button"
            title={section.label}
            onClick={() => scrollToSection(section.id)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              activeSection === section.id
                ? 'bg-white scale-150'
                : 'bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      {/* ── Hero Section ── */}
      <section id="home-hero" className="home-snap-section relative flex items-center justify-center overflow-hidden">
        {/* Subtle vignette overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />

        {/* Instagram float */}
        <div className="absolute left-6 sm:left-10 top-1/2 -translate-y-1/2 z-10 hidden lg:flex flex-col items-center gap-3">
          <div className="w-px h-16 bg-white/20" />
          <a
            href="https://www.instagram.com/giki.chronicles?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="w-9 h-9 rounded-full border border-white/20 bg-white/5 backdrop-blur flex items-center justify-center hover:bg-white/15 transition"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
          <div className="w-px h-16 bg-white/20" />
        </div>

        <div className="relative z-10 text-center text-white px-6 max-w-4xl">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-12 h-px bg-white/30" />
            <span className="text-xs font-semibold tracking-[0.25em] text-white/60 uppercase">GIKI Student Blog</span>
            <div className="w-12 h-px bg-white/30" />
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-8xl font-serif font-bold mb-6 leading-[1.05] tracking-tight hero-title">
            Be Prepared For
            <br />
            <span className="text-white/70 italic">The Valley</span>
          </h1>

          <p className="text-base sm:text-lg text-white/55 mb-10 max-w-xl mx-auto leading-relaxed font-light tracking-wide">
            Student life, engineering tales, and campus stories from GIK Institute.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-12">
            <Link
              to="/guide"
              className="px-7 py-3 rounded-full text-sm font-semibold bg-white text-black hover:bg-white/90 transition-all duration-300 shadow-lg shadow-black/30"
            >
              Freshman Guide
            </Link>
            <Link
              to="/browse"
              className="px-7 py-3 rounded-full text-sm font-semibold border border-white/20 text-white/80 hover:bg-white/8 hover:text-white hover:border-white/40 transition-all duration-300"
            >
              Browse All Posts
            </Link>
          </div>

          <button
            type="button"
            onClick={() => scrollToSection('section-01')}
            className="text-white/30 hover:text-white/60 transition text-sm flex flex-col items-center gap-2 mx-auto"
          >
            <span className="text-xs tracking-widest">SCROLL</span>
            <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </section>

      {/* ── Section 01: Freshman Guide ── */}
      <section id="section-01" className="home-snap-section home-content-section relative">
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
        <div className="container mx-auto px-6 sm:px-10 relative z-10 h-full flex items-center">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase mb-4">01 — Get Started</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-5 leading-tight">
                Your Complete<br />Freshman Survival Guide
              </h2>
              <div className="w-10 h-px bg-white/30 mb-5" />
              <p className="text-base text-white/55 leading-relaxed mb-8 max-w-md">
                From packing essentials to navigating campus life — discover hostel information, mess schedules,
                travel options, and everything you need to thrive at GIKI.
              </p>
              <Link
                to="/guide"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white border-b border-white/30 pb-0.5 hover:border-white transition-all duration-300 group"
              >
                Explore the guide
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/60 hover-lift">
              <img src="/fman.jpg" alt="Freshman student guide" className="w-full h-[320px] sm:h-[480px] object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 02: Calendar ── */}
      <section id="section-02" className="home-snap-section home-content-section relative">
        <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/55 to-black/70" />
        <div className="container mx-auto px-6 sm:px-10 relative z-10 h-full flex items-center">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full">
            <div className="order-2 lg:order-1 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 hover-lift">
              <img src="/calendar.jfif" alt="Campus calendar and events" className="w-full h-[320px] sm:h-[480px] object-cover" />
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase mb-4">02 — Stay Connected</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-5 leading-tight">
                Stay Updated with<br />Campus Events
              </h2>
              <div className="w-10 h-px bg-white/30 mb-5" />
              <p className="text-base text-white/55 leading-relaxed mb-8 max-w-md">
                Never miss important deadlines or social gatherings. Our calendar keeps you
                informed about everything at GIK — lectures, workshops, festivals, and more.
              </p>
              <Link
                to="/calendar"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white border-b border-white/30 pb-0.5 hover:border-white transition-all duration-300 group"
              >
                View Calendar
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 03: Gallery ── */}
      <section id="section-03" className="home-snap-section home-content-section relative">
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
        <div className="container mx-auto px-6 sm:px-10 relative z-10 h-full flex items-center">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase mb-4">03 — Campus Life</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-5 leading-tight">
                Explore Campus<br />Through Photos
              </h2>
              <div className="w-10 h-px bg-white/30 mb-5" />
              <p className="text-base text-white/55 leading-relaxed mb-8 max-w-md">
                Academic blocks, hostel life, sports, events — a curated window into the essence
                of student life at GIK Institute.
              </p>
              <Link
                to="/gallery"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white border-b border-white/30 pb-0.5 hover:border-white transition-all duration-300 group"
              >
                Browse Gallery
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/60 hover-lift">
              <img src="/camera.jpeg" alt="Campus photography" className="w-full h-[320px] sm:h-[480px] object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Posts Section ── */}
      <section id="posts-preview" className="home-snap-section relative overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/65 to-black/80" />
        <div className="relative z-10 px-6 sm:px-10 py-16 max-w-5xl mx-auto w-full">

          {/* Featured Post */}
          <div className="mb-14">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-8 h-px bg-white/30" />
              <h2 className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase">Featured Story</h2>
            </div>

            {featuredLoading ? (
              <div className="w-full h-64 rounded-2xl animate-pulse bg-white/5" />
            ) : featuredPost ? (
              <Link
                to={`/posts/${featuredPost.id}`}
                className="group block rounded-2xl overflow-hidden border border-white/8 bg-black/30 backdrop-blur-sm hover:border-white/20 transition-all duration-500 shadow-2xl shadow-black/50"
              >
                <div className="flex flex-col md:flex-row">
                  {featuredPost.photoUrl && (
                    <div className="md:w-5/12 h-56 md:h-auto overflow-hidden">
                      <img
                        src={featuredPost.photoUrl}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  )}
                  <div className={`${featuredPost.photoUrl ? 'md:w-7/12' : 'w-full'} p-7 md:p-10 flex flex-col justify-between`}>
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">{featuredPost.genre}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-xs text-white/30">{formatDate(featuredPost.createdAt?.seconds)}</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-serif font-bold text-white leading-snug mb-4 group-hover:text-white/90 transition-colors">
                        {featuredPost.title}
                      </h3>
                      <p className="text-white/50 leading-relaxed mb-6 line-clamp-3 text-sm">
                        {featuredPost.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60">
                        {featuredPost.authorName?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <span className="text-sm text-white/50">{featuredPost.authorName}</span>
                      <span className="ml-auto text-xs font-semibold tracking-wider text-white/40 group-hover:text-white/70 transition-colors flex items-center gap-1.5">
                        Read Story
                        <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="text-center py-12 border border-white/8 rounded-2xl text-white/25 text-sm">
                No featured post pinned at the moment.
              </div>
            )}
          </div>

          {/* Recent Posts */}
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-8 h-px bg-white/30" />
              <h2 className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase">Recent Stories</h2>
              <div className="ml-auto">
                <Link to="/browse" className="text-xs text-white/40 hover:text-white/70 transition tracking-wide">
                  View All →
                </Link>
              </div>
            </div>

            {recentLoading ? (
              <div className="grid md:grid-cols-3 gap-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-64 animate-pulse rounded-xl bg-white/5" />
                ))}
              </div>
            ) : recentPosts.length === 0 ? (
              <div className="text-center py-10 text-white/30 text-sm">No posts yet. Check back soon!</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-6">
                {recentPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/posts/${post.id}`}
                    className="group rounded-xl overflow-hidden border border-white/8 bg-black/25 backdrop-blur-sm hover:border-white/18 transition-all duration-400 shadow-xl shadow-black/40 block"
                  >
                    {post.photoUrl ? (
                      <div className="h-40 overflow-hidden">
                        <img
                          src={post.photoUrl}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="h-40 bg-white/5 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold tracking-widest text-white/35 uppercase">{post.genre || 'Post'}</span>
                        <span className="ml-auto text-[10px] text-white/25">{formatDate(post.createdAt?.seconds)}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1.5 line-clamp-2 leading-snug group-hover:text-white/80 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">{post.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};
