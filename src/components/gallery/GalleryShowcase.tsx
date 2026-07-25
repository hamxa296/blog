import { useEffect, useRef, useState } from 'react';
import { Eye } from 'lucide-react';
import { animate, stagger } from 'animejs';
import type { GalleryPhoto } from '../../services/firebase';
import { getOptimizedImageUrl } from '../../utils/imageOptimization';

export interface GalleryItem {
  id: string;
  title: string;
  handle: string;
  thumbnail: string;
  description: string;
  collection: { title: string };
  category: string;
}

function toGalleryItem(photo: GalleryPhoto): GalleryItem {
  return {
    id: photo.id || '',
    title: photo.caption,
    handle: photo.id || '',
    thumbnail: getOptimizedImageUrl(photo.imageUrl || photo.fullSizeUrl, 600),
    description: photo.caption,
    collection: { title: photo.category },
    category: photo.category,
  };
}

function MinimalProductCard({
  product,
  onClick,
}: {
  product: GalleryItem;
  onClick?: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  const setRevealPoint = (clientX: number, clientY: number) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--reveal-x', `${x}%`);
    card.style.setProperty('--reveal-y', `${y}%`);
    setActive(true);
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={(e) => setRevealPoint(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        setRevealPoint(touch.clientX, touch.clientY);
      }}
      onMouseLeave={() => setActive(false)}
      className="group relative block w-full h-full bg-transparent overflow-hidden border border-[#dddddd]/50 hover:border-[#FFE862] transition-colors duration-700"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#ececec]">
        <img
          src={product.thumbnail}
          alt={product.title}
          className="absolute inset-0 w-full h-full object-cover grayscale opacity-90 transition-all duration-1000 ease-out"
          loading="lazy"
        />
        <div
          className="absolute inset-0 w-full h-full transition-all duration-1000 ease-out"
          style={{
            clipPath: `circle(${active ? '150%' : '0%'} at var(--reveal-x, 50%) var(--reveal-y, 50%))`,
            transition: 'clip-path 2.8s cubic-bezier(0.15, 0.85, 0.35, 1)',
          }}
        >
          <img src={product.thumbnail} alt={product.title} className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div
          className={`absolute bottom-6 left-1/2 -translate-x-1/2 transition-all duration-700 z-30 w-fit ${
            active ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'
          }`}
        >
          <button
            type="button"
            onClick={onClick}
            className="block bg-white/80 backdrop-blur-md text-[#111111] text-[8px] sm:text-[10px] uppercase tracking-normal font-medium py-1.5 px-3 sm:py-3 sm:px-8 rounded-full border border-[#dddddd] whitespace-nowrap shadow-xl hover:bg-[#FFE862] transition-colors duration-300 cursor-pointer"
          >
            View Details
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center text-center p-3 sm:p-6 md:p-8 bg-transparent relative z-20">
        <span className="text-[8px] sm:text-[9px] text-[#5f6670] uppercase tracking-[0.4em] mb-1 sm:mb-3 font-light">
          {product.collection?.title ?? 'GIKI CAMPUS'}
        </span>
        <h4 className="text-xs sm:text-sm md:text-base uppercase font-normal text-[#111111] mb-2 sm:mb-4 w-full line-clamp-2 tracking-widest">
          {product.title}
        </h4>
      </div>
      <div className="absolute top-0 left-0 w-8 h-px bg-[#111111]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100" />
      <div className="absolute top-0 left-0 w-px h-8 bg-[#111111]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100" />
      <div className="absolute top-0 right-0 w-8 h-px bg-[#111111]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100" />
      <div className="absolute top-0 right-0 w-px h-8 bg-[#111111]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100" />
    </div>
  );
}

