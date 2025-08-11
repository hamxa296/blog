// Tour Manager for GIKI Chronicles
class WebsiteTour {
    constructor() {
        this.currentStep = 0;
        this.isActive = false;
        this.isMobile = window.innerWidth < 768; // Check if mobile device
        
        // Desktop tour steps
        this.desktopTourSteps = [
            {
                id: 'welcome',
                title: 'Welcome to GIKI Chronicles! 👋',
                content: 'Let\'s take a quick tour to help you navigate our blog. Click "Next" to continue.',
                target: null,
                position: 'center'
            },
            {
                id: 'navbar',
                title: 'Navigation Bar',
                content: 'This is your main navigation hub. You can access all major sections from here.',
                target: 'header',
                position: 'bottom'
            },
            {
                id: 'logo',
                title: 'GIKI Chronicles Logo',
                content: 'Click the logo anytime to return to the home page.',
                target: 'header a[href="index.html"]',
                position: 'bottom'
            },
            {
                id: 'gallery-btn',
                title: 'Gallery',
                content: 'Explore our photo gallery showcasing campus life, events, and memories.',
                target: 'a[href="gallery.html"]',
                position: 'bottom'
            },
            {
                id: 'guide-btn',
                title: 'Freshmen Guide',
                content: 'Essential information for new students - everything you need to know about GIKI!',
                target: 'a[href="guide.html"]',
                position: 'bottom'
            },
            {
                id: 'calendar-btn',
                title: 'Calendar',
                content: 'Stay updated with campus events, deadlines, and important dates.',
                target: 'a[href="calendar.html"]',
                position: 'bottom'
            },
            {
                id: 'login-btn',
                title: 'Login',
                content: 'Sign in to access your profile, write posts, and interact with the community.',
                target: 'a[href="login.html"]',
                position: 'bottom'
            },
            {
                id: 'sidebar',
                title: 'Sidebar Menu',
                content: 'The sidebar contains quick access to all pages, theme settings, and user options.',
                target: '#sidebar',
                position: 'right'
            },
            {
                id: 'theme-selector',
                title: 'Theme Customization',
                content: 'Choose your preferred theme - Dark, Light, or GIKI colors. Your choice is saved automatically.',
                target: '#theme-select',
                position: 'left'
            },
            {
                id: 'footer',
                title: 'Tour Complete! 🎉',
                content: 'You\'re all set! You can restart this tour anytime by clicking the tour button in the sidebar. Enjoy exploring GIKI Chronicles!',
                target: null,
                position: 'center'
            }
        ];

        // Mobile tour steps
        this.mobileTourSteps = [
            {
                id: 'welcome',
                title: 'Welcome to GIKI Chronicles! 👋',
                content: 'Let\'s take a quick tour to help you navigate our blog on mobile. Click "Next" to continue.',
                target: null,
                position: 'center'
            },
            {
                id: 'mobile-header',
                title: 'Mobile Header',
                content: 'This is your mobile navigation area. The hamburger menu gives you access to all pages.',
                target: 'header',
                position: 'bottom'
            },
            {
                id: 'logo',
                title: 'GIKI Chronicles Logo',
                content: 'Click the logo anytime to return to the home page.',
                target: 'header a[href="index.html"]',
                position: 'bottom'
            },
            {
                id: 'sidebar-toggle',
                title: 'Mobile Menu',
                content: 'Tap this hamburger menu to open the sidebar with all navigation options.',
                target: '#sidebar-toggle',
                position: 'bottom'
            },
            {
                id: 'sidebar',
                title: 'Sidebar Menu',
                content: 'The sidebar contains quick access to all pages, theme settings, and user options.',
                target: '#sidebar',
                position: 'right'
            },
            {
                id: 'mobile-navigation',
                title: 'Mobile Navigation',
                content: 'Here you\'ll find links to Gallery, Freshmen Guide, Calendar, and other important pages.',
                target: '#sidebar nav',
                position: 'right'
            },
            {
                id: 'theme-selector',
                title: 'Theme Customization',
                content: 'Choose your preferred theme - Dark, Light, or GIKI colors. Your choice is saved automatically.',
                target: '#theme-select',
                position: 'left'
            },
            {
                id: 'footer',
                title: 'Tour Complete! 🎉',
                content: 'You\'re all set! You can restart this tour anytime by clicking the tour button in the sidebar. Enjoy exploring GIKI Chronicles!',
                target: null,
                position: 'center'
            }
        ];

        // Set tour steps based on device type
        this.tourSteps = this.isMobile ? this.mobileTourSteps : this.desktopTourSteps;
        
        this.init();
    }

