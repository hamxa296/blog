/**
 * auth.js
 * This file contains the core Firebase authentication functions.
 * It interacts with the Firebase Authentication service to handle
 * user sign-up, login, logout, and state checking.
 * * NOTE: For Google Sign-In to work, you must enable it as a sign-in
 * method in your Firebase project's Authentication settings.
 */

/**
 * Signs up a new user using their email and password.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's chosen password.
 * @returns {Promise<object>} A promise that resolves with the user object on success, or an error object on failure.
 */
async function signUpUser(email, password) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        // You can also create a user document in Firestore here if needed
        // For example: await db.collection('users').doc(userCredential.user.uid).set({ email: email, createdAt: new Date() });
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error("Sign-up Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Signs in or signs up a user using their Google account via a pop-up.
 * @returns {Promise<object>} A promise that resolves with the user object on success, or an error object on failure.
 */
async function signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);

        // The signed-in user info.
        const user = result.user;

        // You can also create or update a user document in Firestore here
        // For example: await db.collection('users').doc(user.uid).set({ email: user.email, name: user.displayName, createdAt: new Date() }, { merge: true });

        return { success: true, user: user };
    } catch (error) {
        console.error("Google Sign-in Error:", error);
        return { success: false, error: error.message };
    }
}


/**
 * Logs in an existing user with their email and password.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @returns {Promise<object>} A promise that resolves with the user object on success, or an error object on failure.
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
 * @returns {Promise<object>} A promise that resolves on successful logout.
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
 * This function uses a listener that fires whenever the auth state changes.
 * @param {function} callback - A function to call with the user object (or null if logged out).
 */
function onAuthStateChange(callback) {
    return auth.onAuthStateChanged(callback);
}
