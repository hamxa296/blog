// Secure Firebase Configuration
// 
// IMPORTANT: Replace "YOUR_API_KEY_HERE" with your actual Firebase API key
// This file should be configured with proper environment variables in production
// 
// For production deployment:
// 1. Set environment variables in your hosting platform, OR
// 2. Replace the placeholder values below with your actual Firebase config

// Production: Use environment variables or replace with actual values
// Development: Use placeholder values (replace with actual values)
const firebaseConfigData = {
    apiKey: "AIzaSyC1Q9tIEHLqAKZj6IjJN8aPiQCAPYbsi7I", // Replace with your actual API key
    authDomain: "giki-chronicles.firebaseapp.com",
    projectId: "giki-chronicles",
    storageBucket: "giki-chronicles.firebasestorage.app",
    messagingSenderId: "80968785263",
    appId: "1:80968785263:web:666d2e69fef2ef6f5a5c9a"
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfigData;
} else {
    window.firebaseConfig = firebaseConfigData;
}
