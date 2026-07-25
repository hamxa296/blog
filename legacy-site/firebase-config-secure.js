// Secure Firebase Configuration - Production Ready
// 
// IMPORTANT: For production deployment:
// 1. Set these environment variables in your hosting platform (Vercel, Netlify, etc.)
// 2. NEVER commit actual API keys to version control
// 3. Use environment variables: process.env.FIREBASE_API_KEY, etc.
// 
// For development, you can temporarily use actual values
// but replace them with environment variables before production deployment

// Firebase configuration data - SECURE VERSION
const firebaseConfigData = {
    // IMPORTANT: Replace these with environment variables in production
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyC1Q9tIEHLqAKZj6IjJN8aPiQCAPYbsi7I",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "giki-chronicles.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "giki-chronicles",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "giki-chronicles.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "80968785263",
    appId: process.env.FIREBASE_APP_ID || "1:80968785263:web:666d2e69fef2ef6f5a5c9a"
};

// Security check - warn if using hardcoded values in production
if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
    if (firebaseConfigData.apiKey === "AIzaSyC1Q9tIEHLqAKZj6IjJN8aPiQCAPYbsi7I") {
        console.warn("⚠️ SECURITY WARNING: Using hardcoded Firebase API key in production. Use environment variables instead.");
    }
}

// Make it available globally
window.firebaseConfig = firebaseConfigData;

// Also support Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfigData;
}
