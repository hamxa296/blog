/**
 * gallery.js
 * Handles all Firestore interactions for the photo gallery with photo viewing modals.
 */

/*
    FIRESTORE DATABASE STRUCTURE:

    'galleryPhotos' collection:
    - imageUrl (string): The URL of the image from Cloudinary.
    - fullSizeUrl (string): The full-size URL for fullscreen viewing.
    - caption (string): The user-submitted caption.
    - category (string): e.g., "Academic Blocks", "Hostels".
    - uploaderName (string): Name of the user who submitted.
    - uploaderId (string): UID of the user who submitted.
    - cloudinaryId (string): Cloudinary public ID for deletion.
    - isHighlighted (boolean): Whether this photo should be featured in the slideshow.
    - status (string): "approved", "pending", or "rejected"
    - createdAt (timestamp): When the photo was submitted.
    - reviewedAt (timestamp): When the photo was reviewed (for approved/rejected)
    - reviewedBy (string): UID of the admin who reviewed the photo
    - rejectionReason (string): Optional reason for rejection
*/

// Global variables for photo viewing
let currentPhotoIndex = 0;
let currentPhotos = [];
let isPhotoModalOpen = false;

/**
 * Fetches all photos from the gallery by status with pagination.
 * @param {string} status - "approved", "pending", "rejected", or "all"
 * @param {number} page - Page number (0-based)
 * @param {number} limit - Number of photos per page
 * @returns {Promise<object>}
 */
async function getGalleryPhotos(status = "approved", page = 0, limit = 12) {
    try {
        let query;
        if (status === "all") {
            query = db.collection("galleryPhotos")
                .orderBy("createdAt", "desc");
        } else {
            query = db.collection("galleryPhotos")
                .where("status", "==", status)
                .orderBy("createdAt", "desc");
        }
        
        // Apply pagination
        if (page > 0) {
            // For pagination, we need to get the last document from the previous page
            let prevPageQuery;
            if (status === "all") {
                prevPageQuery = db.collection("galleryPhotos")
                    .orderBy("createdAt", "desc")
                    .limit(page * limit);
            } else {
                prevPageQuery = db.collection("galleryPhotos")
                    .where("status", "==", status)
                    .orderBy("createdAt", "desc")
                    .limit(page * limit);
            }
            
            const prevPageSnapshot = await prevPageQuery.get();
            const lastDoc = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
            
            if (lastDoc) {
                query = query.startAfter(lastDoc);
            }
        }
        
        const snapshot = await query.limit(limit).get();
        const photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { success: true, photos };
    } catch (error) {
        console.error("Error fetching gallery photos:", error);
        return { success: false, error: "Could not load photos." };
    }
}

/**
 * Fetches highlighted photos for the slideshow.
 * @returns {Promise<object>}
 */
async function getHighlightedPhotos() {
    try {
        // Avoid composite index by fetching highlighted approved and sorting client-side
        const snapshot = await db.collection("galleryPhotos")
            .where("status", "==", "approved")
            .where("isHighlighted", "==", true)
            .get();
        const photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        photos.sort((a, b) => {
            const at = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const bt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return bt - at;
        });
        return { success: true, photos };
    } catch (error) {
        console.error("Error fetching highlighted photos:", error);
        return { success: false, error: "Could not load highlighted photos." };
    }
}

/**
 * Opens a photo in a fullscreen modal with navigation.
 * @param {string} photoId - The ID of the photo to open.
 * @param {Array} photos - Array of all photos for navigation.
 * @param {number} startIndex - Starting index in the photos array.
 */