function ProductHero({
  product,
  reversed = false,
  onView,
}: {
  product: GalleryItem;
  reversed?: boolean;
  onView?: () => void;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const handleScroll = () => {
      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const mask = section.querySelector<HTMLElement>('.color-mask');
      let progress = 0;

      if (window.innerWidth < 768) {
        const elementTop = rect.top;
        const startReveal = windowHeight;
        const endReveal = windowHeight * 0.25;
        progress = (startReveal - elementTop) / (startReveal - endReveal);
      } else if (rect.top <= 0) {
        const totalScrollableDistance = rect.height - windowHeight;
        if (totalScrollableDistance > 0) progress = Math.abs(rect.top) / totalScrollableDistance;
      }

      progress = Math.min(Math.max(progress, 0), 1);

      if (mask) {
        mask.style.clipPath =
          window.innerWidth < 768
            ? `inset(0 ${100 - progress * 100}% 0 0)`
            : `inset(0 0 ${100 - progress * 100}% 0)`;
      }

      section.querySelectorAll('.reveal-step').forEach((step) => {
        const startProgress = parseFloat(step.getAttribute('data-progress') || '0');
        step.classList.toggle('active', progress > startProgress);
      });
    };

    handleScroll();
    window.addEventListener('resize', handleScroll);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div ref={sectionRef} className="scroll-section relative h-auto md:h-[250vh] w-full group">
      <div className="relative md:sticky md:top-0 md:left-0 w-full h-auto md:h-screen overflow-hidden bg-transparent">
        <div className="w-full h-auto md:h-full grid grid-cols-1 md:grid-cols-2">
          <div
            className={`relative w-full flex items-center justify-center p-3 sm:p-8 md:p-0 max-w-[400px] sm:max-w-[480px] md:max-w-none mx-auto ${
              reversed ? 'md:order-2' : ''
            }`}
          >
            <div className="relative w-full aspect-[4/5] md:aspect-auto md:h-full overflow-hidden rounded-2xl md:rounded-none">
              <div className="absolute inset-0 w-full h-full flex justify-center bg-transparent">
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  className="w-full h-full object-contain grayscale brightness-110"
                />
              </div>
              <div
                className="color-mask absolute inset-0 w-full h-full flex justify-center will-change-[clip-path]"
                style={{ clipPath: 'inset(0 0 100% 0)' }}
              >
                <img src={product.thumbnail} alt={product.title} className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
          <div
            className={`flex items-center justify-center py-5 px-6 md:p-12 relative z-20 ${
              reversed ? 'md:order-1' : ''
            }`}
          >
            <div className="max-w-sm md:max-w-md w-full flex flex-col gap-6 md:gap-10">
              <div
                className="reveal-step transition-all duration-1000 ease-out opacity-0 translate-y-12 [&.active]:opacity-100 [&.active]:translate-y-0"
                data-progress="0.2"
              >
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#5f6670]">{product.category}</span>
                <h2 className="text-lg sm:text-xl md:text-4xl font-semibold tracking-tight text-[#111111] mb-3 mt-2">
                  {product.title}
                </h2>
              </div>
              <div
                className="reveal-step transition-all duration-1000 ease-out opacity-0 translate-y-12 [&.active]:opacity-100 [&.active]:translate-y-0"
                data-progress="0.4"
              >
                <p className="text-sm md:text-base leading-relaxed text-[#5f6670] font-light text-justify pt-6 border-t border-[#dddddd]/50">
                  {product.description}
                </p>
              </div>
              <div
                className="reveal-step pt-8 transition-all duration-1000 ease-out opacity-0 translate-y-12 [&.active]:opacity-100 [&.active]:translate-y-0"
                data-progress="0.8"
              >
                <button
                  type="button"
                  onClick={onView}
                  className="w-full h-14 bg-[#111111] text-white hover:bg-[#242424] text-xs font-medium uppercase flex items-center justify-center gap-3 rounded-full transition-colors duration-300"
                >
                  <span className="tracking-widest">VIEW PHOTO</span>
                  <Eye width={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface GalleryShowcaseProps {
  photos: GalleryPhoto[];
  onPhotoClick?: (photo: GalleryPhoto) => void;
}

export function GalleryShowcase({ photos, onPhotoClick }: GalleryShowcaseProps) {
  const items = photos.map(toGalleryItem);
  const heroItems = items.slice(0, 3);
  const gridItems = items.slice(0, 12);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const finalCollectionRef = useRef<HTMLDivElement>(null);
  const animeTriggered = useRef(false);

  useEffect(() => {
    if (!finalCollectionRef.current || gridItems.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !animeTriggered.current && finalCollectionRef.current) {
          animeTriggered.current = true;
          animate(finalCollectionRef.current.querySelectorAll('.anime-card'), {
            translateY: [-200, 0],
            opacity: [0, 1],
            delay: stagger(150),
            duration: 1000,
            easing: 'easeOutElastic(1, .6)',
          });
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(finalCollectionRef.current);
    return () => observer.disconnect();
  }, [gridItems.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleContainerScroll = () => {
      const indicator = scrollIndicatorRef.current;
      const track = indicator?.parentElement;
      if (!indicator || !track) return;
      const maxScroll = container.scrollWidth - container.clientWidth;
      track.style.display = maxScroll <= 0 ? 'none' : 'block';
      indicator.style.left = `${(Math.abs(container.scrollLeft) / maxScroll) * 66.6}%`;
    };

    container.addEventListener('scroll', handleContainerScroll, { passive: true });
    const timeoutId = setTimeout(handleContainerScroll, 100);
    window.addEventListener('resize', handleContainerScroll);
    return () => {
      container.removeEventListener('scroll', handleContainerScroll);
      window.removeEventListener('resize', handleContainerScroll);
      clearTimeout(timeoutId);
    };
  }, [gridItems.length]);

  useEffect(() => {
    if (!containerRef.current) return;
    const gridEls = containerRef.current.querySelectorAll('.grid-item, .reveal');
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('show', 'active')),
      { threshold: 0.1 }
    );
    gridEls.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [gridItems.length]);

  const handleClick = (item: GalleryItem) => {
    const photo = photos.find((p) => p.id === item.id);
    if (photo && onPhotoClick) onPhotoClick(photo);
  };

  if (photos.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-[#5f6670] bg-[#f3f3f3]">
        <div className="text-center px-6">
          <p className="text-xl font-semibold text-[#111111] mb-2">No photos yet</p>
          <p className="text-sm">Be the first to share a snapshot of campus life.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-[#f3f3f3] text-[#111111] antialiased w-full">
      <section className="relative h-[100dvh] w-full flex flex-col justify-center items-center overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FFE862]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#111111]/5 blur-[150px] rounded-full" />
        <div className="relative z-10 text-center px-6 -mt-16 md:-mt-32 w-full flex flex-col items-center justify-center">
          <div className="overflow-hidden mb-4 md:mb-6 w-full flex justify-center">
            <span className="block text-[9px] md:text-[10px] font-black text-[#5f6670] uppercase reveal text-center tracking-[0.3em] md:tracking-[0.8em]">
              EST. GIKI
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-[8rem] lg:text-[10rem] font-black leading-[0.85] text-[#111111] w-full flex flex-col items-center justify-center text-center tracking-tighter">
            <div className="overflow-hidden w-full flex justify-center">
              <span className="block reveal">CAMPUS</span>
            </div>
            <div className="overflow-hidden mt-2 w-full flex justify-center">
              <span className="block italic font-light text-[#5f6670] reveal">Gallery</span>
            </div>
          </h1>
          <div className="mt-6 md:mt-12 overflow-hidden w-full flex justify-center">
            <p className="text-[#5f6670] text-center text-sm md:text-base max-w-lg font-light leading-relaxed tracking-wide reveal">
              Academic blocks, hostel life, sports, events — a curated window into the essence of GIKI.
            </p>
          </div>
        </div>
        <div className="absolute bottom-8 md:bottom-12 flex flex-col items-center gap-4 reveal">
          <div className="w-px h-12 md:h-20 bg-[#111111]/10 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-transparent via-[#111111]/50 to-transparent animate-scroll-light" />
          </div>
          <span className="text-[9px] font-bold text-[#111111]/40 tracking-normal">SCROLL DOWN</span>
        </div>
      </section>

      {heroItems.map((product, index) => (
        <ProductHero
          key={product.id}
          product={product}
          reversed={index % 2 !== 0}
          onView={() => handleClick(product)}
        />
      ))}

      <div ref={finalCollectionRef} className="bg-[#f3f3f3] w-full pt-12 pb-4 md:pt-16 md:pb-6 border-t border-[#dddddd]">
        <div className="w-full max-w-7xl mx-auto px-2">
          <div className="flex items-end justify-between border-b border-[#dddddd] pb-4 mb-8 px-4">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#5f6670] uppercase block">OVERVIEW</span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#111111] uppercase">{photos.length} Photos</span>
          </div>
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-4 md:gap-8 pb-8 no-scrollbar snap-x snap-mandatory justify-start md:justify-center px-2"
          >
            {gridItems.map((product) => (
              <div
                key={product.id}
                className="anime-card grid-item group cursor-pointer w-[calc(50%-8px)] min-w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] sm:min-w-[calc(33.333%-11px)] md:w-[300px] md:min-w-[300px] snap-center flex-shrink-0 opacity-0"
              >
                <MinimalProductCard product={product} onClick={() => handleClick(product)} />
              </div>
            ))}
          </div>
          <div className="w-24 h-[2px] bg-[#111111]/10 mx-auto mt-2 rounded-full overflow-hidden relative">
            <div
              ref={scrollIndicatorRef}
              className="h-full bg-[#111111] w-8 rounded-full absolute left-0 transition-all duration-75"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default GalleryShowcase;
