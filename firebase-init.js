/**
 * firebase-init.js
 * This file initializes the Firebase application. It should be the first
 * Firebase-related script loaded on any page.
 */

// TODO: Replace the following with your app's Firebase project configuration
// from the Firebase console.
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
    .then(() => {
        console.log("Authentication persistence set to LOCAL");
    })
    .catch((error) => {
        console.error("Error setting auth persistence:", error);
    });

// Function to handle user data synchronization
const syncUserData = async (user) => {
    if (!user || !user.uid || !user.email) {
        console.log("Incomplete user data, cannot sync");
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
        console.log("User info stored in localStorage:", userInfo);
        
        // Ensure user document exists in Firestore with correct data
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists && !userDocumentCreated) {
            console.log("Creating new user document with actual user data");
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
            console.log("User document created successfully");
        } else if (userDoc.exists) {
            // Update existing document with current user data (but preserve admin status)
            const existingData = userDoc.data();
            console.log("Updating existing user document, preserving admin status:", existingData.isAdmin);
            await db.collection('users').doc(user.uid).update({
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'User',
                photoURL: user.photoURL || '',
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("User document updated with current data");
        } else {
            console.log("User document already created in this session, skipping...");
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
    console.log("=== AUTH STATE CHANGED ===");
    console.log("User object:", user);
    console.log("Current auth state:", user ? "SIGNED IN" : "SIGNED OUT");
    console.log("Auth state initialized:", authStateInitialized);
    
    if (user) {
        console.log("User is signed in:", user.email);
        console.log("User UID:", user.uid);
        console.log("User displayName:", user.displayName);
        console.log("User photoURL:", user.photoURL);
        
        // Validate that we have proper user data before proceeding
        if (!user.uid || !user.email) {
            console.log("Incomplete user data, waiting for full authentication...");
            return;
        }
        
        // Sync user data
        const syncSuccess = await syncUserData(user);
        if (syncSuccess) {
            console.log("User data synchronized successfully");
        }
        
    } else {
        console.log("User is signed out");
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
        console.log("No current user, cannot ensure data loaded");
        return false;
    }
    
    // Check if we have user data in localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
        console.log("No stored user data, syncing...");
        return await syncUserData(currentUser);
    }
    
    try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.uid !== currentUser.uid) {
            console.log("Stored user UID doesn't match current user, syncing...");
            return await syncUserData(currentUser);
        }
        
        console.log("User data already loaded and synchronized");
        return true;
    } catch (error) {
        console.error("Error parsing stored user data:", error);
        return await syncUserData(currentUser);
    }
};

// Make the function globally available
window.ensureUserDataLoaded = ensureUserDataLoaded;

// Debug function to check current authentication state
window.checkAuthState = function() {
    const currentUser = auth.currentUser;
    console.log("=== CURRENT AUTH STATE ===");
    console.log("Current user:", currentUser);
    console.log("Is signed in:", !!currentUser);
    console.log("Auth state initialized:", authStateInitialized);
    if (currentUser) {
        console.log("User email:", currentUser.email);
        console.log("User UID:", currentUser.uid);
        console.log("User displayName:", currentUser.displayName);
    }
    
    // Check localStorage
    const storedUser = localStorage.getItem('currentUser');
    console.log("Stored user in localStorage:", storedUser ? JSON.parse(storedUser) : null);
    
    return currentUser;
};

// Debug function to force re-authentication check
window.forceAuthCheck = function() {
    console.log("Forcing authentication state check...");
    auth.onAuthStateChanged((user) => {
        console.log("Auth state check result:", user);
    });
};

// Debug function to manually sync user data
window.syncUserDataNow = function() {
    const currentUser = auth.currentUser;
    if (currentUser) {
        return syncUserData(currentUser);
    } else {
        console.log("No current user to sync");
        return Promise.resolve(false);
    }
};
