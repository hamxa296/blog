/**
 * Accessibility Enhancements
 * Improves keyboard navigation and ARIA state management
 */

document.addEventListener('DOMContentLoaded', function() {
    // Sidebar accessibility
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarClose = document.getElementById('sidebar-close');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle && sidebar) {
        // Update ARIA state when sidebar opens/closes
        sidebarToggle.addEventListener('click', function() {
            const isExpanded = sidebar.classList.contains('translate-x-0');
            sidebarToggle.setAttribute('aria-expanded', !isExpanded);
        });

        // Keyboard navigation for sidebar
        sidebarToggle.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                sidebarToggle.click();
            }
        });
    }

    if (sidebarClose) {
        sidebarClose.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                sidebarClose.click();
            }
        });
    }

    // Enhanced focus management
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    
    // Trap focus in sidebar when open
    function trapFocus(element) {
        const focusableContent = element.querySelectorAll(focusableElements);
        const firstFocusableElement = focusableContent[0];
        const lastFocusableElement = focusableContent[focusableContent.length - 1];

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusableElement) {
                        lastFocusableElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusableElement) {
                        firstFocusableElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }

    // Apply focus trap to sidebar
    if (sidebar) {
        trapFocus(sidebar);
    }

    // Skip to main content link
    function createSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50';
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    // Add main content ID if not present
    const mainContent = document.querySelector('main') || document.querySelector('#blog-content');
    if (mainContent && !mainContent.id) {
        mainContent.id = 'main-content';
    }

    createSkipLink();

    // Enhanced form accessibility
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            // Add error state management
            input.addEventListener('invalid', function(e) {
                e.preventDefault();
                input.classList.add('error');
                input.setAttribute('aria-invalid', 'true');
            });

            input.addEventListener('input', function() {
                if (input.classList.contains('error')) {
                    input.classList.remove('error');
                    input.setAttribute('aria-invalid', 'false');
                }
            });
        });
    });

    // Loading state announcements for screen readers
    function announceLoadingState(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    // Make announcement function globally available
    window.announceLoadingState = announceLoadingState;

    // Enhanced button accessibility
    const buttons = document.querySelectorAll('button:not([aria-label])');
    buttons.forEach(button => {
        // Add descriptive labels for buttons without text
        if (!button.textContent.trim() && !button.getAttribute('aria-label')) {
            const icon = button.querySelector('svg');
            if (icon) {
                // Try to infer purpose from context
                const parent = button.parentElement;
                const sibling = button.nextElementSibling || button.previousElementSibling;
                if (sibling && sibling.textContent) {
                    button.setAttribute('aria-label', sibling.textContent.trim());
                }
            }
        }
    });

    // Color contrast enhancement
    function enhanceColorContrast() {
        const theme = document.documentElement.className;
        const isDark = theme.includes('dark');
        
        // Add high contrast mode support
        if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
            document.documentElement.classList.add('high-contrast');
        }
    }

    enhanceColorContrast();

    // Reduced motion support
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.classList.add('reduce-motion');
    }
});

// Utility function for announcing dynamic content changes
window.announceToScreenReader = function(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        if (announcement.parentNode) {
            document.body.removeChild(announcement);
        }
    }, 1000);
};
