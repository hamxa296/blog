import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CollectionSurfer } from '../components/gallery/CollectionSurfer';
import {
  getGalleryPhotos,
  uploadGalleryPhoto,
  deleteGalleryPhoto,
  togglePhotoHighlight,
  type GalleryPhoto
} from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import {
  getOptimizedImageUrl,
  capImageResolution,
  uploadImageToCloudinary
} from '../utils/imageOptimization';
import galleryBg from "../assets/homepc.webp";
import {
  Camera,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Filter,
  Trash2,
  Check,
  AlertCircle,
  Maximize2,
  User,
  Calendar as CalendarIcon
} from 'lucide-react';

const SPACER = 3000;

const CATEGORIES = [
  'All',
  'Academic Blocks',
  'Hostels',
  'Sports Complex',
  'Events',
  'General',
];

export const Gallery: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user, profile, role } = useAuth();

  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Moderation permission checks
  const canModerate =
    role === 'admin' ||
    role === 'editor' ||
    role === 'moderator' ||
    profile?.isAdmin;

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadCategory, setUploadCategory] = useState('General');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Lightbox Modal State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadPhotos = useCallback(async () => {
    setLoading(true);

    try {
      // Admins/Moderators can view all (or we load approved for public and let admins moderate in CMS)
      // Here we load approved photos for the showcase
      const res = await getGalleryPhotos('approved');

      if (res.success && res.photos) {
        setPhotos(res.photos);
      }
    } catch (err) {
      console.error('Error loading gallery:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // Filtered photos for the grid
  const filteredPhotos = photos.filter((photo) => {
    if (selectedCategory === 'All') return true;

    return (
      photo.category?.toLowerCase() === selectedCategory.toLowerCase() ||
      (!photo.category && selectedCategory === 'General')
    );
  });

  // Top items for CollectionSurfer carousel
  // Desktop only
  

  // Handle file selection and preview generation
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setUploadError('');

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (!file.type.startsWith('image/')) {
        setUploadError(
          'Please select a valid image file (JPEG, PNG, WEBP).'
        );
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        setUploadError('File size exceeds 20MB limit.');
        return;
      }

      setUploadFile(file);

      const reader = new FileReader();

      reader.onload = (evt) => {
        setUploadPreview(evt.target?.result as string);
      };

      reader.readAsDataURL(file);
    }
  };

  // Submit Photo Upload with 2-Layer Resolution Capping
  const handleUploadSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!uploadFile) {
      setUploadError('Please select a photo to upload.');
      return;
    }

    if (!uploadCaption.trim()) {
      setUploadError('Please provide a caption for your photo.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      // Step 1: Client-Side Resolution Capping via Canvas
      setUploadProgress(
        'Capping resolution & optimizing image...'
      );

      const cappedFile = await capImageResolution(
        uploadFile,
        1920,
        0.85
      );

      // Step 2: Upload to Cloud Storage
      setUploadProgress(
        'Uploading high-res & web-optimized assets...'
      );

      const { secureUrl, publicId } =
        await uploadImageToCloudinary(cappedFile);

      // Step 3: Save to Firestore with Resolution Capped Web Thumbnail URL
      setUploadProgress(
        'Finalizing gallery submission...'
      );

      const optimizedThumbnailUrl =
        getOptimizedImageUrl(secureUrl, 600);

      const res = await uploadGalleryPhoto({
        imageUrl: optimizedThumbnailUrl,
        fullSizeUrl: secureUrl,
        caption: uploadCaption.trim(),
        category: uploadCategory,
        cloudinaryId: publicId,
      });

      if (res.success) {
        alert(
          'Photo submitted successfully! It will appear in the gallery once reviewed by moderators.'
        );

        setIsUploadModalOpen(false);
        setUploadFile(null);
        setUploadPreview(null);
        setUploadCaption('');
        setUploadCategory('General');

        loadPhotos();
      } else {
        setUploadError(
          res.error || 'Failed to save photo record.'
        );
      }
    } catch (err: unknown) {
      console.error('Upload error:', err);

      setUploadError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during upload.'
      );
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  // Lightbox Navigation
  const handlePrev = useCallback(() => {
    if (lightboxIndex === null) return;

    setLightboxIndex((prev) =>
      prev! > 0 ? prev! - 1 : filteredPhotos.length - 1
    );
  }, [lightboxIndex, filteredPhotos.length]);

  const handleNext = useCallback(() => {
    if (lightboxIndex === null) return;

    setLightboxIndex((prev) =>
      prev! < filteredPhotos.length - 1 ? prev! + 1 : 0
    );
  }, [lightboxIndex, filteredPhotos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') setLightboxIndex(null);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () =>
      window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, handlePrev, handleNext]);

  // Admin Quick Actions in Lightbox
  const handleLightboxDelete = async (
    photoId?: string
  ) => {
    if (
      !photoId ||
      !window.confirm(
        'Permanently delete this photo from the gallery?'
      )
    ) {
      return;
    }

    setActionLoading(true);

    const res = await deleteGalleryPhoto(photoId);

    if (res.success) {
      alert('Photo deleted.');
      setLightboxIndex(null);
      loadPhotos();
    } else {
      alert('Delete failed: ' + res.error);
    }

    setActionLoading(false);
  };

  const handleLightboxHighlight = async (
    photoId?: string,
    currentHighlight?: boolean
  ) => {
    if (!photoId) return;

    setActionLoading(true);

    const res = await togglePhotoHighlight(
      photoId,
      !currentHighlight
    );

    if (res.success) {
      alert(
        currentHighlight
          ? 'Removed from showcase highlight.'
          : 'Marked as showcase highlight!'
      );

      loadPhotos();
    } else {
      alert('Action failed: ' + res.error);
    }

    setActionLoading(false);
  };

  const currentLightboxPhoto =
    lightboxIndex !== null
      ? filteredPhotos[lightboxIndex]
      : null;

  return (
    <main
      ref={scrollRef}
      className="relative z-10 h-[100dvh] overflow-y-auto text-white"
      style={{
        backgroundImage: `url(${galleryBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* =========================================================
          DESKTOP VERSION
          Existing desktop layout preserved
          ========================================================= */}

      <div className="hidden md:block">
        {/* 3D Carousel / Collection Surfer Header */}
        <CollectionSurfer
          
          heading="GIKI"
          subheading="GALLERY"
          scrollContainerRef={scrollRef}
          spacerHeight={SPACER}
        />

        {/* Main Gallery Section */}
        <section className="relative z-20 bg-[#201e1c] backdrop-blur-xl min-h-screen px-4 sm:px-8 py-20 pb-36 border-t border-white/10">
          <div className="max-w-7xl mx-auto space-y-10">

            {/* Section Header & Upload Button */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono tracking-[0.3em] uppercase text-cyan-400 mb-3">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>
                    Visual Archives & Snapshot Feed
                  </span>
                </div>

                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-serif">
                  Campus In Focus
                </h2>

                <p className="mt-2 text-neutral-400 text-sm sm:text-base max-w-2xl">
                  Explore moments from across the GIKI valley.
                  All thumbnails are dynamically compressed and
                  resolution-capped for instantaneous web rendering
                  without lag.
                </p>
              </div>

              <div>
                {user ? (
                  <button
                    onClick={() =>
                      setIsUploadModalOpen(true)
                    }
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition duration-200 cursor-pointer"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Upload Photo</span>
                  </button>
                ) : (
                  <div className="text-right">
                    <a
                      href="/login"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold tracking-wider uppercase border border-white/20 transition"
                    >
                      <Upload className="w-4 h-4 text-cyan-400" />
                      <span>Login to Upload</span>
                    </a>

                    <p className="text-[11px] text-neutral-500 mt-1.5">
                      Authentication required to share photos
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <div className="flex items-center gap-1.5 bg-[#201e1c] p-1.5 rounded-2xl border border-white/10">
                <Filter className="w-4 h-4 text-neutral-400 ml-2 mr-1 hidden sm:block" />

                {CATEGORIES.map((cat) => {
                  const isSelected =
                    selectedCategory === cat;

                  const count =
                    cat === 'All'
                      ? photos.length
                      : photos.filter(
                          (p) =>
                            p.category?.toLowerCase() ===
                              cat.toLowerCase() ||
                            (!p.category && cat === 'General')
                        ).length;

                  return (
                    <button
                      key={cat}
                      onClick={() =>
                        setSelectedCategory(cat)
                      }
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                          : 'text-neutral-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span>{cat}</span>

                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isSelected
                            ? 'bg-black/20 text-white font-extrabold'
                            : 'bg-[#201e1c] text-neutral-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gallery Masonry Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[0, 1, 2, 3, 4, 5, 6, 7].map(
                  (i) => (
                    <div
                      key={i}
                      className="aspect-[4/5] rounded-2xl bg-[#201e1c] border border-white/5 animate-pulse"
                    />
                  )
                )}
              </div>
            ) : filteredPhotos.length === 0 ? (
              <div className="text-center py-28 bg-[#201e1c] rounded-3xl border border-white/5">
                <Camera className="w-12 h-12 text-neutral-600 mx-auto mb-3" />

                <h3 className="text-lg font-bold text-white">
                  No photos found in this category
                </h3>

                <p className="text-sm text-neutral-500 mt-1">
                  Be the first to share a snapshot from{' '}
                  {selectedCategory}!
                </p>

                {user && (
                  <button
                    onClick={() =>
                      setIsUploadModalOpen(true)
                    }
                    className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Now</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPhotos.map((photo, index) => {
                  const cappedThumbnailUrl =
                    getOptimizedImageUrl(
                      photo.imageUrl ||
                        photo.fullSizeUrl,
                      600
                    );

                  return (
                    <article
                      key={photo.id || index}
                      onClick={() =>
                        setLightboxIndex(index)
                      }
                      className="group relative overflow-hidden rounded-2xl bg-[#201e1c] border border-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-cyan-500/10 cursor-pointer flex flex-col justify-between"
                    >
                      <div className="aspect-[4/5] overflow-hidden bg-[#201e1c] relative">
                        <img
                          src={cappedThumbnailUrl}
                          alt={
                            photo.caption ||
                            'GIKI Gallery photo'
                          }
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex justify-between items-center opacity-90">
                          <span className="bg-black/60 backdrop-blur-md text-cyan-400 text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full border border-white/10">
                            {photo.category ||
                              'General'}
                          </span>

                          {photo.isHighlighted && (
                            <span className="bg-amber-500 text-black font-extrabold text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full shadow">
                              Showcase
                            </span>
                          )}
                        </div>

                        {/* Hover Overlay Icon */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-cyan-500/90 text-white flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <Maximize2 className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="p-4 bg-[#201e1c] backdrop-blur-sm space-y-1.5 border-t border-white/5">
                        <h3 className="font-bold text-white text-sm truncate group-hover:text-cyan-400 transition-colors">
                          {photo.caption ||
                            'Untitled Snapshot'}
                        </h3>

                        <div className="flex items-center justify-between text-[11px] text-neutral-400">
                          <span className="flex items-center gap-1 truncate max-w-[70%]">
                            <User className="w-3 h-3 text-cyan-500/70 shrink-0" />

                            <span className="truncate">
                              {photo.uploaderName ||
                                'Community Member'}
                            </span>
                          </span>

                          <span className="text-neutral-500 font-mono text-[10px]">
                            {photo.createdAt?.toDate
                              ? photo.createdAt
                                  .toDate()
                                  .toLocaleDateString(
                                    undefined,
                                    {
                                      month: 'short',
                                      day: 'numeric',
                                    }
                                  )
                              : 'Recent'}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* =========================================================
          MOBILE VERSION
          No CollectionSurfer
          2-column compact gallery
          ========================================================= */}

      <div className="md:hidden relative z-20 min-h-screen bg-[#201e1c] backdrop-blur-xl">
        <section className="px-4 pt-10 pb-28">

          {/* Mobile Header */}
          <div className="mb-7">

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Camera className="w-3.5 h-3.5 text-white-400" />
                </div>

                <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-neutral-500">
                  GIKI / Archives
                </span>
              </div>

              {user ? (
                <button
                  onClick={() =>
                    setIsUploadModalOpen(true)
                  }
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition"
                  aria-label="Upload photo"
                >
                  <Upload className="w-4 h-4 text-white" />
                </button>
              ) : (
                <a
                  href="/login"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
                  aria-label="Login"
                >
                  <User className="w-4 h-4 text-neutral-300" />
                </a>
              )}
            </div>

            {/* Mobile heading intentionally uses a different font */}
            <h1 className="font-[Arial,sans-serif] text-[2.45rem] leading-[0.95] font-black tracking-[-0.055em] text-white">
              Campus
              <br />
              <span className="text-white-500">
                in Pixels.
              </span>
            </h1>

            <p className="mt-4 max-w-[310px] text-[12px] leading-5 text-neutral-500">
              Moments from around the GIKI valley,
              captured by the community.
            </p>
          </div>

          {/* Mobile Filters */}
          <div className="mb-6 -mx-4 px-4 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 w-max">
              <div className="w-8 h-8 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Filter className="w-3.5 h-3.5 text-neutral-500" />
              </div>

              {CATEGORIES.map((cat) => {
                const isSelected =
                  selectedCategory === cat;

                const count =
                  cat === 'All'
                    ? photos.length
                    : photos.filter(
                        (p) =>
                          p.category?.toLowerCase() ===
                            cat.toLowerCase() ||
                          (!p.category &&
                            cat === 'General')
                      ).length;

                return (
                  <button
                    key={cat}
                    onClick={() =>
                      setSelectedCategory(cat)
                    }
                    className={`h-8 px-3.5 rounded-full text-[10px] font-semibold whitespace-nowrap flex items-center gap-1.5 border transition-all ${
                      isSelected
                        ? 'bg-white text-black border-white'
                        : 'bg-white/[0.03] text-neutral-500 border-white/10'
                    }`}
                  >
                    <span>{cat}</span>

                    <span
                      className={`text-[9px] ${
                        isSelected
                          ? 'text-black/50'
                          : 'text-neutral-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Gallery */}
          {loading ? (
            <div className="grid grid-cols-2 gap-2.5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="aspect-[0.82] rounded-xl bg-[#201e1c] border border-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="py-20 px-6 text-center rounded-2xl border border-white/5 bg-white/[0.02]">
              <Camera className="w-9 h-9 text-neutral-700 mx-auto mb-4" />

              <h3 className="text-sm font-semibold text-white">
                Nothing here yet
              </h3>

              <p className="text-[11px] leading-5 text-neutral-600 mt-2">
                No photos were found in{' '}
                {selectedCategory}.
              </p>

              {user && (
                <button
                  onClick={() =>
                    setIsUploadModalOpen(true)
                  }
                  className="mt-5 px-4 py-2 rounded-full bg-white text-black text-[10px] font-bold"
                >
                  Upload a photo
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-2.5 gap-y-5">
              {filteredPhotos.map((photo, index) => {
                const cappedThumbnailUrl =
                  getOptimizedImageUrl(
                    photo.imageUrl ||
                      photo.fullSizeUrl,
                    240
                  );

                return (
                  <article
                    key={photo.id || index}
                    onClick={() =>
                      setLightboxIndex(index)
                    }
                    className="group min-w-0 cursor-pointer"
                  >
                    {/* Mobile Image */}
                    <div className="relative aspect-[0.82] overflow-hidden rounded-xl bg-[#201e1c] border border-white/[0.07]">
                      <img
                        src={cappedThumbnailUrl}
                        alt={
                          photo.caption ||
                          'GIKI Gallery photo'
                        }
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-active:scale-[0.98]"
                      />

                      {/* Minimal Category */}
                      <div className="absolute top-2 left-2 max-w-[calc(100%-16px)]">
                        <span className="inline-block max-w-full truncate bg-black/50 backdrop-blur-md border border-white/10 rounded-full px-2 py-1 text-[8px] font-semibold tracking-wide uppercase text-white/80">
                          {photo.category ||
                            'General'}
                        </span>
                      </div>

                      {/* Highlight Indicator */}
                      {photo.isHighlighted && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                          <Sparkles className="w-2.5 h-2.5 text-black" />
                        </div>
                      )}
                    </div>

                    {/* Compact Mobile Card Info */}
                    <div className="px-0.5 pt-2">
                      <h3 className="text-[11px] leading-4 font-semibold text-white truncate">
                        {photo.caption ||
                          'Untitled Snapshot'}
                      </h3>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="flex items-center gap-1 min-w-0 text-[9px] text-neutral-600">
                          <User className="w-2.5 h-2.5 shrink-0" />

                          <span className="truncate">
                            {photo.uploaderName ||
                              'Community'}
                          </span>
                        </span>

                        <span className="shrink-0 text-[8px] text-neutral-700 font-mono">
                          {photo.createdAt?.toDate
                            ? photo.createdAt
                                .toDate()
                                .toLocaleDateString(
                                  undefined,
                                  {
                                    month: 'short',
                                    day: 'numeric',
                                  }
                                )
                            : 'Recent'}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Mobile Bottom Upload CTA */}
          {!loading &&
            filteredPhotos.length > 0 &&
            user && (
              <div className="mt-12 pt-6 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-neutral-400">
                    Have a campus moment?
                  </p>

                  <p className="text-[9px] text-neutral-700 mt-1">
                    Add it to the archive.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setIsUploadModalOpen(true)
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-black text-[9px] font-bold active:scale-95 transition"
                >
                  <Upload className="w-3 h-3" />
                  Upload
                </button>
              </div>
            )}
        </section>
      </div>

      {/* =========================================================
          UPLOAD PHOTO MODAL
          Shared between desktop + mobile
          ========================================================= */}

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl bg-[#201e1c] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">

            <button
              onClick={() => {
                if (!uploading) {
                  setIsUploadModalOpen(false);
                  setUploadFile(null);
                  setUploadPreview(null);
                }
              }}
              className="absolute top-6 right-6 text-neutral-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Camera className="w-4 h-4" />
                <span>Community Submissions</span>
              </div>

              <h3 className="text-2xl font-bold text-white">
                Upload to GIKI Gallery
              </h3>

              <p className="text-xs text-neutral-400 mt-1">
                Share your campus moments. Images are
                automatically compressed and capped in
                resolution for fast web display without
                lag.
              </p>
            </div>

            {uploadError && (
              <div className="mb-6 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form
              onSubmit={handleUploadSubmit}
              className="space-y-5"
            >
              {/* Image Drop / Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                  Select Image File{' '}
                  <span className="text-red-400">
                    *
                  </span>
                </label>

                {!uploadPreview ? (
                  <label
                    htmlFor="gallery-file-input"
                    className="border-2 border-dashed border-white/20 hover:border-cyan-500/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-black/40 hover:bg-cyan-500/5 transition duration-200 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-cyan-500/20 text-neutral-400 group-hover:text-cyan-400 flex items-center justify-center mb-3 transition">
                      <Upload className="w-6 h-6" />
                    </div>

                    <span className="text-sm font-semibold text-white group-hover:text-cyan-400 transition">
                      Click to choose or drag photo
                      here
                    </span>

                    <span className="text-xs text-neutral-500 mt-1">
                      JPEG, PNG, WEBP (Max 20MB)
                    </span>

                    <input
                      id="gallery-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-white/10 flex items-center justify-center group">
                    <img
                      src={uploadPreview}
                      alt="Preview"
                      className="max-h-full max-w-full object-contain"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setUploadFile(null);
                        setUploadPreview(null);
                      }}
                      disabled={uploading}
                      className="absolute top-3 right-3 bg-red-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow hover:bg-red-700 transition flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>

                    <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-cyan-400 font-mono border border-white/10">
                      Resolution capping enabled
                    </div>
                  </div>
                )}
              </div>

              {/* Caption Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                  Photo Caption / Title{' '}
                  <span className="text-red-400">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  required
                  disabled={uploading}
                  placeholder="e.g., Sunset over the Academic Blocks after finals..."
                  value={uploadCaption}
                  onChange={(e) =>
                    setUploadCaption(e.target.value)
                  }
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white placeholder-neutral-600 text-sm focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                  Category{' '}
                  <span className="text-red-400">
                    *
                  </span>
                </label>

                <select
                  disabled={uploading}
                  value={uploadCategory}
                  onChange={(e) =>
                    setUploadCategory(e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white text-sm focus:outline-none focus:border-cyan-500 transition"
                >
                  {CATEGORIES.filter(
                    (c) => c !== 'All'
                  ).map((cat) => (
                    <option
                      key={cat}
                      value={cat}
                      className="bg-[#201e1c] text-white"
                    >
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload Progress / Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={
                    uploading || !uploadFile
                  }
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />

                      <span>
                        {uploadProgress ||
                          'Processing...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>
                        Submit Photo for Review
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          LIGHTBOX SLIDER MODAL
          Shared between desktop + mobile
          ========================================================= */}

      {currentLightboxPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-fade-in p-4 sm:p-10">

          {/* Top Bar Controls */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
            <div className="flex items-center gap-3">
              <span className="bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-extrabold uppercase px-3 py-1 rounded-full">
                {currentLightboxPhoto.category ||
                  'General'}
              </span>

              {currentLightboxPhoto.isHighlighted && (
                <span className="bg-amber-500 text-black font-extrabold text-xs uppercase px-3 py-1 rounded-full shadow">
                  Showcase
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">

              {/* Admin Moderation Actions inside Lightbox */}
              {canModerate && (
                <div className="flex items-center gap-2 bg-[#201e1c] border border-white/10 px-3 py-1.5 rounded-full">
                  <button
                    onClick={() =>
                      handleLightboxHighlight(
                        currentLightboxPhoto.id,
                        currentLightboxPhoto.isHighlighted
                      )
                    }
                    disabled={actionLoading}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      currentLightboxPhoto.isHighlighted
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                    }`}
                    title="Toggle Showcase Highlight"
                  >
                    {currentLightboxPhoto.isHighlighted
                      ? '★ Highlighted'
                      : '☆ Highlight'}
                  </button>

                  <button
                    onClick={() =>
                      handleLightboxDelete(
                        currentLightboxPhoto.id
                      )
                    }
                    disabled={actionLoading}
                    className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 text-xs font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                    title="Delete Photo"
                  >
                    Delete
                  </button>
                </div>
              )}

              <button
                onClick={() =>
                  setLightboxIndex(null)
                }
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Left Arrow */}
          {filteredPhotos.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-4 sm:left-8 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-cyan-500/80 text-white hover:text-black border border-white/15 flex items-center justify-center transition-all duration-200 cursor-pointer"
              title="Previous (Left Arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Main Photo Display */}
          <div className="relative max-w-5xl max-h-[75vh] flex items-center justify-center">
            <img
              src={
                currentLightboxPhoto.fullSizeUrl ||
                currentLightboxPhoto.imageUrl
              }
              alt={
                currentLightboxPhoto.caption ||
                'Lightbox View'
              }
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10 animate-scale-up"
            />
          </div>

          {/* Right Arrow */}
          {filteredPhotos.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 sm:right-8 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-cyan-500/80 text-white hover:text-black border border-white/15 flex items-center justify-center transition-all duration-200 cursor-pointer"
              title="Next (Right Arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Bottom Bar Info */}
          <div className="absolute bottom-6 left-6 right-6 z-20 max-w-3xl mx-auto bg-[#201e1c] backdrop-blur-xl border border-white/15 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {currentLightboxPhoto.caption ||
                  'Untitled Snapshot'}
              </h3>

              <div className="flex items-center gap-4 text-xs text-neutral-400">
                <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
                  <User className="w-3.5 h-3.5" />

                  <span>
                    Uploaded by{' '}
                    {currentLightboxPhoto.uploaderName ||
                      'Community Member'}
                  </span>
                </span>

                {currentLightboxPhoto.createdAt
                  ?.toDate && (
                  <span className="flex items-center gap-1.5 text-neutral-500 font-mono">
                    <CalendarIcon className="w-3.5 h-3.5" />

                    <span>
                      {currentLightboxPhoto.createdAt
                        .toDate()
                        .toLocaleDateString(
                          undefined,
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }
                        )}
                    </span>
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs text-neutral-500 font-mono self-end sm:self-center">
              {lightboxIndex! + 1} /{' '}
              {filteredPhotos.length}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};