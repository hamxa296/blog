/**
 * users.js
 * This file contains functions for interacting with the 'users' collection
 * in Firestore and managing user profile data, including photo uploads.
 */

/**
 * Fetches a user's profile document from Firestore.
 * @param {string} userId - The UID of the user to fetch.
 * @returns {Promise<object>} A promise that resolves with the user's profile data.
 */
async function getUserProfile(userId) {
    try {
        const docRef = db.collection("users").doc(userId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            return { success: true, profile: docSnap.data() };
        } else {
            return { success: false, error: "User profile not found." };
        }
    } catch (error) {
        console.error("Error getting user profile:", error);
        return { success: false, error: "Failed to fetch user profile." };
    }
}

/**
 * Updates a user's profile data in Firestore.
 * @param {string} userId - The UID of the user to update.
 * @param {object} profileData - An object with the fields to update (e.g., { displayName, bio }).
 * @returns {Promise<object>} A promise that resolves on success.
 */
async function updateUserProfile(userId, profileData) {
    try {
        const docRef = db.collection("users").doc(userId);
        await docRef.update(profileData);
        return { success: true };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: "Failed to update profile." };
    }
}

/**
 * Uploads a profile picture to Firebase Storage and returns the download URL.
 * @param {string} userId - The UID of the user.
 * @param {File} file - The image file to upload.
 * @returns {Promise<object>} A promise that resolves with the public URL of the uploaded image.
 */
async function uploadProfilePicture(userId, file) {
    try {
        // Create a storage reference
        const storageRef = firebase.storage().ref();
        // Create a reference to 'profile_pictures/{userId}/{fileName}'
        const fileRef = storageRef.child(`profile_pictures/${userId}/${file.name}`);

        // Upload the file
        const snapshot = await fileRef.put(file);

        // Get the download URL
        const downloadURL = await snapshot.ref.getDownloadURL();

        return { success: true, url: downloadURL };
    } catch (error) {
        console.error("Error uploading photo:", error);
        return { success: false, error: "Failed to upload photo." };
    }
}


/**
 * Checks if the current user is an admin.
 * This is an alias for the isUserAdmin function from auth.js
 * @returns {Promise<boolean>}
 */
async function checkUserAdminStatus() {
    console.log("checkUserAdminStatus called");
    const result = await isUserAdmin();
    console.log("checkUserAdminStatus result:", result);
    return result;
}

// Make checkUserAdminStatus globally accessible
window.checkUserAdminStatus = checkUserAdminStatus;

/**
 * Simple admin check for testing
 * @returns {Promise<boolean>}
 */
async function testAdminStatus() {
    const user = auth.currentUser;
    if (!user) {
        console.log("No user logged in");
        return false;
    }
    
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            console.log("Test admin check - User data:", userData);
            return userData.isAdmin === true;
        }
        return false;
    } catch (error) {
        console.error("Test admin check error:", error);
        return false;
    }
}

// Make testAdminStatus globally accessible
window.testAdminStatus = testAdminStatus;