function openPhotoModal(photoId, photos, startIndex = 0) {
    currentPhotos = photos;
    currentPhotoIndex = startIndex;
    isPhotoModalOpen = true;
    
    // Find the photo index if photoId is provided
    if (photoId) {
        const foundIndex = photos.findIndex(p => p.id === photoId);
        if (foundIndex !== -1) {
            currentPhotoIndex = foundIndex;
        }
    }
    
    displayPhotoModal();
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

/**
 * Displays the photo modal with current photo and navigation.
 */
function displayPhotoModal() {
    if (currentPhotos.length === 0 || currentPhotoIndex < 0 || currentPhotoIndex >= currentPhotos.length) {
        return;
    }
    
    const photo = currentPhotos[currentPhotoIndex];
    const modal = document.getElementById('photo-view-modal');
    const modalContent = document.getElementById('photo-modal-content');
    
    if (!modal || !modalContent) {
        console.error('Photo modal elements not found');
        return;
    }
    
    // Update modal content with exact index.html styling
    modalContent.innerHTML = `
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-6 border-b border-[#B3CFE5]/20">
            <div class="flex items-center space-x-3">
                <div class="w-3 h-3 bg-[#B3CFE5] rounded-full"></div>
                <h2 class="text-2xl font-bold text-white">Photo Gallery</h2>
            </div>
            <button onclick="closePhotoModal()" class="text-[#B3CFE5] hover:text-white transition-colors duration-300" aria-label="Close">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
        
        <!-- Modal Content -->
        <div class="p-6 pb-8 overflow-y-auto">
            <div class="max-w-5xl mx-auto">
                <!-- Photo Display Section -->
                <div class="mb-8">
                    <div class="rounded-2xl overflow-hidden shadow-2xl border border-[#B3CFE5]/20">
                        <img src="${photo.fullSizeUrl || photo.imageUrl}" 
                             alt="${photo.caption || 'Gallery Photo'}" 
                             class="w-full h-96 md:h-[500px] object-cover">
                    </div>
                </div>
                
                <!-- Photo Info Card -->
                <div class="bg-gradient-to-br from-[#0A1931]/90 to-[#1A3D63]/90 rounded-3xl p-8 border border-[#B3CFE5]/30 backdrop-blur-sm shadow-xl">
                    <!-- Header with badge and navigation -->
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center space-x-3">
                            <div class="w-4 h-4 bg-[#B3CFE5] rounded-full"></div>
                            <span class="text-[#B3CFE5] text-lg font-semibold uppercase tracking-wider">Photo Details</span>
                        </div>
                        ${currentPhotos.length > 1 ? `
                            <div class="flex items-center space-x-2">
                                <button onclick="navigatePhoto(-1)" class="w-10 h-10 bg-[#4A7FA7]/20 text-[#B3CFE5] rounded-full hover:bg-[#4A7FA7]/40 transition-colors duration-300 flex items-center justify-center ${currentPhotoIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                    </svg>
                                </button>
                                <span class="text-[#B3CFE5]/80 text-sm bg-[#B3CFE5]/10 px-3 py-1 rounded-full">${currentPhotoIndex + 1} of ${currentPhotos.length}</span>
                                <button onclick="navigatePhoto(1)" class="w-10 h-10 bg-[#4A7FA7]/20 text-[#B3CFE5] rounded-full hover:bg-[#4A7FA7]/40 transition-colors duration-300 flex items-center justify-center ${currentPhotoIndex === currentPhotos.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Title and Description -->
                    <div class="mb-6">
                        <h3 class="text-2xl font-bold text-white mb-3">${photo.caption || 'Untitled Photo'}</h3>
                        ${photo.description ? `<p class="text-[#B3CFE5]/90 leading-relaxed text-lg">${photo.description}</p>` : ''}
                    </div>
                    
                    <!-- Meta Information -->
                    <div class="grid md:grid-cols-3 gap-6 mb-6">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-gradient-to-br from-[#4A7FA7] to-[#B3CFE5] rounded-full flex items-center justify-center">
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                            </div>
                            <div>
                                <p class="text-[#B3CFE5]/70 text-sm">Uploader</p>
                                <p class="text-white font-medium">${photo.uploaderName || 'Unknown'}</p>
                            </div>
                        </div>
                        
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-gradient-to-br from-[#4A7FA7] to-[#B3CFE5] rounded-full flex items-center justify-center">
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                                </svg>
                            </div>
                            <div>
                                <p class="text-[#B3CFE5]/70 text-sm">Category</p>
                                <p class="text-white font-medium">${photo.category || 'General'}</p>
                            </div>
                        </div>
                        
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-gradient-to-br from-[#4A7FA7] to-[#B3CFE5] rounded-full flex items-center justify-center">
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                            </div>
                            <div>
                                <p class="text-[#B3CFE5]/70 text-sm">Date</p>
                                <p class="text-white font-medium">${photo.createdAt ? new Date(photo.createdAt.toDate ? photo.createdAt.toDate() : photo.createdAt).toLocaleDateString() : 'Unknown'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Status Badge -->
                    ${photo.status ? `
                        <div class="flex items-center justify-center">
                            <span class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                                photo.status === 'approved' ? 'bg-green-100 text-green-800' :
                                photo.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }">
                                <span class="w-2 h-2 rounded-full mr-2 ${
                                    photo.status === 'approved' ? 'bg-green-400' :
                                    photo.status === 'pending' ? 'bg-yellow-400' :
                                    'bg-red-400'
                                }"></span>
                                ${photo.status.charAt(0).toUpperCase() + photo.status.slice(1)}
                            </span>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
        
        <!-- Modal Footer -->
        <div class="p-6 border-t border-[#B3CFE5]/20 flex justify-between items-center">
            <div class="flex items-center space-x-4">
                <button onclick="downloadPhoto('${photo.fullSizeUrl || photo.imageUrl}', '${photo.caption || 'giki-photo'}')" class="flex items-center space-x-2 px-4 py-2 bg-[#4A7FA7]/20 text-[#B3CFE5] rounded-full hover:bg-[#4A7FA7]/40 transition-colors duration-300">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span>Download</span>
                </button>
                <button onclick="sharePhoto('${photo.fullSizeUrl || photo.imageUrl}', '${photo.caption || 'Check out this photo from GIKI!'}')" class="flex items-center space-x-2 px-4 py-2 bg-[#4A7FA7]/20 text-[#B3CFE5] rounded-full hover:bg-[#4A7FA7]/40 transition-colors duration-300">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                    </svg>
                    <span>Share</span>
                </button>
            </div>
            <div class="text-[#B3CFE5]/80 text-sm">
                Click outside or press Esc to close
            </div>
        </div>
    `;
    
    // Show modal
    modal.classList.remove('hidden');
}

/**
 * Navigates to the next or previous photo in the modal.
 * @param {number} direction - 1 for next, -1 for previous.
 */
function navigatePhoto(direction) {
    const newIndex = currentPhotoIndex + direction;
    
    if (newIndex >= 0 && newIndex < currentPhotos.length) {
        currentPhotoIndex = newIndex;
        displayPhotoModal();
    }
}

/**
 * Closes the photo modal.
 */
function closePhotoModal() {
    const modal = document.getElementById('photo-view-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    isPhotoModalOpen = false;
    document.body.style.overflow = ''; // Restore scrolling
    
    // Clear current photos
    currentPhotos = [];
    currentPhotoIndex = 0;
}

/**
 * Renders photos in the gallery grid with click handlers for modal viewing.
 * @param {Array} photos - Array of photos to render.
 * @param {string} containerId - ID of the container to render photos in.
 * @param {boolean} showAdminControls - Whether to show admin controls.
 */
function renderGalleryPhotos(photos, containerId = 'gallery-grid', showAdminControls = false) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
    }
    
    container.innerHTML = '';
    
    if (photos.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-gray-500">
                    <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <h3 class="text-xl font-semibold mb-2">No photos found</h3>
                    <p class="text-gray-600">No photos match your current filters.</p>
                </div>
            </div>
        `;
        return;
    }
    
    photos.forEach((photo, index) => {
        const photoCard = document.createElement('div');
        photoCard.className = 'bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300';
        
        const photoDate = photo.createdAt ? new Date(photo.createdAt.toDate ? photo.createdAt.toDate() : photo.createdAt).toLocaleDateString() : 'N/A';
        const categoryBadge = photo.category ? `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full whitespace-nowrap overflow-hidden text-ellipsis max-w-20">${photo.category}</span>` : '';
        const highlightedBadge = photo.isHighlighted ? `<span class="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">⭐ Featured</span>` : '';
        
        photoCard.innerHTML = `
            <div class="cursor-pointer" onclick="openPhotoModal('${photo.id}', ${JSON.stringify(photos).replace(/"/g, '&quot;')}, ${index})">
                <img class="h-48 w-full object-cover hover:scale-105 transition-transform duration-300" 
                     src="${photo.imageUrl}" 
                     alt="${photo.caption || 'Gallery Photo'}">
            </div>
            <div class="p-6">
                <div class="flex items-center justify-between mb-2">
                    <p class="text-sm text-gray-500">
                        ${photoDate} • by <span class="text-blue-600 font-medium">${photo.uploaderName || 'Unknown'}</span>
                    </p>
                    <div class="flex gap-1 flex-shrink-0">
                        ${highlightedBadge}
                        ${categoryBadge}
                    </div>
                </div>
                <h4 class="text-lg font-semibold mb-3 text-gray-800">${photo.caption || 'Untitled'}</h4>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600">Click to view full size</span>
                    ${showAdminControls ? `
                        <div class="flex space-x-2">
                            <button onclick="event.stopPropagation(); reviewPhoto('${photo.id}')" 
                                    class="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors">
                                Review
                            </button>
                            <button onclick="event.stopPropagation(); deletePhoto('${photo.id}', '${photo.cloudinaryId}')" 
                                    class="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-full hover:bg-red-200 transition-colors">
                                Delete
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        container.appendChild(photoCard);
    });
}

/**
 * Toggles the highlighted status of a photo.
 * @param {string} photoId - The ID of the photo to toggle.
 * @param {boolean} isHighlighted - The new highlighted status.
 * @returns {Promise<object>}
 */
async function togglePhotoHighlight(photoId, isHighlighted) {
    try {
        await db.collection("galleryPhotos").doc(photoId).update({
            isHighlighted: isHighlighted
        });
        return { success: true };
    } catch (error) {
        console.error("Error toggling photo highlight:", error);
        return { success: false, error: "Could not update photo status." };
    }
}

/**
 * Saves a new photo for review by an administrator.
 * @param {string} caption - The photo caption.
 * @param {string} category - The photo category.
 * @param {File} file - The image file to upload.
 * @returns {Promise<object>}
 */
async function submitPhotoForReview(caption, category, file) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: "You must be logged in to submit a photo." };

    try {
        // --- Cloudinary Upload Logic ---
        const cloudName = "dfkpmldma";
        const uploadPreset = "giki-chronicles";
        const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        const response = await fetch(url, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            let detail = '';
            try { detail = await response.text(); } catch (_) {}
            throw new Error(`Image upload failed${detail ? `: ${detail}` : ''}`);
        }

        const data = await response.json();
        if (!data.secure_url) {
            throw new Error(`Upload response missing URL${data.error?.message ? `: ${data.error.message}` : ''}`);
        }
        const imageUrl = data.secure_url;
        const cloudinaryId = data.public_id;
        const fullSizeUrl = imageUrl; // Use original as full-size; add eager if preset supports it

        // --- Save to Firestore Gallery (Pending Review) ---
        await db.collection("galleryPhotos").add({
            imageUrl, // Thumbnail URL
            fullSizeUrl, // Full size URL
            caption,
            category,
            uploaderId: user.uid,
            uploaderName: user.displayName || user.email,
            cloudinaryId,
            isHighlighted: false, // Admin can change on approval
            status: "pending",
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        return { success: true, message: "Photo submitted for review!" };

    } catch (error) {
        console.error("Error submitting photo:", error);
        return { success: false, error: "Failed to submit photo." };
    }
} 

// --- Admin Functions for Gallery Management ---

/**
 * Fetches photos by status for admin review with pagination.
 * @param {string} status - "pending", "approved", "rejected"
 * @param {number} page - Page number (0-based)
 * @param {number} limit - Number of photos per page
 * @returns {Promise<object>}
 */
async function getGalleryPhotosByStatus(status, page = 0, limit = 12) {
    try {
        let query = db.collection("galleryPhotos")
            .where("status", "==", status)
            .orderBy("createdAt", "desc");
        
        // Apply pagination
        if (page > 0) {
            // For pagination, we need to get the last document from the previous page
            const prevPageQuery = db.collection("galleryPhotos")
                .where("status", "==", status)
                .orderBy("createdAt", "desc")
                .limit(page * limit);
            
            const prevPageSnapshot = await prevPageQuery.get();
            const lastDoc = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
            
            if (lastDoc) {
                query = query.startAfter(lastDoc);
            }
        }
        
        const snapshot = await query.limit(limit).get();
        const photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { success: true, photos };
    } catch (error) {
        console.error(`Error fetching ${status} gallery photos:`, error);
        return { success: false, error: `Could not load ${status} photos.` };
    }
}

/**
 * Updates the status of a gallery photo (approve/reject).
 * @param {string} photoId - The ID of the photo to update.
 * @param {string} newStatus - The new status ("approved", "rejected").
 * @param {object} options - Additional options like rejection reason, highlight status.
 * @returns {Promise<object>}
 */
async function updateGalleryPhotoStatus(photoId, newStatus, options = {}) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: "Authentication required." };

    try {
        const updateData = { 
            status: newStatus,
            reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
            reviewedBy: user.uid
        };
        
        if (typeof options.isHighlighted === 'boolean') {
            updateData.isHighlighted = options.isHighlighted;
        }
        
        if (newStatus === "rejected" && options.rejectionReason) {
            updateData.rejectionReason = options.rejectionReason;
        }

        await db.collection("galleryPhotos").doc(photoId).update(updateData);
        return { success: true };
    } catch (error) {
        console.error("Error updating gallery photo status:", error);
        return { success: false, error: "Could not update status." };
    }
}

/**
 * Deletes a photo from both Firestore and Cloudinary.
 * @param {string} photoId - The ID of the photo to delete.
 * @param {string} cloudinaryId - The Cloudinary public ID.
 * @returns {Promise<object>}
 */
async function deleteGalleryPhoto(photoId, cloudinaryId) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: "Authentication required." };

    try {
        // First, delete from Cloudinary
        if (cloudinaryId) {
            const cloudName = "dfkpmldma";
            const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;
            
            const formData = new FormData();
            formData.append("public_id", cloudinaryId);
            
            const response = await fetch(url, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                console.warn("Failed to delete from Cloudinary, but continuing with Firestore deletion");
            }
        }

        // Then delete from Firestore
        await db.collection("galleryPhotos").doc(photoId).delete();
        
        return { success: true, message: "Photo deleted successfully." };
    } catch (error) {
        console.error("Error deleting gallery photo:", error);
        return { success: false, error: "Could not delete photo." };
    }
}

