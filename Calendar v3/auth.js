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
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: user.email,
            displayName: email.split('@')[0], // Default display name is the part of the email before the @
            photoURL: '', // Default empty profile picture
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

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

        // Create or update the user document in the 'users' collection
        // { merge: true } prevents overwriting existing fields if the user already has a profile
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
        }, { merge: true });

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
        return { success: true, user: userCredential.user };
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
function onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
} 