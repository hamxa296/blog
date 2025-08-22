// Welcome Popup for GIKI Chronicles
class WelcomePopup {
    constructor() {
        this.init();
    }

    init() {
        // Check if user has seen the welcome popup before
        const hasSeenWelcome = localStorage.getItem('welcome-popup-shown');
        
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
        popup.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4';
        popup.style.cssText = `
            background: linear-gradient(135deg, rgba(10, 25, 49, 0.8), rgba(26, 61, 99, 0.8));
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        `;
        
        popup.innerHTML = `
            <div class="welcome-popup-content transform transition-all duration-300 scale-95 opacity-0" style="
                background: linear-gradient(135deg, rgba(37, 39, 38, 0.98), rgba(45, 47, 46, 0.98));
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
                border: 1px solid rgba(74, 127, 167, 0.3);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                border-radius: 16px;
                max-width: 480px;
                width: 100%;
            ">
                <div class="p-8">
                    <div class="flex items-center mb-6">
                        <div class="flex-shrink-0">
                            <img src="logo.png" alt="GIKI Chronicles" class="h-16 w-auto">
                        </div>
                        <div class="ml-5">
                            <h2 class="text-2xl font-bold text-white mb-1" style="font-family: 'Rock Salt', cursive;">Welcome to GIKI Chronicles! 👋</h2>
                            <p class="text-[#B3CFE5] text-base" style="font-family: 'Indie Flower', cursive;">Your campus community blog</p>
                        </div>
                    </div>
                    
                    <p class="text-[#E3F2FD] text-lg leading-relaxed mb-8" style="font-family: 'Indie Flower', cursive;">
                        Welcome to GIKI Chronicles! We're excited to have you here. 
                        Explore our campus community blog and discover all the features we have to offer.
                    </p>
                    
                    <div class="flex justify-center">
                        <button id="welcome-close" 
                                class="welcome-button transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#4A7FA7] focus:ring-opacity-50"
                                style="
                                    background: linear-gradient(135deg, #4A7FA7, #1A3D63);
                                    color: white;
                                    padding: 12px 32px;
                                    border-radius: 12px;
                                    font-weight: 600;
                                    font-size: 16px;
                                    box-shadow: 0 4px 15px rgba(74, 127, 167, 0.4);
                                    font-family: 'Special Elite', cursive;
                                ">
                            Get Started
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Animate popup in
        setTimeout(() => {
            const popupContent = popup.querySelector('.welcome-popup-content');
            popupContent.classList.remove('scale-95', 'opacity-0');
            popupContent.classList.add('scale-100', 'opacity-100');
        }, 100);
        
        // Bind events
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                this.closePopup();
            }
        });
        
        document.getElementById('welcome-close').addEventListener('click', () => {
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
            const popupContent = popup.querySelector('.welcome-popup-content');
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
    };
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WelcomePopup;
}
