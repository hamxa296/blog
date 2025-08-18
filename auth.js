/**
 * auth.js
 * This file contains the core Firebase authentication functions.
 * It now also handles creating user profile documents in Firestore upon sign-up.
 */

/*
    FIRESTORE DATABASE STRUCTURE for the 'users' collection:

    Each document will be identified by the user's UID from Authentication.
    - uid (string): The user's unique ID.
    - email (string): The user's email address.
    - displayName (string): The user's public name (can be edited).
    - photoURL (string): The URL for the user's profile picture.
    - bio (string, optional): A short user biography.
    - isAdmin (boolean, optional): Set to true for administrators.
*/

/**
 * Signs up a new user and creates their profile in Firestore.
 */
async function signUpUser(email, password) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Create a user document in the 'users' collection
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: email.split('@')[0], // Default display name is the part of the email before the @
            photoURL: '', // Default empty profile picture
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Only add isAdmin field for admin accounts
        if (typeof isAdminUID === 'function' && isAdminUID(user.uid)) {
            userData.isAdmin = true;
        }
        
        await db.collection('users').doc(user.uid).set(userData);

        return { success: true, user: user };
    } catch (error) {
        console.error("Sign-up Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Signs in a user with Google and creates/updates their profile in Firestore.
 */
async function signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const user = result.user;

        // Check if user is blocked
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData.isBlocked) {
                    // Sign out the user immediately if they're blocked
                    await auth.signOut();
                    return { 
                        success: false, 
                        error: "Your account has been blocked. Please contact an administrator for assistance." 
                    };
                }
            }
        } catch (firestoreError) {
            console.error("Error checking user status:", firestoreError);
            // Continue with login even if Firestore fails
        }

        // Create or update the user document in the 'users' collection
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
        };
        
        // Only add isAdmin field for admin accounts
        if (typeof isAdminUID === 'function' && isAdminUID(user.uid)) {
            userData.isAdmin = true;
        }
        
        // { merge: true } prevents overwriting existing fields if the user already has a profile
        await db.collection('users').doc(user.uid).set(userData, { merge: true });

        return { success: true, user: user };
    } catch (error) {
        console.error("Google Sign-in Error:", error);
        return { success: false, error: error.message };
    }
}


/**
 * Logs in an existing user with their email and password.
 */
async function loginUser(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Check if user is blocked
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData.isBlocked) {
                    // Sign out the user immediately if they're blocked
                    await auth.signOut();
                    return { 
                        success: false, 
                        error: "Your account has been blocked. Please contact an administrator for assistance." 
                    };
                }
            }
        } catch (firestoreError) {
            console.error("Error checking user status:", firestoreError);
            // Continue with login even if Firestore fails
        }
        
        // Ensure user document exists in Firestore
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists) {
                const userData = {
                    uid: user.uid,
                    email: user.email || email,
                    displayName: user.displayName || email.split('@')[0],
                    photoURL: user.photoURL || '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // Only add isAdmin field for admin accounts
                if (typeof isAdminUID === 'function' && isAdminUID(user.uid)) {
                    userData.isAdmin = true;
                }
                
                await db.collection('users').doc(user.uid).set(userData);
            }
        } catch (firestoreError) {
            console.error("Error ensuring user document exists:", firestoreError);
            // Continue with login even if Firestore fails
        }
        
        return { success: true, user: user };
    } catch (error) {
        console.error("Login Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Logs out the currently signed-in user.
 */
async function logoutUser() {
    try {
        if (typeof auth === 'undefined') {
            throw new Error('Auth object not initialized');
        }
        await auth.signOut();
        return { success: true };
    } catch (error) {
        console.error("Logout Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Checks the current authentication state of the user.
 */
function onAuthStateChange(callback) {
    if (typeof auth === 'undefined') {
        console.warn('Auth object not yet initialized, waiting for Firebase...');
        // Wait for Firebase to be initialized
        const checkAuth = () => {
            if (typeof auth !== 'undefined') {
                return auth.onAuthStateChanged(callback);
            } else {
                setTimeout(checkAuth, 100);
            }
        };
        checkAuth();
        return () => {}; // Return empty unsubscribe function
    }
    return auth.onAuthStateChanged(callback);
}

/**
 * Checks if the current user is an admin.
 * @returns {Promise<boolean>}
 */
async function isUserAdmin() {
    const user = typeof auth !== 'undefined' ? auth.currentUser : null;
    
    if (!user) return false;
    
    try {
        // First, ensure user data is loaded
        if (typeof window.ensureUserDataLoaded === 'function') {
            await window.ensureUserDataLoaded();
        }
        
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            return false;
        }
        
        const userData = userDoc.data();
        
        // Check if user should be admin but isn't marked as such
        if (typeof isAdminUID === 'function' && isAdminUID(user.uid) && userData.isAdmin !== true) {
            try {
                await db.collection('users').doc(user.uid).update({
                    isAdmin: true
                });
                return true;
            } catch (updateError) {
                console.error("Error updating user to admin status:", updateError);
            }
        }
        
        const isAdmin = userData.isAdmin === true; // Explicitly check for true
        return isAdmin;
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}