    init() {
        this.createTourUI();
        this.bindEvents();
        
        // Always show tour button in sidebar (not just for new users)
        this.showTourButton();
    }

    createTourUI() {
        // Create tour overlay
        const overlay = document.createElement('div');
        overlay.id = 'tour-overlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-[9999] hidden transition-opacity duration-300';
        document.body.appendChild(overlay);

        // Create tour tooltip
        const tooltip = document.createElement('div');
        tooltip.id = 'tour-tooltip';
        tooltip.className = 'fixed z-[10000] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 max-w-sm md:max-w-sm w-[90vw] md:w-auto mx-4 hidden transform transition-all duration-300 scale-95 opacity-0';
        tooltip.innerHTML = `
            <div class="p-4 md:p-4">
                <div class="flex items-center justify-between mb-3">
                    <h3 id="tour-title" class="text-lg md:text-lg font-semibold text-gray-800 dark:text-white"></h3>
                    <button id="tour-close" class="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors duration-200 p-1">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <p id="tour-content" class="text-gray-600 dark:text-gray-300 mb-4 text-sm md:text-base leading-relaxed"></p>
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
                    <div class="flex space-x-2 w-full md:w-auto">
                        <button id="tour-prev" class="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 rounded-md border border-gray-300 dark:border-gray-600">
                            Previous
                        </button>
                        <button id="tour-next" class="flex-1 md:flex-none px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 border border-blue-600">
                            Next
                        </button>
                    </div>
                    <span id="tour-progress" class="text-sm text-gray-500 dark:text-gray-400 text-center md:text-right w-full md:w-auto"></span>
                </div>
            </div>
        `;
        document.body.appendChild(tooltip);

        // Create tour button for sidebar
        const tourButton = document.createElement('button');
        tourButton.id = 'sidebar-tour-btn';
        tourButton.className = 'w-full flex items-center px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition duration-200';
        tourButton.innerHTML = `
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Take Website Tour
        `;
        
        // Insert tour button into sidebar (will be shown when needed)
        this.tourButton = tourButton;
    }

    showTourButton() {
        // Find sidebar navigation and add tour button
        const sidebarNav = document.querySelector('#sidebar nav .space-y-4');
        if (sidebarNav) {
            // Check if tour section already exists
            let tourSection = sidebarNav.querySelector('.tour-section');
            if (!tourSection) {
                tourSection = document.createElement('div');
                tourSection.className = 'tour-section';
                tourSection.innerHTML = `
                    <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Help</h3>
                    <div class="space-y-2">
                    </div>
                `;
                tourSection.querySelector('.space-y-2').appendChild(this.tourButton);
                sidebarNav.appendChild(tourSection);
            }
        } else {
            // Fallback: try to find any sidebar container
            const sidebar = document.querySelector('#sidebar');
            if (sidebar) {
                const tourSection = document.createElement('div');
                tourSection.className = 'tour-section mt-6';
                tourSection.innerHTML = `
                    <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Help</h3>
                    <div class="space-y-2">
                    </div>
                `;
                tourSection.querySelector('.space-y-2').appendChild(this.tourButton);
                sidebar.appendChild(tourSection);
            }
        }
    }

