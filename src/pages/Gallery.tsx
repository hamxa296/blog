import { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { CollectionSurfer } from '../components/gallery/CollectionSurfer';
import { GalleryGridBlock } from '../components/gallery/GalleryGridBlock';
import { PhotoSubmitModal } from '../components/gallery/PhotoSubmitModal';
import { getGalleryPhotos, type GalleryPhoto } from '../services/firebase';
import { useIsMobile } from '../hooks/useMediaQuery';
import galleryBg from '../assets/bgblogs.png';
import mobileBg from '../assets/plainbg.png';

const SPACER = 12000;

export const Gallery = () => {
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitOpen, setSubmitOpen] = useState(false);

  const loadPhotos = async () => {
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

  useEffect(() => {
    loadPhotos();
  }, []);

  if (isMobile) {
    return (
      <main
        className="relative z-10 min-h-[100dvh] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${mobileBg})`,
        }}
      >
        <GalleryGridBlock
          photos={photos}
          loading={loading}
          onSubmitClick={() => setSubmitOpen(true)}
        />
        <PhotoSubmitModal
          open={submitOpen}
          onClose={() => setSubmitOpen(false)}
        />
      </main>
    );
  }

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

      <section className="relative z-20 min-h-screen border-t border-white/10 bg-black px-4 py-16 pb-32 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-mono uppercase tracking-[0.3em] text-white/50">
                After the surf
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
                All Images
              </h2>
              <p className="mt-2 text-sm text-white/60 sm:text-base">
                Photos uploaded by the community — title and uploader below each
                card.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubmitOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-medium uppercase tracking-wider text-white backdrop-blur-md transition-colors hover:border-white/60 hover:bg-white/20"
            >
              <Upload className="h-4 w-4" />
              Submit a Photo
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="aspect-[4/5] animate-pulse rounded-lg bg-neutral-900"
                />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <p className="py-20 text-center text-white/50">
              No gallery photos yet. Check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo) => (
                <article
                  key={photo.id}
                  className="group overflow-hidden rounded-lg border border-white/10 bg-neutral-900"
                >
                  <div className="aspect-[4/5] overflow-hidden">
                    <img
                      src={photo.imageUrl || photo.fullSizeUrl}
                      alt={photo.caption || 'Gallery photo'}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="space-y-1 p-4">
                    <h3 className="truncate font-medium text-white">
                      {photo.caption || 'Untitled'}
                    </h3>
                    <p className="text-xs uppercase tracking-wider text-white/50">
                      Uploaded by {photo.uploaderName || 'Unknown'}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <PhotoSubmitModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
      />
    </main>
  );
};
