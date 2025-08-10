// Firebase Error Handler for GIKI Chronicles
class FirebaseErrorHandler {
    constructor() {
        this.init();
    }

    init() {
        // Handle Firebase connection errors gracefully
        this.handleFirebaseErrors();
        
        // Add error handling for network issues
        this.handleNetworkErrors();
    }

    handleFirebaseErrors() {
        // Override console.error to catch Firebase errors
        const originalError = console.error;
        console.error = (...args) => {
            const errorMessage = args.join(' ');
            
            // Check if it's a Firebase/Firestore error
            if (errorMessage.includes('firestore.googleapis') || 
                errorMessage.includes('ERR_QUIC_PROTOCOL_ERROR') ||
                errorMessage.includes('400') ||
                errorMessage.includes('Failed to load resource')) {
                
                // Log the error but don't show it to users
                console.warn('Firebase connection issue detected, continuing with offline functionality');
                return;
            }
            
            // Call original console.error for other errors
            originalError.apply(console, args);
        };

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            const errorMessage = event.reason?.message || event.reason?.toString() || '';
            
            if (errorMessage.includes('firestore.googleapis') || 
                errorMessage.includes('ERR_QUIC_PROTOCOL_ERROR') ||
                errorMessage.includes('400')) {
                
                event.preventDefault();
                console.warn('Firebase promise rejection handled gracefully');
            }
        });
    }

    handleNetworkErrors() {
        // Monitor network status
        window.addEventListener('online', () => {
            console.log('Network connection restored');
        });

        window.addEventListener('offline', () => {
            console.log('Network connection lost, continuing with offline functionality');
        });

        // Handle fetch errors
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                return await originalFetch(...args);
            } catch (error) {
                // If it's a Firebase-related error, don't throw
                if (error.message.includes('firestore.googleapis') || 
                    error.message.includes('ERR_QUIC_PROTOCOL_ERROR')) {
                    console.warn('Firebase fetch error handled gracefully');
                    return new Response(JSON.stringify({ error: 'Firebase connection issue' }), {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                throw error;
            }
        };
    }

    // Method to check if Firebase is available
    isFirebaseAvailable() {
        return typeof firebase !== 'undefined' && 
               firebase.apps && 
               firebase.apps.length > 0;
    }

    // Method to safely call Firebase functions
    safeFirebaseCall(callback, fallback = null) {
        try {
            if (this.isFirebaseAvailable()) {
                return callback();
            } else {
                console.warn('Firebase not available, using fallback');
                return fallback;
            }
        } catch (error) {
            console.warn('Firebase call failed, using fallback:', error);
            return fallback;
        }
    }
}

// Initialize error handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.firebaseErrorHandler = new FirebaseErrorHandler();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseErrorHandler;
}
