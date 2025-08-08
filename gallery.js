/**
 * gallery.js
 * Handles all Firestore interactions for the photo gallery.
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
        // NOTE: Keep minimal parameters for maximum compatibility with unsigned presets
        // If you want eager transformations, whitelist them in your unsigned preset
        // and then uncomment the next line:
        // formData.append("eager", "c_fill,w_1200,h_800,q_auto,f_auto");

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