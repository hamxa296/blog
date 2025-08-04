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