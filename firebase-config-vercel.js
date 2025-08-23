// Firebase Configuration for Vercel Deployment
// Safely read environment variables without referencing `process` in the browser.
function getEnv(key, fallback) {
    try {
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            return process.env[key];
        }
    } catch (e) {
        // Accessing process in some environments may throw; ignore and use fallback
    }

    // For client-side, allow a global `__env` map if you use one (optional)
    try {
        if (typeof window !== 'undefined' && window.__env && window.__env[key]) {
            return window.__env[key];
        }
    } catch (e) {}

    return fallback;
}

const firebaseConfigData = {
    apiKey: getEnv('FIREBASE_API_KEY', 'AIzaSyC1Q9tIEHLqAKZj6IjJN8aPiQCAPYbsi7I'),
    authDomain: getEnv('FIREBASE_AUTH_DOMAIN', 'giki-chronicles.firebaseapp.com'),
    projectId: getEnv('FIREBASE_PROJECT_ID', 'giki-chronicles'),
    storageBucket: getEnv('FIREBASE_STORAGE_BUCKET', 'giki-chronicles.firebasestorage.app'),
    messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID', '80968785263'),
    appId: getEnv('FIREBASE_APP_ID', '1:80968785263:web:666d2e69fef2ef6f5a5c9a')
};

// Security check - warn if using development values when server-side NODE_ENV=production is set
try {
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
        if (firebaseConfigData.apiKey === 'AIzaSyC1Q9tIEHLqAKZj6IjJN8aPiQCAPYbsi7I') {
            console.warn('⚠️ SECURITY WARNING: Using development Firebase API key in production. Set environment variables in Vercel dashboard.');
        }
    }
} catch (e) {}

// Make it available globally in browser
if (typeof window !== 'undefined') {
    window.firebaseConfig = firebaseConfigData;
}

// Also support Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfigData;
}
