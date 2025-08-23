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
    // Add class for styling instead of inline CSS to comply with CSP;
    // inject styles into a nonce'd <style> tag if nonce exists.
    popup.classList.add('welcome-popup-overlay');
        
        // Create popup content safely without innerHTML
        const popupContent = document.createElement('div');
        popupContent.className = 'welcome-popup-content transform transition-all duration-300 scale-95 opacity-0';
    popupContent.classList.add('welcome-popup-content-style');
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'p-8';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'flex items-center mb-6';
        
        const logoDiv = document.createElement('div');
        logoDiv.className = 'flex-shrink-0';
        
        const logoImg = document.createElement('img');
        logoImg.src = 'logo.png';
        logoImg.alt = 'GIKI Chronicles';
        logoImg.className = 'h-16 w-auto';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'ml-5';
        
        const title = document.createElement('h2');
        title.className = 'text-2xl font-bold text-white mb-1';
        title.style.fontFamily = 'Rock Salt, cursive';
        title.textContent = 'Welcome to GIKI Chronicles! 👋';
        
        const subtitle = document.createElement('p');
        subtitle.className = 'text-[#B3CFE5] text-base';
        subtitle.style.fontFamily = 'Indie Flower, cursive';
        subtitle.textContent = 'Your campus community blog';
        
        const description = document.createElement('p');
        description.className = 'text-[#E3F2FD] text-lg leading-relaxed mb-8';
        description.style.fontFamily = 'Indie Flower, cursive';
        description.textContent = 'Welcome to GIKI Chronicles! We\'re excited to have you here. Explore our campus community blog and discover all the features we have to offer.';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex justify-center';
        
        const closeButton = document.createElement('button');
        closeButton.id = 'welcome-close';
        closeButton.className = 'welcome-button transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#4A7FA7] focus:ring-opacity-50';
    closeButton.classList.add('welcome-popup-close-btn');
        closeButton.textContent = 'Get Started';
        
        // Assemble the DOM structure
        logoDiv.appendChild(logoImg);
        textDiv.appendChild(title);
        textDiv.appendChild(subtitle);
        headerDiv.appendChild(logoDiv);
        headerDiv.appendChild(textDiv);
        buttonContainer.appendChild(closeButton);
        
        contentDiv.appendChild(headerDiv);
        contentDiv.appendChild(description);
        contentDiv.appendChild(buttonContainer);
        
        popupContent.appendChild(contentDiv);
        popup.appendChild(popupContent);
        
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
