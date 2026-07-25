import { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  fallback?: string;
  ratio?: number;
  className?: string;
  inView?: boolean;
}

export function LazyImage({
  src,
  alt,
  fallback = 'https://placehold.co/640x360?text=No+Image',
  ratio = 16 / 9,
  className = '',
  inView = true,
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState(inView);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inView) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [inView]);

  const imgSrc = error ? fallback : src;

  return (
    <div
      ref={ref}
      className={`relative w-full overflow-hidden rounded-lg bg-[#ececec] ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {visible && (
        <img
          src={imgSrc}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
      {!loaded && visible && (
        <div className="absolute inset-0 animate-pulse bg-[#e0e0e0]" />
      )}
    </div>
  );
}
