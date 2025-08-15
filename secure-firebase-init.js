/**
 * secure-firebase-init.js
 * Secure Firebase initialization with environment-based configuration
 * This replaces the original firebase-init.js with enhanced security
 */

// Wait for production security module to load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Wait for ProductionSecurity to be available
        let attempts = 0;
        const maxAttempts = 10;
        
        while (!window.ProductionSecurity && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.ProductionSecurity) {
            // Initialize Firebase securely
            await initializeSecureFirebase();
        } else {
            // Fallback to basic initialization
            console.warn('ProductionSecurity not available, using fallback initialization');
            initializeDevelopmentFirebase();
        }
    } catch (error) {
        console.error('Secure Firebase initialization failed:', error);
        // Fallback to basic initialization for development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.warn('Using development fallback Firebase initialization');
            initializeDevelopmentFirebase();
        } else {
            console.error('Firebase initialization failed in production');
            // Still try to initialize with fallback
            initializeDevelopmentFirebase();
        }
    }
});

// Secure Firebase initialization
async function initializeSecureFirebase() {
    // Wait for production security module
    if (!window.ProductionSecurity) {
        console.warn('Production security module not loaded, using fallback');
        initializeDevelopmentFirebase();
        return;
    }
    
    const { secureConfigLoader, productionLogger } = window.ProductionSecurity;
    
    try {
        // Load secure configuration
        const firebaseConfig = await secureConfigLoader.loadConfig();
        
        // Validate configuration
        if (!firebaseConfig || !firebaseConfig.apiKey) {
            throw new Error('Invalid Firebase configuration');
        }
        
        // Initialize Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            productionLogger.info('Firebase initialized successfully with secure configuration');
        }
        
        // Initialize services
        const auth = firebase.auth();
        const db = firebase.firestore();
        
        // Set authentication persistence
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        
        // Make services available globally
        window.auth = auth;
        window.db = db;
        
        // Initialize user data synchronization
        initializeSecureUserSync();
        
        productionLogger.info('Secure Firebase initialization completed');
        
    } catch (error) {
        productionLogger.error('Secure Firebase initialization error:', error);
        throw error;
    }
}

// Development fallback initialization
function initializeDevelopmentFirebase() {
    const firebaseConfig = {
        apiKey: "AIzaSyC1Q9tIEHLqAKZj6IjJN8aPiQCAPYbsi7I",
        authDomain: "giki-chronicles.firebaseapp.com",
        projectId: "giki-chronicles",
        storageBucket: "giki-chronicles.firebasestorage.app",
        messagingSenderId: "80968785263",
        appId: "1:80968785263:web:666d2e69fef2ef6f5a5c9a"
    };
    
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    window.auth = auth;
    window.db = db;
    
    console.log('Development Firebase initialized');
}

// Secure user data synchronization
function initializeSecureUserSync() {
    // Check if ProductionSecurity is available
    if (!window.ProductionSecurity) {
        console.warn('ProductionSecurity not available for user sync, using basic sync');
        initializeBasicUserSync();
        return;
    }
    
    const { productionLogger, secureAdminValidator } = window.ProductionSecurity;
    
    // Flag to prevent duplicate user creation
    let userDocumentCreated = false;
    
    // Handle user data synchronization
    const syncUserData = async (user) => {
        if (!user || !user.uid || !user.email) {
            return false;
        }
        
        try {
            // Store minimal user info securely
            const userInfo = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'User',
                photoURL: user.photoURL || '',
                lastSignIn: new Date().toISOString()
            };
            
            // Use sessionStorage for temporary data
            sessionStorage.setItem('currentUser', JSON.stringify(userInfo));
            
            // Ensure user document exists in Firestore
            const userDoc = await window.db.collection('users').doc(user.uid).get();
            
            if (!userDoc.exists && !userDocumentCreated) {
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email?.split('@')[0] || 'User',
                    photoURL: user.photoURL || '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // Check admin status securely
                const isAdmin = await secureAdminValidator.validateAdminStatus(user.uid);
                if (isAdmin) {
                    userData.isAdmin = true;
                }
                
                await window.db.collection('users').doc(user.uid).set(userData);
                userDocumentCreated = true;
                
                productionLogger.info('User document created:', { uid: user.uid, isAdmin });
            }
            
            return true;
        } catch (error) {
            productionLogger.error('Error syncing user data:', error);
            return false;
        }
    };
    
    // Handle user logout
    const handleUserLogout = () => {
        try {
            // Clear session storage
            sessionStorage.removeItem('currentUser');
            userDocumentCreated = false;
            
            productionLogger.info('User logged out successfully');
        } catch (error) {
            productionLogger.error('Error during logout:', error);
        }
    };
    
    // Set up auth state listener
    window.auth.onAuthStateChanged(async (user) => {
        if (user) {
            await syncUserData(user);
        } else {
            handleUserLogout();
        }
    });
    
    // Check for existing user data
    const checkExistingUserData = () => {
        try {
            const storedUser = sessionStorage.getItem('currentUser');
            if (storedUser) {
                const userInfo = JSON.parse(storedUser);
                productionLogger.debug('Found existing user data:', { uid: userInfo.uid });
            }
        } catch (error) {
            productionLogger.error('Error parsing stored user data:', error);
            sessionStorage.removeItem('currentUser');
        }
    };
    
    // Initialize existing user data check
    checkExistingUserData();
}

// Basic user data synchronization (fallback)
function initializeBasicUserSync() {
    // Flag to prevent duplicate user creation
    let userDocumentCreated = false;
    
    // Handle user data synchronization
    const syncUserData = async (user) => {
        if (!user || !user.uid || !user.email) {
            return false;
        }
        
        try {
            // Store minimal user info
            const userInfo = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'User',
                photoURL: user.photoURL || '',
                lastSignIn: new Date().toISOString()
            };
            
            // Use sessionStorage for temporary data
            sessionStorage.setItem('currentUser', JSON.stringify(userInfo));
            
            // Ensure user document exists in Firestore
            const userDoc = await window.db.collection('users').doc(user.uid).get();
            
            if (!userDoc.exists && !userDocumentCreated) {
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email?.split('@')[0] || 'User',
                    photoURL: user.photoURL || '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                await window.db.collection('users').doc(user.uid).set(userData);
                userDocumentCreated = true;
                
                console.log('User document created:', { uid: user.uid });
            }
            
            return true;
        } catch (error) {
            console.error('Error syncing user data:', error);
            return false;
        }
    };
    
    // Handle user logout
    const handleUserLogout = () => {
        try {
            // Clear session storage
            sessionStorage.removeItem('currentUser');
            userDocumentCreated = false;
            
            console.log('User logged out successfully');
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };
    
    // Set up auth state listener
    window.auth.onAuthStateChanged(async (user) => {
        if (user) {
            await syncUserData(user);
        } else {
            handleUserLogout();
        }
    });
    
    // Check for existing user data
    const checkExistingUserData = () => {
        try {
            const storedUser = sessionStorage.getItem('currentUser');
            if (storedUser) {
                const userInfo = JSON.parse(storedUser);
                console.log('Found existing user data:', { uid: userInfo.uid });
            }
        } catch (error) {
            console.error('Error parsing stored user data:', error);
            sessionStorage.removeItem('currentUser');
        }
    };
    
    // Initialize existing user data check
    checkExistingUserData();
}

// Export secure initialization function
window.initializeSecureFirebase = initializeSecureFirebase;
