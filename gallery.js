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
    - createdAt (timestamp): When the photo was submitted.
*/

/**
 * Fetches all photos from the gallery.
 * @returns {Promise<object>}
 */
async function getGalleryPhotos() {
    try {
        const snapshot = await db.collection("galleryPhotos").orderBy("createdAt", "desc").get();
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
        const snapshot = await db.collection("galleryPhotos")
            .where("isHighlighted", "==", true)
            .orderBy("createdAt", "desc")
            .get();
        const photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
 * Saves a new photo directly to the gallery.
 * @param {string} caption - The photo caption.
 * @param {string} category - The photo category.
 * @param {File} file - The image file to upload.
 * @returns {Promise<object>}
 */
async function submitPhotoForReview(caption, category, file) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: "You must be logged in to submit a photo." };

    try {
        // --- Cloudinary Upload Logic with Transformations ---
        const cloudName = "dfkpmldma";
        const uploadPreset = "giki-chronicles";
        const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);
        
        // Add transformations for multiple sizes
        formData.append("transformation", "w_400,h_300,c_fill,q_auto,f_auto"); // Thumbnail
        formData.append("eager", "w_1200,h_800,c_fill,q_auto,f_auto"); // Full size

        const response = await fetch(url, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error("Image upload failed.");
        }

        const data = await response.json();
        const imageUrl = data.secure_url;
        const cloudinaryId = data.public_id;
        
        // Get the eager (full size) URL
        const fullSizeUrl = data.eager && data.eager.length > 0 ? data.eager[0].secure_url : imageUrl;

        // --- Save to Firestore Gallery ---
        await db.collection("galleryPhotos").add({
            imageUrl, // Thumbnail URL
            fullSizeUrl, // Full size URL
            caption,
            category,
            uploaderId: user.uid,
            uploaderName: user.displayName || user.email,
            cloudinaryId,
            isHighlighted: false, // Default to not highlighted
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        return { success: true, message: "Photo added to gallery!" };

    } catch (error) {
        console.error("Error submitting photo:", error);
        return { success: false, error: "Failed to submit photo." };
    }
} 