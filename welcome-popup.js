// Welcome Popup for GIKI Chronicles
class WelcomePopup {
    constructor() {
        this.init();
    }

    init() {
        // Check if user has seen the welcome popup before
        const hasSeenWelcome = localStorage.getItem('welcome-popup-shown');
        const hasCompletedTour = localStorage.getItem('tour-completed');
        
        // Show welcome popup for new users who haven't seen it
        if (!hasSeenWelcome) {
            // Small delay to ensure page is fully loaded
            setTimeout(() => {
                this.showWelcomePopup();
            }, 1000);
        }
    }

    showWelcomePopup() {
        // Create welcome popup
        const popup = document.createElement('div');
        popup.id = 'welcome-popup';
        popup.className = 'fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4';
        popup.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full transform transition-all duration-300 scale-95 opacity-0">
                <div class="p-6">
                    <div class="flex items-center mb-4">
                        <div class="flex-shrink-0">
                            <img src="logo.png" alt="GIKI Chronicles" class="h-12 w-auto">
                        </div>
                        <div class="ml-4">
                            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Welcome to GIKI Chronicles! 👋</h2>
                            <p class="text-sm text-gray-600 dark:text-gray-300">Your campus community blog</p>
                        </div>
                    </div>
                    
                    <p class="text-gray-700 dark:text-gray-300 mb-6">
                        Welcome to GIKI Chronicles! We're excited to have you here. 
                        Would you like to take a quick tour to learn about all the features?
                    </p>
                    
                    <div class="flex space-x-3">
                        <button id="welcome-start-tour" 
                                class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                            Take a Quick Tour
                        </button>
                        <button id="welcome-skip-tour" 
                                class="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200">
                            Skip for Now
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Animate popup in
        setTimeout(() => {
            const popupContent = popup.querySelector('.bg-white, .dark\\:bg-gray-800');
            popupContent.classList.remove('scale-95', 'opacity-0');
            popupContent.classList.add('scale-100', 'opacity-100');
        }, 100);
        
        // Bind events
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                this.closePopup();
            }
        });
        
        document.getElementById('welcome-start-tour').addEventListener('click', () => {
            this.closePopup();
            // Start the tour
            if (window.websiteTour) {
                window.websiteTour.startTour();
            }
        });
        
        document.getElementById('welcome-skip-tour').addEventListener('click', () => {
            this.closePopup();
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('welcome-popup')) {
                this.closePopup();
            }
        });
    }

    closePopup() {
        const popup = document.getElementById('welcome-popup');
        if (popup) {
            const popupContent = popup.querySelector('.bg-white, .dark\\:bg-gray-800');
            popupContent.classList.add('scale-95', 'opacity-0');
            popupContent.classList.remove('scale-100', 'opacity-100');
            
            setTimeout(() => {
                if (document.body.contains(popup)) {
                    document.body.removeChild(popup);
                }
            }, 300);
        }
        
        // Mark welcome popup as shown
        localStorage.setItem('welcome-popup-shown', 'true');
    }
}

// Initialize welcome popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.welcomePopup = new WelcomePopup();
    
    // Add manual trigger function for testing
    window.showWelcomePopup = () => {
        if (window.welcomePopup) {
            window.welcomePopup.showWelcomePopup();
        }
    };
    
    // Add reset function for testing
    window.resetWelcomePopup = () => {
        localStorage.removeItem('welcome-popup-shown');
        localStorage.removeItem('tour-completed');
        localStorage.removeItem('tour-started');
        console.log('Welcome popup state reset. Refresh page to see it again.');
    };
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WelcomePopup;
}
