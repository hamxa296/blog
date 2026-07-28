import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Grid, Upload, X, ZoomIn } from "lucide-react";
import { type KeyboardEvent, useMemo, useState } from "react";
import type { GalleryPhoto } from "@/services/firebase";

export interface GalleryGridImage {
  id: string | number;
  url: string;
  title: string;
  category: string;
  uploaderName?: string;
}

interface GalleryGridBlockProps {
  photos?: GalleryPhoto[];
  loading?: boolean;
  onSubmitClick?: () => void;
}

function toGridImages(photos: GalleryPhoto[]): GalleryGridImage[] {
  return photos.map((p, i) => ({
    id: p.id || i,
    url: p.imageUrl || p.fullSizeUrl,
    title: p.caption || "Untitled",
    category: p.category || "General",
    uploaderName: p.uploaderName,
  }));
}

export function GalleryGridBlock({
  photos = [],
  loading = false,
  onSubmitClick,
}: GalleryGridBlockProps) {
  const galleryImages = useMemo(() => toGridImages(photos), [photos]);
  const [selectedImage, setSelectedImage] = useState<string | number | null>(null);
  const [filter, setFilter] = useState<string>("All");

  const categories = [
    "All",
    ...new Set(galleryImages.map((img) => img.category).filter(Boolean)),
  ];

  const filteredImages =
    filter === "All"
      ? galleryImages
      : galleryImages.filter((img) => img.category === filter);

  const handleNext = () => {
    if (selectedImage !== null) {
      const currentIndex = galleryImages.findIndex(
        (img) => img.id === selectedImage
      );
      const nextIndex = (currentIndex + 1) % galleryImages.length;
      setSelectedImage(galleryImages[nextIndex].id);
    }
  };

  const handlePrev = () => {
    if (selectedImage !== null) {
      const currentIndex = galleryImages.findIndex(
        (img) => img.id === selectedImage
      );
      const prevIndex =
        (currentIndex - 1 + galleryImages.length) % galleryImages.length;
      setSelectedImage(galleryImages[prevIndex].id);
    }
  };

  const selectedImageData = galleryImages.find(
    (img) => img.id === selectedImage
  );

  const handleCardKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    imageId: string | number
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedImage(imageId);
    }
  };

  return (
    <section
      className="w-full min-h-[100dvh] bg-background px-4 py-16 pb-32"
      aria-labelledby="gallery-heading"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
          role="region"
          aria-labelledby="gallery-heading"
        >
          <Badge className="mb-4" variant="secondary">
            <Grid className="mr-1 h-3 w-3" />
            Gallery
          </Badge>
          <h2
            id="gallery-heading"
            className="mb-4 text-4xl font-bold tracking-tight"
          >
            Our Portfolio
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Explore photos submitted by the GIKI community
          </p>
          {onSubmitClick && (
            <Button className="mt-6" onClick={onSubmitClick}>
              <Upload className="mr-2 h-4 w-4" />
              Submit a Photo
            </Button>
          )}
        </motion.div>

        {/* Filter Buttons */}
        {categories.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 flex flex-wrap justify-center gap-2"
            role="group"
            aria-label="Gallery categories"
          >
            {categories.map((category) => (
              <Button
                key={category}
                variant={filter === category ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(category)}
                aria-pressed={filter === category}
              >
                {category}
              </Button>
            ))}
          </motion.div>
        )}

        {/* Gallery Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : filteredImages.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">
            No community photos yet. Be the first to submit one!
          </p>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 gap-3"
            role="list"
            aria-label="Gallery items"
          >
            <AnimatePresence mode="popLayout">
              {filteredImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  role="listitem"
                >
                  <Card
                    className="group relative cursor-pointer overflow-hidden border-border transition-all hover:border-ring hover:shadow-xl"
                    onClick={() => setSelectedImage(image.id)}
                    onKeyDown={(event) => handleCardKeyDown(event, image.id)}
                    role="button"
                    tabIndex={0}
                    aria-label={`View details for ${image.title}`}
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <motion.img
                        src={image.url}
                        alt={image.title}
                        className="h-full w-full object-cover"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                      />

                      {/* Overlay */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
                        aria-hidden="true"
                      >
                        <ZoomIn className="mb-2 h-8 w-8 text-[var(--muted-foreground)]" />
                        <h3 className="mb-1 text-center text-lg font-semibold text-[var(--muted-foreground)]">
                          {image.title}
                        </h3>
                        <Badge variant="secondary">{image.category}</Badge>
                      </motion.div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Lightbox */}
        <AnimatePresence>
          {selectedImage !== null && selectedImageData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
              onClick={() => setSelectedImage(null)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="gallery-dialog-title"
              aria-describedby="gallery-dialog-description"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-h-[90vh] max-w-5xl"
              >
                {/* Close Button */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute -right-2 -top-12 text-[var(--muted-foreground)] hover:bg-white/10 sm:-right-12 sm:top-0"
                  onClick={() => setSelectedImage(null)}
                  aria-label="Close gallery dialog"
                >
                  <X className="h-6 w-6" />
                </Button>

                {/* Navigation Buttons */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:bg-white/10 sm:left-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  aria-label="View previous image"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:bg-white/10 sm:right-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  aria-label="View next image"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>

                {/* Image */}
                <motion.img
                  key={selectedImage}
                  src={selectedImageData.url}
                  alt={selectedImageData.title}
                  className="max-h-[80vh] w-auto rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />

                {/* Image Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-4 text-center text-[var(--muted-foreground)]"
                  id="gallery-dialog-description"
                >
                  <h3
                    className="mb-2 text-xl font-semibold"
                    id="gallery-dialog-title"
                  >
                    {selectedImageData.title}
                  </h3>
                  <Badge variant="secondary">
                    {selectedImageData.category}
                  </Badge>
                  {selectedImageData.uploaderName && (
                    <p className="mt-2 text-xs uppercase tracking-wider opacity-70">
                      Uploaded by {selectedImageData.uploaderName}
                    </p>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
