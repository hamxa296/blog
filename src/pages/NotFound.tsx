import React, { useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  BookOpen,
  Sparkles,
  MapPin,
  Camera,
  ArrowRight,
  Home as HomeIcon,
  Package,
  Users,
  Search,
} from 'lucide-react';
import { useIsMobile } from '../hooks/useMediaQuery';
import { Footer } from '../components/nav/Footer';
import { MobileFooter } from '../components/nav/MobileFooter';

export const NotFound: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Smart client-side redirect for known legacy URLs and query patterns
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    const search = location.search;
    const searchParams = new URLSearchParams(search);

    // 1. Legacy post with ID parameter (e.g. /post.html?id=123 or /posts.html?id=123)
    const postId = searchParams.get('id') || searchParams.get('postId');
    if (postId && (path.includes('post') || path.includes('blog'))) {
      navigate(`/posts/${postId}`, { replace: true });
      return;
    }

    // 2. Legacy freshman guide links
    if (
      path.includes('freshman') ||
      path.includes('freshmen') ||
      path.includes('guide.html')
    ) {
      navigate(`/guide${search}`, { replace: true });
      return;
    }

    // 3. Legacy packing list links
    if (path.includes('packing') || path.includes('pack')) {
      navigate('/guide?section=what-to-pack', { replace: true });
      return;
    }

    // 4. Legacy dorm / hostel links
    if (path.includes('dorm') || path.includes('hostel')) {
      navigate('/guide?section=dorm-room-info', { replace: true });
      return;
    }

    // 5. Legacy societies links
    if (path.includes('societ')) {
      navigate('/guide?section=societies-events', { replace: true });
      return;
    }

    // 6. Legacy blog / browse links
    if (
      path.includes('browse.html') ||
      path === '/blogs' ||
      path === '/blog' ||
      path === '/posts' ||
      path === '/post'
    ) {
      navigate('/browse', { replace: true });
      return;
    }

    // 7. Legacy gallery links
    if (path.includes('gallery')) {
      navigate('/gallery', { replace: true });
      return;
    }

    // 8. Legacy map links
    if (path.includes('map')) {
      navigate('/map', { replace: true });
      return;
    }
  }, [location.pathname, location.search, navigate]);

  // Context-aware suggestion based on the requested URL keywords
  const detectedSuggestion = useMemo(() => {
    const raw = (location.pathname + location.search).toLowerCase();

    if (raw.includes('pack') || raw.includes('item') || raw.includes('luggage')) {
      return {
        title: 'Packing Checklist & Essentials',
        url: '/guide?section=what-to-pack',
        buttonLabel: 'Packing List',
      };
    }
    if (raw.includes('dorm') || raw.includes('hostel') || raw.includes('room')) {
      return {
        title: 'Dorm Rooms & Hostel Video Tours',
        url: '/guide?section=dorm-room-info',
        buttonLabel: 'Hostel Info',
      };
    }
    if (raw.includes('societ') || raw.includes('club') || raw.includes('team')) {
      return {
        title: 'Student Societies & Engineering Teams',
        url: '/guide?section=societies-events',
        buttonLabel: 'Societies',
      };
    }
    if (raw.includes('contact') || raw.includes('number') || raw.includes('phone')) {
      return {
        title: 'Campus Directory & Important Contacts',
        url: '/guide?section=important-contacts',
        buttonLabel: 'Contacts',
      };
    }
    if (raw.includes('post') || raw.includes('blog') || raw.includes('article') || raw.includes('story')) {
      return {
        title: 'Student Stories, Articles & Blogs',
        url: '/browse',
        buttonLabel: 'All Blogs',
      };
    }
    return null;
  }, [location.pathname, location.search]);

  return (
    <main className="relative z-10 min-h-[calc(100vh-88px)] pt-12 pb-16 text-foreground flex flex-col justify-between">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
        style={{ backgroundColor: '#08080a' }}
      >
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-pink-600/10 blur-[130px] rounded-full" />
        <div className="absolute top-1/3 -right-20 w-[400px] h-[300px] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-10 left-10 w-[350px] h-[250px] bg-pink-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full my-auto">
        {/* Header Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-pink-500/10 text-pink-400 border border-pink-500/20 mb-4 shadow-sm shadow-pink-500/10">
            <Compass className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '8s' }} />
            <span>Lost in the Valley?</span>
          </div>

          <h1 className="text-6xl sm:text-8xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-200 to-zinc-600 drop-shadow-sm select-none">
            404
          </h1>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2 mb-3">
            Page Not Found
          </h2>

          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            The link you followed from Reddit, a bookmark, or an old post might have changed during our site upgrade. Everything is still here!
          </p>

          {/* Context-aware suggestion badge */}
          {detectedSuggestion && (
            <div className="mt-6 p-4 rounded-xl bg-pink-950/30 border border-pink-500/30 max-w-md mx-auto flex items-center justify-between gap-3 text-left shadow-lg shadow-pink-950/20 backdrop-blur-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-pink-400 font-bold uppercase tracking-wider">Looking for this?</p>
                <p className="text-sm font-semibold text-foreground truncate">{detectedSuggestion.title}</p>
              </div>
              <Link
                to={detectedSuggestion.url}
                className="px-3.5 py-1.5 rounded-lg bg-pink-600 text-white text-xs font-bold hover:bg-pink-500 transition-all shadow-md shadow-pink-600/30 shrink-0 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{detectedSuggestion.buttonLabel}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Quick Links Hub Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {/* Card 1: Freshman Guide */}
          <div className="group relative p-5 bg-card/80 backdrop-blur-md rounded-2xl border border-border hover:border-pink-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
                  Essential
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground group-hover:text-pink-400 transition-colors mb-1">
                Freshman Guide
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
                The ultimate GIKI survival guide — packing lists, dorm video tours, societies, academics, and contacts.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                <Link
                  to="/guide?section=what-to-pack"
                  className="px-2 py-0.5 rounded-md bg-secondary hover:bg-pink-600/20 hover:text-pink-300 transition-colors inline-flex items-center gap-1"
                >
                  <Package className="h-3 w-3" /> Packing List
                </Link>
                <Link
                  to="/guide?section=societies-events"
                  className="px-2 py-0.5 rounded-md bg-secondary hover:bg-pink-600/20 hover:text-pink-300 transition-colors inline-flex items-center gap-1"
                >
                  <Users className="h-3 w-3" /> Societies
                </Link>
              </div>

              <Link
                to="/guide"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-400 group-hover:text-pink-300 pt-1"
              >
                <span>Explore Complete Guide</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 2: Stories & Blogs */}
          <div className="group relative p-5 bg-card/80 backdrop-blur-md rounded-2xl border border-border hover:border-pink-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
                  Stories
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground group-hover:text-amber-400 transition-colors mb-1">
                Student Blogs & Articles
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
                Real student experiences, academic strategies, hostel life memories, and campus culture stories.
              </p>
            </div>

            <div>
              <Link
                to="/browse"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 group-hover:text-amber-300"
              >
                <span>Browse All Articles</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 3: Interactive Campus Map */}
          <div className="group relative p-5 bg-card/80 backdrop-blur-md rounded-2xl border border-border hover:border-pink-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <MapPin className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
                  Navigation
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground group-hover:text-emerald-400 transition-colors mb-1">
                Campus Map
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
                Explore faculty blocks, hostels, sports complex, library, tuck shops, and scenic spots in the valley.
              </p>
            </div>

            <div>
              <Link
                to="/map"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:text-emerald-300"
              >
                <span>Open Interactive Map</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 4: Campus Gallery */}
          <div className="group relative p-5 bg-card/80 backdrop-blur-md rounded-2xl border border-border hover:border-pink-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Camera className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
                  Visuals
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground group-hover:text-cyan-400 transition-colors mb-1">
                Photo Gallery
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
                Captivating photos of GIKI sunsets, mountains, student events, and unforgettable campus vibes.
              </p>
            </div>

            <div>
              <Link
                to="/gallery"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 group-hover:text-cyan-300"
              >
                <span>View Campus Gallery</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Global Navigation Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/guide"
            className="px-6 py-2.5 bg-pink-600 text-white rounded-full font-semibold text-sm hover:bg-pink-500 transition-all shadow-lg shadow-pink-600/20 inline-flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            <span>Go to Freshman Guide</span>
          </Link>

          <Link
            to="/browse"
            className="px-5 py-2.5 bg-secondary text-foreground rounded-full font-semibold text-sm hover:bg-muted border border-border transition-all inline-flex items-center gap-2"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <span>Browse Blogs</span>
          </Link>

          <Link
            to="/"
            className="px-5 py-2.5 bg-transparent text-muted-foreground hover:text-foreground rounded-full font-medium text-sm transition-colors inline-flex items-center gap-1.5"
          >
            <HomeIcon className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>

      {/* Footer rendering */}
      {!isMobile && (
        <div className="relative z-20 mt-16">
          <Footer />
        </div>
      )}

      {isMobile && <MobileFooter />}
    </main>
  );
};

