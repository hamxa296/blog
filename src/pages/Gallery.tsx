import { useEffect, useRef, useState } from 'react';
import { CollectionSurfer, type CollectionItem } from '../components/gallery/CollectionSurfer';
import { getGalleryPhotos, type GalleryPhoto } from '../services/firebase';
import galleryBg from "../assets/bgblogs.png";

const SPACER = 12000;

export const Gallery = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getGalleryPhotos('approved');
        if (res.success && res.photos) {
          setPhotos(res.photos);
        }
      } catch (err) {
        console.error('Error loading gallery:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const surferItems: CollectionItem[] | undefined =
    photos.length > 0
      ? photos.slice(0, 16).map((p, i) => ({
          id: p.id || i,
          image: p.imageUrl || p.fullSizeUrl,
          title: p.caption || `GALLERY ${String(i + 1).padStart(2, '0')}`,
        }))
      : undefined;

  return (
    <main
    ref={scrollRef}
    className="relative z-10 h-[100dvh] overflow-y-auto text-white"
    style={{
      backgroundImage: `url(${galleryBg})`,

    }}
    >
      <CollectionSurfer
        
        heading="GIKI"
        subheading="GALLERY"
        scrollContainerRef={scrollRef}
        spacerHeight={SPACER}
      />

      <section className="relative z-20 bg-black min-h-screen px-4 sm:px-8 py-16 pb-32 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-mono tracking-[0.3em] uppercase text-white/50 mb-2">
              After the surf
            </p>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
              All Images
            </h2>
            <p className="mt-2 text-white/60 text-sm sm:text-base">
              Photos uploaded by the community — title and uploader below each card.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="aspect-[4/5] rounded-lg bg-neutral-900 animate-pulse"
                />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <p className="text-white/50 text-center py-20">
              No gallery photos yet. Check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo) => (
                <article
                  key={photo.id}
                  className="group overflow-hidden rounded-lg bg-neutral-900 border border-white/10"
                >
                  <div className="aspect-[4/5] overflow-hidden">
                    <img
                      src={photo.imageUrl || photo.fullSizeUrl}
                      alt={photo.caption || 'Gallery photo'}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4 space-y-1">
                    <h3 className="font-medium text-white truncate">
                      {photo.caption || 'Untitled'}
                    </h3>
                    <p className="text-xs text-white/50 uppercase tracking-wider">
                      Uploaded by {photo.uploaderName || 'Unknown'}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};