/**
 * Gets photo statistics for admin dashboard.
 * @returns {Promise<object>}
 */
async function getGalleryStats() {
    try {
        const [approved, pending, rejected] = await Promise.all([
            db.collection("galleryPhotos").where("status", "==", "approved").get(),
            db.collection("galleryPhotos").where("status", "==", "pending").get(),
            db.collection("galleryPhotos").where("status", "==", "rejected").get()
        ]);

        return {
            success: true,
            stats: {
                approved: approved.size,
                pending: pending.size,
                rejected: rejected.size,
                total: approved.size + pending.size + rejected.size
            }
        };
    } catch (error) {
        console.error("Error fetching gallery stats:", error);
        return { success: false, error: "Could not load statistics." };
    }
}

// Legacy function for backward compatibility
async function getPendingGalleryPhotos() {
    return getGalleryPhotosByStatus("pending");
}

// Helper functions for photo modal
function downloadPhoto(imageUrl, filename) {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename || 'giki-photo';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function sharePhoto(imageUrl, text) {
    if (navigator.share) {
        navigator.share({
            title: 'GIKI Photo',
            text: text,
            url: imageUrl
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(`${text}\n${imageUrl}`).then(() => {
            alert('Photo link copied to clipboard!');
        }).catch(() => {
            // Final fallback: show alert
            alert(`Photo link: ${imageUrl}`);
        });
    }
}

// Keyboard navigation for photo modal
document.addEventListener('keydown', (e) => {
    if (!isPhotoModalOpen) return;
    
    switch (e.key) {
        case 'Escape':
            closePhotoModal();
            break;
        case 'ArrowLeft':
            navigatePhoto(-1);
            break;
        case 'ArrowRight':
            navigatePhoto(1);
            break;
    }
});

// Click outside modal to close
document.addEventListener('click', (e) => {
    if (isPhotoModalOpen && e.target.id === 'photo-view-modal') {
        closePhotoModal();
    }
});