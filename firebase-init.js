/**
 * firebase-init.js
 * This file initializes the Firebase application. It should be the first
 * Firebase-related script loaded on any page.
 */

// Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyC1Q9tIEHLqAKZj6IjJN8aPiQCAPYbsi7I",
    authDomain: "giki-chronicles.firebaseapp.com",
    projectId: "giki-chronicles",
    storageBucket: "giki-chronicles.firebasestorage.app",
    messagingSenderId: "80968785263",
    appId: "1:80968785263:web:666d2e69fef2ef6f5a5c9a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Make auth and firestore services available globally
const auth = firebase.auth();
const db = firebase.firestore();

// Flag to prevent duplicate user creation during the same session
let userDocumentCreated = false;
let authStateInitialized = false;

// Set authentication persistence to LOCAL (persists across browser sessions)
// This ensures the user stays logged in when switching tabs or refreshing pages
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .catch((error) => {
        console.error("Error setting auth persistence:", error);
    });

// Function to handle user data synchronization
const syncUserData = async (user) => {
    if (!user || !user.uid || !user.email) {
        return false;
    }

    try {
        // Store comprehensive user info in localStorage for cross-page access
        const userInfo = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            photoURL: user.photoURL || '',
            lastSignIn: new Date().toISOString()
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userInfo));
        
        // Ensure user document exists in Firestore with correct data
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists && !userDocumentCreated) {
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'User',
                photoURL: user.photoURL || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Only add isAdmin field for admin accounts
            if (typeof isAdminUID === 'function' && isAdminUID(user.uid)) {
                userData.isAdmin = true;
            }
            
            await db.collection('users').doc(user.uid).set(userData);
            userDocumentCreated = true; // Prevent duplicate creation
        } else if (userDoc.exists) {
            // Update existing document with current user data (but preserve admin status)
            await db.collection('users').doc(user.uid).update({
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'User',
                photoURL: user.photoURL || '',
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        return true;
    } catch (error) {
        console.error("Error syncing user data:", error);
        return false;
    }
};

// Enhanced authentication state listener with better user data handling
// Wait for Firebase Auth to be fully initialized before setting up the listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Validate that we have proper user data before proceeding
        if (!user.uid || !user.email) {
            return;
        }
        
        // Sync user data
        await syncUserData(user);
        
    } else {
        // Clear user info from localStorage
        localStorage.removeItem('currentUser');
        // Reset the flag for next session
        userDocumentCreated = false;
    }
    
    // Mark auth state as initialized
    authStateInitialized = true;
    
    // Dispatch custom event to notify other scripts
    window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { user: user, initialized: true } 
    }));
});

// Function to check if user data is properly loaded
const ensureUserDataLoaded = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        return false;
    }
    
    // Check if we have user data in localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
        return await syncUserData(currentUser);
    }
    
    try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.uid !== currentUser.uid) {
            return await syncUserData(currentUser);
        }
        
        return true;
    } catch (error) {
        console.error("Error parsing stored user data:", error);
        return await syncUserData(currentUser);
    }
};

// Make the function globally available
window.ensureUserDataLoaded = ensureUserDataLoaded;
