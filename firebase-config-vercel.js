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

// When built on Vercel, a generated `firebase-config-vercel.js` will be created
// from environment variables. For local development, set window.__env or
// use a local `firebase-config.js` file.
const firebaseConfigData = {
    apiKey: getEnv('FIREBASE_API_KEY', ''),
    authDomain: getEnv('FIREBASE_AUTH_DOMAIN', ''),
    projectId: getEnv('FIREBASE_PROJECT_ID', ''),
    storageBucket: getEnv('FIREBASE_STORAGE_BUCKET', ''),
    messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID', ''),
    appId: getEnv('FIREBASE_APP_ID', '')
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
