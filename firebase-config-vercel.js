// Firebase Configuration for Vercel Deployment
// This file will use environment variables when deployed to Vercel
// For local development, it falls back to development values

const firebaseConfigData = {
    // Use environment variables in production, fallback to development values
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyC1Q9tIEHLqAKZj6IjJN8aPiQCAPYbsi7I",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "giki-chronicles.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "giki-chronicles",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "giki-chronicles.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "80968785263",
    appId: process.env.FIREBASE_APP_ID || "1:80968785263:web:666d2e69fef2ef6f5a5c9a"
};

// Security check - warn if using development values in production
if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
    if (firebaseConfigData.apiKey === "AIzaSyC1Q9tIEHLqAKZj6IjJN8aPiQCAPYbsi7I") {
        console.warn("⚠️ SECURITY WARNING: Using development Firebase API key in production. Set environment variables in Vercel dashboard.");
    }
}

// Make it available globally
window.firebaseConfig = firebaseConfigData;

// Also support Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfigData;
}
