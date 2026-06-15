import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getGalleryPhotos, 
  uploadGalleryPhoto, 
  getHighlightedPhotos, 
  togglePhotoHighlight, 
  updateGalleryPhotoStatus, 
  deleteGalleryPhoto,
  type GalleryPhoto 
} from '../services/firebase';

export const Gallery: React.FC = () => {
  const { user, isAdmin } = useAuth();
  
  // States
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [highlightedPhotos, setHighlightedPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedLoading, setHighlightedLoading] = useState(true);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'approved' | 'pending' | 'rejected'>('approved');
  
  // Admin stats
  const [stats, setStats] = useState({ approved: 0, pending: 0, rejected: 0 });
  
  // Highlight Carousel Index
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const slideshowTimer = useRef<any>(null);

  // Lightbox & Modal States
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionPhotoId, setRejectionPhotoId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Form States
  const [submissionCaption, setSubmissionCaption] = useState('');
  const [submissionCategory, setSubmissionCategory] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionPreviewUrl, setSubmissionPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Load photos based on status
  const loadPhotos = async () => {
    setLoading(true);
    try {
      const res = await getGalleryPhotos(statusFilter);
      if (res.success && res.photos) {
        setPhotos(res.photos);
      }
    } catch (err) {
      console.error("Error loading gallery photos:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load stats for admin
  const loadStats = async () => {
    if (!isAdmin) return;
    try {
      const appRes = await getGalleryPhotos('approved');
      const pendRes = await getGalleryPhotos('pending');
      const rejRes = await getGalleryPhotos('rejected');
      setStats({
        approved: appRes.success ? appRes.photos?.length || 0 : 0,
        pending: pendRes.success ? pendRes.photos?.length || 0 : 0,
        rejected: rejRes.success ? rejRes.photos?.length || 0 : 0,
      });
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  // Load highlighted photos for slideshow
  const loadHighlighted = async () => {
    setHighlightedLoading(true);
    try {
      const res = await getHighlightedPhotos();
      if (res.success && res.photos) {
        setHighlightedPhotos(res.photos);
      }
    } catch (err) {
      console.error("Error loading highlighted photos:", err);
    } finally {
      setHighlightedLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, [statusFilter]);

  useEffect(() => {
    loadHighlighted();
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin]);

  // Slideshow Auto-Advance
  useEffect(() => {
    if (slideshowTimer.current) clearInterval(slideshowTimer.current);
    
    if (highlightedPhotos.length > 1) {
      slideshowTimer.current = setInterval(() => {
        setCurrentSlideIndex(prev => (prev + 1) % highlightedPhotos.length);
      }, 5000);
    }

    return () => {
      if (slideshowTimer.current) clearInterval(slideshowTimer.current);
    };
  }, [highlightedPhotos]);

  // Handle file input changes for preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSubmissionFile(file);
      setSubmissionPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Upload Photo to Cloudinary and save to Firestore
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionCaption || !submissionCategory || !submissionFile) {
      alert("Please fill in all fields and choose a photo.");
      return;
    }

    setSubmitting(true);
    try {
      const cloudName = "dfkpmldma";
      const uploadPreset = "giki-chronicles";
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      
      const formData = new FormData();
      formData.append("file", submissionFile);
      formData.append("upload_preset", uploadPreset);

      const response = await fetch(url, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Failed to upload image to Cloudinary");
      }

      const data = await response.json();
      const secureUrl = data.secure_url;
      const cloudinaryId = data.public_id;

      const dbRes = await uploadGalleryPhoto({
        imageUrl: secureUrl,
        fullSizeUrl: secureUrl,
        caption: submissionCaption,
        category: submissionCategory,
        cloudinaryId
      });

      if (dbRes.success) {
        alert("Photo submitted successfully for review!");
        setIsSubmissionModalOpen(false);
        setSubmissionCaption('');
        setSubmissionCategory('');
        setSubmissionFile(null);
        setSubmissionPreviewUrl(null);
        loadPhotos();
        if (isAdmin) loadStats();
      } else {
        alert("Failed to submit photo details: " + dbRes.error);
      }
    } catch (err: any) {
      alert("Upload error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Moderation / Gallery operations
  const handleToggleHighlight = async (id: string, currentHighlighted: boolean) => {
    setActionLoading(true);
    try {
      const res = await togglePhotoHighlight(id, !currentHighlighted);
      if (res.success) {
        // Update local state
        setPhotos(prev => prev.map(p => p.id === id ? { ...p, isHighlighted: !currentHighlighted } : p));
        if (selectedPhoto && selectedPhoto.id === id) {
          setSelectedPhoto(prev => prev ? { ...prev, isHighlighted: !currentHighlighted } : null);
        }
        loadHighlighted();
        alert(`Photo ${!currentHighlighted ? 'added to' : 'removed from'} highlighted slideshow.`);
      } else {
        alert("Error updating highlight: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprovePhoto = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await updateGalleryPhotoStatus(id, 'approved');
      if (res.success) {
        setPhotos(prev => prev.filter(p => p.id !== id));
        setSelectedPhoto(null);
        loadPhotos();
        loadHighlighted();
        loadStats();
        alert("Photo approved!");
      } else {
        alert("Error: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPhotoOpen = (id: string) => {
    setRejectionPhotoId(id);
    setIsRejectionModalOpen(true);
  };

  const handleRejectPhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionPhotoId) return;

    setActionLoading(true);
    try {
      const res = await updateGalleryPhotoStatus(rejectionPhotoId, 'rejected', rejectionReason);
      if (res.success) {
        setPhotos(prev => prev.filter(p => p.id !== rejectionPhotoId));
        setSelectedPhoto(null);
        setIsRejectionModalOpen(false);
        setRejectionPhotoId(null);
        setRejectionReason('');
        loadPhotos();
        loadStats();
        alert("Photo rejected.");
      } else {
        alert("Error: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!window.confirm("Permanently delete this photo? This will remove it from the gallery grid.")) return;
    setActionLoading(true);
    try {
      const res = await deleteGalleryPhoto(id);
      if (res.success) {
        setPhotos(prev => prev.filter(p => p.id !== id));
        setSelectedPhoto(null);
        loadPhotos();
        loadHighlighted();
        loadStats();
        alert("Photo permanently deleted.");
      } else {
        alert("Error: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Photo List
  const filteredPhotos = photos.filter(p => categoryFilter === 'all' || p.category === categoryFilter);

  // Lightbox Navigation helpers
  const handlePrevLightbox = () => {
    if (!selectedPhoto) return;
    const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto.id);
    if (currentIndex > 0) {
      setSelectedPhoto(filteredPhotos[currentIndex - 1]);
    } else {
      setSelectedPhoto(filteredPhotos[filteredPhotos.length - 1]); // Wrap to end
    }
  };

  const handleNextLightbox = () => {
    if (!selectedPhoto) return;
    const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto.id);
    if (currentIndex < filteredPhotos.length - 1) {
      setSelectedPhoto(filteredPhotos[currentIndex + 1]);
    } else {
      setSelectedPhoto(filteredPhotos[0]); // Wrap to start
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Keyboard controls for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;
      if (e.key === 'ArrowLeft') handlePrevLightbox();
      if (e.key === 'ArrowRight') handleNextLightbox();
      if (e.key === 'Escape') setSelectedPhoto(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, filteredPhotos]);

  return (
    <div 
      className="min-h-screen text-white py-12 relative z-10 gallery-theme"
      style={{
        background: `radial-gradient(300px 220px at 12% 18%, rgba(207,227,242,0.15), transparent 65%),
                     radial-gradient(320px 230px at 86% 14%, rgba(187,214,236,0.12), transparent 62%),
                     radial-gradient(360px 260px at 26% 82%, rgba(168,203,231,0.08), transparent 60%),
                     radial-gradient(340px 240px at 76% 76%, rgba(141,181,217,0.08), transparent 58%),
                     linear-gradient(160deg, rgba(255,255,255,0.06) 12%, transparent 12.5% 22%, rgba(255,255,255,0.05) 22.5% 32%, transparent 32.5% 44%, rgba(255,255,255,0.04) 44.5%)`,
        backgroundBlendMode: 'screen, screen, overlay, overlay, overlay',
      }}
    >
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold font-serif mb-4 tracking-tight">
            Campus <span className="text-[#B3CFE5]">Gallery</span>
          </h1>
          <p className="text-[#B3CFE5] max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Explore and upload visual snapshots from across the GIKI valley.
          </p>
        </div>

        {/* Featured Slideshow */}
        <section className="mb-14">
          <div className="text-left mb-4 flex items-center gap-2">
            <h2 className="text-xl font-bold font-serif text-white flex items-center gap-2">
              ⭐ Featured <span className="text-[#B3CFE5]">Moments</span>
            </h2>
          </div>

          {highlightedLoading ? (
            <div className="w-full h-64 sm:h-[400px] animate-pulse rounded-[2.5rem] bg-[#1A3D63]/30 border border-white/5"></div>
          ) : highlightedPhotos.length > 0 ? (
            <div 
              className="relative h-64 sm:h-[420px] rounded-[2.5rem] overflow-hidden border border-[#B3CFE5]/25 shadow-2xl flex items-end justify-start p-6 sm:p-12 group"
              style={{
                backgroundImage: `linear-gradient(to top, rgba(10,25,49,0.95), rgba(10,25,49,0.3) 50%, rgba(10,25,49,0.1)), url(${highlightedPhotos[currentSlideIndex].fullSizeUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transition: 'background-image 0.5s ease-in-out'
              }}
            >
              <div className="max-w-xl bg-black/45 backdrop-blur-md p-5 sm:p-8 rounded-[2rem] border border-white/10 shadow-2xl text-left">
                <span className="text-[9px] font-bold text-[#B3CFE5]/60 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded uppercase tracking-wider mb-2.5 inline-block">
                  {highlightedPhotos[currentSlideIndex].category}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
                  "{highlightedPhotos[currentSlideIndex].caption}"
                </h3>
                <p className="text-xs text-[#B3CFE5]/80">
                  Shared by <strong className="text-white">{highlightedPhotos[currentSlideIndex].uploaderName}</strong> on {formatDate(highlightedPhotos[currentSlideIndex].createdAt)}
                </p>
              </div>

              {/* Slider controls */}
              {highlightedPhotos.length > 1 && (
                <>
                  <button 
                    onClick={() => setCurrentSlideIndex(prev => (prev - 1 + highlightedPhotos.length) % highlightedPhotos.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/35 backdrop-blur-sm border border-white/10 text-white font-bold flex items-center justify-center cursor-pointer hover:bg-black/60 transition opacity-0 group-hover:opacity-100"
                  >
                    ‹
                  </button>
                  <button 
                    onClick={() => setCurrentSlideIndex(prev => (prev + 1) % highlightedPhotos.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/35 backdrop-blur-sm border border-white/10 text-white font-bold flex items-center justify-center cursor-pointer hover:bg-black/60 transition opacity-0 group-hover:opacity-100"
                  >
                    ›
                  </button>
                  <div className="absolute bottom-6 right-6 flex gap-1.5 z-20">
                    {highlightedPhotos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlideIndex(i)}
                        className={`w-2 h-2 rounded-full cursor-pointer transition ${i === currentSlideIndex ? 'bg-white scale-125' : 'bg-white/40'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            // Fallback: If no highlighted posts, show first approved photo
            photos.length > 0 && photos[0].status === 'approved' ? (
              <div 
                className="relative h-64 sm:h-[420px] rounded-[2.5rem] overflow-hidden border border-[#B3CFE5]/25 shadow-2xl flex items-end justify-start p-6 sm:p-12 group"
                style={{
                  backgroundImage: `linear-gradient(to top, rgba(10,25,49,0.95), rgba(10,25,49,0.3) 50%, rgba(10,25,49,0.1)), url(${photos[0].fullSizeUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="max-w-xl bg-black/45 backdrop-blur-md p-5 sm:p-8 rounded-[2rem] border border-white/10 shadow-2xl text-left">
                  <span className="text-[9px] font-bold text-[#B3CFE5]/60 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded uppercase tracking-wider mb-2.5 inline-block">
                    {photos[0].category}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
                    "{photos[0].caption}"
                  </h3>
                  <p className="text-xs text-[#B3CFE5]/80">
                    Shared by <strong className="text-white">{photos[0].uploaderName}</strong> on {formatDate(photos[0].createdAt)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 border border-[#B3CFE5]/10 bg-[#0A1931]/30 rounded-[2.5rem] text-[#B3CFE5]/55 text-sm">
                No gallery snapshots approved yet. Check back later!
              </div>
            )
          )}
        </section>

        {/* Filter and Actions Row */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#0E223C] border border-[#B3CFE5]/30 text-white rounded-xl p-2.5 focus:outline-none focus:border-white transition-all text-sm font-semibold cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Academic Blocks">Academic Blocks</option>
              <option value="Hostels">Hostels</option>
              <option value="Sports Complex">Sports Complex</option>
              <option value="General">General</option>
            </select>

            {/* Admin Tabs */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 bg-[#0E223C] border border-[#B3CFE5]/20 p-1 rounded-xl">
                <button
                  onClick={() => setStatusFilter('approved')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${statusFilter === 'approved' ? 'bg-[#4A7FA7] text-white' : 'text-[#B3CFE5]/60 hover:text-white'}`}
                >
                  Approved ({stats.approved})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${statusFilter === 'pending' ? 'bg-[#D97706] text-white' : 'text-[#B3CFE5]/60 hover:text-white'}`}
                >
                  Pending ({stats.pending})
                </button>
                <button
                  onClick={() => setStatusFilter('rejected')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${statusFilter === 'rejected' ? 'bg-[#DC2626] text-white' : 'text-[#B3CFE5]/60 hover:text-white'}`}
                >
                  Rejected ({stats.rejected})
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            {user ? (
              <button
                onClick={() => setIsSubmissionModalOpen(true)}
                className="px-6 py-2.5 rounded-full font-bold text-sm bg-[#4A7FA7] hover:bg-[#1A3D63] text-white border border-[#B3CFE5]/30 cursor-pointer shadow-md transition-all hover:scale-[1.01]"
              >
                Submit Snapshot
              </button>
            ) : (
              <div className="text-xs text-[#B3CFE5]/60">
                Please login to submit pictures to the gallery.
              </div>
            )}
          </div>
        </section>

        {/* Masonry Columns Layout */}
        <section className="mb-16">
          {loading ? (
            <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6">
              <div className="h-64 animate-pulse rounded-3xl bg-[#1A3D63]/30 border border-white/5 break-inside-avoid"></div>
              <div className="h-80 animate-pulse rounded-3xl bg-[#1A3D63]/30 border border-white/5 break-inside-avoid"></div>
              <div className="h-72 animate-pulse rounded-3xl bg-[#1A3D63]/30 border border-white/5 break-inside-avoid"></div>
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="text-center py-16 border border-[#B3CFE5]/10 bg-white/5 rounded-3xl text-[#B3CFE5]/55 text-sm">
              No photos found matching the selected filters.
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="relative group rounded-3xl overflow-hidden border border-[#B3CFE5]/15 shadow-xl hover:shadow-2xl hover:border-[#B3CFE5]/30 cursor-pointer bg-[#0E223C]/50 transition duration-300 break-inside-avoid flex flex-col"
                >
                  {/* Photo Image */}
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption}
                    className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none">
                    <span className="bg-[#4A7FA7]/90 backdrop-blur-sm text-[9px] font-extrabold uppercase px-2 py-0.5 rounded shadow">
                      {photo.category}
                    </span>
                    {photo.isHighlighted && (
                      <span className="bg-yellow-500/90 text-black text-[9px] font-extrabold px-2 py-0.5 rounded shadow flex items-center gap-0.5">
                        ⭐ Highlighted
                      </span>
                    )}
                  </div>

                  {/* Delete button for uploader/admin */}
                  {(isAdmin || (user && user.uid === photo.uploaderId)) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(photo.id!);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-600/80 hover:bg-red-700 backdrop-blur-sm text-white font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer border border-red-500/30 shadow"
                      title="Delete Permanently"
                    >
                      ✕
                    </button>
                  )}

                  {/* Caption Footer Drawer */}
                  <div className="p-4 bg-gradient-to-t from-black/80 to-black/30 group-hover:from-[#0A1931]/95 group-hover:to-[#0A1931]/75 border-t border-white/5 transition-colors">
                    <h4 className="font-bold text-white text-sm leading-snug line-clamp-2">
                      "{photo.caption}"
                    </h4>
                    <div className="flex justify-between items-center text-[10px] text-[#B3CFE5]/60 mt-2">
                      <span>By <strong className="text-white">{photo.uploaderName}</strong></span>
                      <span>{formatDate(photo.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Lightbox / Slider Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm z-50 animate-fade-in">
          {/* Previous image */}
          <button 
            onClick={handlePrevLightbox}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center cursor-pointer border border-white/10 transition z-20 text-2xl"
          >
            ‹
          </button>

          {/* Close Lightbox */}
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center cursor-pointer border border-white/10 transition z-20 text-lg"
          >
            ✕
          </button>

          {/* Next image */}
          <button 
            onClick={handleNextLightbox}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center cursor-pointer border border-white/10 transition z-20 text-2xl"
          >
            ›
          </button>

          {/* Main content drawer */}
          <div className="max-w-4xl w-full flex flex-col items-center">
            <div className="relative max-h-[70vh] rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl flex items-center justify-center">
              <img 
                src={selectedPhoto.fullSizeUrl} 
                alt={selectedPhoto.caption} 
                className="max-h-[70vh] max-w-full object-contain"
              />
            </div>

            {/* Photo metadata details */}
            <div className="w-full max-w-2xl bg-[#0E223C]/90 border border-[#B3CFE5]/20 mt-4 p-5 rounded-2xl text-left backdrop-blur flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-1">
                <div className="flex gap-2 items-center flex-wrap">
                  <span className="text-[10px] font-bold text-[#B3CFE5] bg-[#4A7FA7]/20 border border-[#4A7FA7]/30 px-2 py-0.5 rounded uppercase tracking-wider">
                    {selectedPhoto.category}
                  </span>
                  {selectedPhoto.isHighlighted && (
                    <span className="text-[10px] font-bold text-[#B3CFE5] bg-yellow-500/20 border border-yellow-500/30 px-2 py-0.5 rounded uppercase tracking-wider">
                      ⭐ Highlighted
                    </span>
                  )}
                  {selectedPhoto.status !== 'approved' && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${selectedPhoto.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}`}>
                      ⚠️ {selectedPhoto.status}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white leading-tight">
                  "{selectedPhoto.caption}"
                </h3>
                <p className="text-xs text-[#B3CFE5]/60">
                  Shared by <strong className="text-white">{selectedPhoto.uploaderName}</strong> on {formatDate(selectedPhoto.createdAt)}
                </p>
                {selectedPhoto.rejectionReason && (
                  <p className="text-xs text-red-400 mt-2 bg-red-950/30 border border-red-500/20 p-2.5 rounded-lg">
                    Rejection Reason: {selectedPhoto.rejectionReason}
                  </p>
                )}
              </div>

              {/* Admin Actions inside Lightbox */}
              {isAdmin && (
                <div className="flex flex-col md:items-end justify-center gap-2 min-w-[150px]">
                  {selectedPhoto.status === 'approved' && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleToggleHighlight(selectedPhoto.id!, selectedPhoto.isHighlighted)}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition border cursor-pointer ${
                        selectedPhoto.isHighlighted 
                          ? 'bg-yellow-600/30 text-yellow-300 border-yellow-500/30 hover:bg-yellow-600/40' 
                          : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {selectedPhoto.isHighlighted ? '⭐ Unhighlight' : '☆ Highlight'}
                    </button>
                  )}
                  {selectedPhoto.status === 'pending' && (
                    <>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleApprovePhoto(selectedPhoto.id!)}
                        className="w-full py-1.5 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition cursor-pointer border border-green-500/30"
                      >
                        Approve Photo
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleRejectPhotoOpen(selectedPhoto.id!)}
                        className="w-full py-1.5 px-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-xs font-bold transition cursor-pointer border border-yellow-500/30"
                      >
                        Reject Photo
                      </button>
                    </>
                  )}
                  <button
                    disabled={actionLoading}
                    onClick={() => handleDeletePhoto(selectedPhoto.id!)}
                    className="w-full py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition cursor-pointer border border-red-500/30"
                  >
                    Delete Photo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submission Modal */}
      {isSubmissionModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm z-50 animate-fade-in">
          <div 
            className="w-full max-w-md rounded-3xl p-8 border border-[#B3CFE5]/30 shadow-2xl relative text-white"
            style={{
              background: 'linear-gradient(135deg, rgba(10,25,49,0.98), rgba(20,45,75,0.98))',
            }}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold font-serif text-[#B3CFE5]">Share GIKI Snapshot</h3>
                <p className="text-xs text-[#B3CFE5]/50 mt-0.5">Submit photos to the approved review gallery</p>
              </div>
              <button 
                onClick={() => {
                  setIsSubmissionModalOpen(false);
                  setSubmissionPreviewUrl(null);
                  setSubmissionFile(null);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition text-white/60 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#B3CFE5] uppercase tracking-wider mb-2">Caption</label>
                <input
                  type="text"
                  required
                  value={submissionCaption}
                  onChange={(e) => setSubmissionCaption(e.target.value)}
                  placeholder="e.g. Beautiful Sunset behind Hostels"
                  className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3 text-white focus:outline-none focus:border-white focus:ring-3 focus:ring-white/10 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#B3CFE5] uppercase tracking-wider mb-2">Category</label>
                <select
                  required
                  value={submissionCategory}
                  onChange={(e) => setSubmissionCategory(e.target.value)}
                  className="w-full bg-[#0E223C] border border-[#B3CFE5]/30 text-white rounded-xl p-3 focus:outline-none focus:border-white transition-all text-sm cursor-pointer"
                >
                  <option value="">Select Category</option>
                  <option value="Academic Blocks">Academic Blocks</option>
                  <option value="Hostels">Hostels</option>
                  <option value="Sports Complex">Sports Complex</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#B3CFE5] uppercase tracking-wider mb-2">Upload Image</label>
                <input
                  type="file"
                  required
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-[#B3CFE5] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#4A7FA7]/20 file:text-[#B3CFE5] hover:file:bg-[#4A7FA7]/40 file:cursor-pointer"
                />
                <p className="text-[10px] text-[#B3CFE5]/40 mt-1">Image files only (JPG, PNG, WebP up to 10MB)</p>
              </div>

              {/* Upload Image Preview */}
              {submissionPreviewUrl && (
                <div className="mt-4 border border-[#B3CFE5]/20 rounded-xl overflow-hidden max-h-40 bg-black/20 flex items-center justify-center">
                  <img src={submissionPreviewUrl} alt="Preview" className="max-h-40 max-w-full object-contain" />
                </div>
              )}

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmissionModalOpen(false);
                    setSubmissionPreviewUrl(null);
                    setSubmissionFile(null);
                  }}
                  className="px-4 py-2 rounded-full text-sm font-semibold border border-white/10 bg-white/5 hover:bg-white/10 text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-full text-sm font-bold bg-[#4A7FA7] hover:bg-[#1A3D63] text-white border border-[#B3CFE5]/40 transition shadow cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Uploading...' : 'Submit Snapshot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {isRejectionModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm z-[60] animate-fade-in">
          <div 
            className="w-full max-w-md rounded-3xl p-8 border border-red-500/30 shadow-2xl relative text-white"
            style={{
              background: 'linear-gradient(135deg, rgba(10,25,49,0.98), rgba(20,45,75,0.98))',
            }}
          >
            <h3 className="text-xl font-bold font-serif text-red-400 mb-2">Reject Gallery Photo</h3>
            <p className="text-xs text-[#B3CFE5]/60 mb-4">Provide a cancellation details feedback reason to uploader.</p>
            
            <form onSubmit={handleRejectPhotoSubmit} className="space-y-4">
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Describe why this photo is rejected (e.g. low quality, inappropriate category)..."
                className="w-full bg-white/5 border border-red-500/20 rounded-xl p-3 text-white focus:outline-none focus:border-red-400 transition-all resize-none text-sm"
              />

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsRejectionModalOpen(false);
                    setRejectionPhotoId(null);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 rounded-full text-sm font-semibold border border-white/10 bg-white/5 hover:bg-white/10 text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-full text-sm font-bold bg-red-600 hover:bg-red-700 text-white border border-red-500/40 transition shadow cursor-pointer disabled:opacity-60"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