    bindEvents() {
        // Tour button click
        document.addEventListener('click', (e) => {
            if (e.target.closest('#sidebar-tour-btn')) {
                this.startTour();
            }
        });

        // Tour navigation
        document.addEventListener('click', (e) => {
            if (e.target.id === 'tour-next') {
                this.nextStep();
            } else if (e.target.id === 'tour-prev') {
                this.prevStep();
            } else if (e.target.id === 'tour-close') {
                this.endTour();
            }
        });

        // Close tour on overlay click
        document.getElementById('tour-overlay').addEventListener('click', () => {
            this.endTour();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            
            if (e.key === 'Escape') {
                this.endTour();
            } else if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                this.nextStep();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.prevStep();
            }
        });

        // Handle window resize to update tour steps
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth < 768;
            
            // If device type changed, update tour steps
            if (wasMobile !== this.isMobile) {
                this.tourSteps = this.isMobile ? this.mobileTourSteps : this.desktopTourSteps;
                
                // If tour is active, restart with new steps
                if (this.isActive) {
                    this.currentStep = 0;
                    this.showStep();
                }
            }
        });
    }

    startTour() {
        this.isActive = true;
        this.currentStep = 0;
        
        // Show overlay with fade in
        const overlay = document.getElementById('tour-overlay');
        overlay.classList.remove('hidden');
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
        
        // Show tooltip with animation
        const tooltip = document.getElementById('tour-tooltip');
        tooltip.classList.remove('hidden');
        setTimeout(() => {
            tooltip.classList.remove('scale-95', 'opacity-0');
            tooltip.classList.add('scale-100', 'opacity-100');
        }, 100);
        
        this.showStep();
        
        // Mark tour as started
        localStorage.setItem('tour-started', 'true');
    }

    endTour() {
        this.isActive = false;
        
        // Hide overlay with fade out
        const overlay = document.getElementById('tour-overlay');
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 300);
        
        // Hide tooltip with animation
        const tooltip = document.getElementById('tour-tooltip');
        tooltip.classList.add('scale-95', 'opacity-0');
        tooltip.classList.remove('scale-100', 'opacity-100');
        setTimeout(() => {
            tooltip.classList.add('hidden');
        }, 300);
        
        // Remove highlight from current element
        this.removeHighlight();
        
        // Mark tour as completed
        localStorage.setItem('tour-completed', 'true');
        
        // Show completion message
        this.showCompletionMessage();
    }

    showStep() {
        const step = this.tourSteps[this.currentStep];
        const tooltip = document.getElementById('tour-tooltip');
        
        // Update content
        document.getElementById('tour-title').textContent = step.title;
        document.getElementById('tour-content').textContent = step.content;
        document.getElementById('tour-progress').textContent = `${this.currentStep + 1} of ${this.tourSteps.length}`;
        
        // Update navigation buttons
        const prevBtn = document.getElementById('tour-prev');
        const nextBtn = document.getElementById('tour-next');
        
        prevBtn.disabled = this.currentStep === 0;
        nextBtn.textContent = this.currentStep === this.tourSteps.length - 1 ? 'Finish' : 'Next';
        
        // Animate tooltip transition
        tooltip.classList.add('scale-95', 'opacity-0');
        tooltip.classList.remove('scale-100', 'opacity-100');
        
        setTimeout(() => {
            // Position tooltip
            this.positionTooltip(step);
            
            // Highlight target element
            this.highlightElement(step.target);
            
            // Animate tooltip back in
            tooltip.classList.remove('scale-95', 'opacity-0');
            tooltip.classList.add('scale-100', 'opacity-100');
        }, 150);
    }

    positionTooltip(step) {
        const tooltip = document.getElementById('tour-tooltip');
        
        if (!step.target) {
            // Center tooltip for welcome and completion steps
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
            return;
        }
        
        // Try multiple selectors for better targeting
        const targetElement = this.findTargetElement(step.target);
        if (!targetElement) {
            // Fallback to center if target not found
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
            return;
        }
        
        const targetRect = targetElement.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top, left;
        
        switch (step.position) {
            case 'top':
                top = targetRect.top - tooltipRect.height - 10;
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'bottom':
                top = targetRect.bottom + 10;
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'left':
                top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                left = targetRect.left - tooltipRect.width - 10;
                break;
            case 'right':
                top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                left = targetRect.right + 10;
                break;
            default:
                top = targetRect.bottom + 10;
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        }
        
        // Ensure tooltip stays within viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Mobile-specific positioning adjustments
        if (this.isMobile) {
            // On mobile, center the tooltip horizontally if it's too wide
            if (tooltipRect.width > viewportWidth - 20) {
                left = 10;
            } else {
                if (left < 10) left = 10;
                if (left + tooltipRect.width > viewportWidth - 10) {
                    left = viewportWidth - tooltipRect.width - 10;
                }
            }
            
            // Ensure vertical positioning works well on mobile
            if (top < 10) top = 10;
            if (top + tooltipRect.height > viewportHeight - 10) {
                top = viewportHeight - tooltipRect.height - 10;
            }
        } else {
            // Desktop positioning
            if (left < 10) left = 10;
            if (left + tooltipRect.width > viewportWidth - 10) {
                left = viewportWidth - tooltipRect.width - 10;
            }
            if (top < 10) top = 10;
            if (top + tooltipRect.height > viewportHeight - 10) {
                top = viewportHeight - tooltipRect.height - 10;
            }
        }
        
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        tooltip.style.transform = 'none';
    }

    findTargetElement(selector) {
        // Handle multiple selectors separated by commas
        const selectors = selector.split(',').map(s => s.trim());
        
        for (const sel of selectors) {
            const element = document.querySelector(sel);
            if (element) {
                return element;
            }
        }
        
        return null;
    }

    highlightElement(selector) {
        this.removeHighlight();
        
        if (!selector) return;
        
        const element = this.findTargetElement(selector);
        if (element) {
            element.style.position = 'relative';
            element.style.zIndex = '10001';
            element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)';
            element.style.borderRadius = '4px';
            element.style.transition = 'box-shadow 0.3s ease';
        }
    }

    removeHighlight() {
        const highlightedElements = document.querySelectorAll('[style*="z-index: 10001"]');
        highlightedElements.forEach(el => {
            el.style.position = '';
            el.style.zIndex = '';
            el.style.boxShadow = '';
            el.style.borderRadius = '';
            el.style.transition = '';
        });
    }

    nextStep() {
        if (this.currentStep < this.tourSteps.length - 1) {
            this.currentStep++;
            this.showStep();
        } else {
            this.endTour();
        }
    }

    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep();
        }
    }

    showCompletionMessage() {
        // Create a temporary completion message
        const message = document.createElement('div');
        message.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[10000] transform transition-all duration-300 translate-x-full border border-green-600';
        message.innerHTML = `
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="font-medium">Tour completed! You can restart it anytime from the sidebar.</span>
            </div>
        `;
        
        document.body.appendChild(message);
        
        // Animate in
        setTimeout(() => {
            message.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            message.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(message)) {
                    document.body.removeChild(message);
                }
            }, 300);
        }, 3000);
    }

    // Method to restart tour (can be called from anywhere)
    restartTour() {
        localStorage.removeItem('tour-completed');
        this.startTour();
    }

    // Debug method to test tour functionality
    debugTour() {
        console.log('Tour Debug Info:');
        console.log('- Device Type:', this.isMobile ? 'Mobile' : 'Desktop');
        console.log('- Current Step:', this.currentStep);
        console.log('- Is Active:', this.isActive);
        console.log('- Total Steps:', this.tourSteps.length);
        console.log('- Tour Completed:', localStorage.getItem('tour-completed'));
        console.log('- Welcome Popup Shown:', localStorage.getItem('welcome-popup-shown'));
        
        // Test element targeting
        this.tourSteps.forEach((step, index) => {
            if (step.target) {
                const element = this.findTargetElement(step.target);
                console.log(`- Step ${index + 1} (${step.id}):`, element ? 'Found' : 'Not Found');
            }
        });
    }
}

// Initialize tour when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.websiteTour = new WebsiteTour();
    
    // Add debug function to window for testing
    window.debugTour = () => {
        if (window.websiteTour) {
            window.websiteTour.debugTour();
        }
    };
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebsiteTour;
}
