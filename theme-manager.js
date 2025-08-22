// Theme Management for GIKI Chronicles
// This file handles theme switching across all pages
// Wrapped in IIFE to avoid global scope conflicts

(function() {
    'use strict';
    
    // Load saved theme from localStorage, default to 'basic-dark' (black theme)
    let savedTheme = localStorage.getItem('selected-theme');
    if (!savedTheme) {
        savedTheme = 'basic-dark';
        localStorage.setItem('selected-theme', savedTheme);
    }

    // Function to apply theme
    function applyTheme(themeName) {
        // Remove all existing theme classes from both html and body
        document.documentElement.classList.remove('theme-basic-light', 'theme-basic-dark');
        document.body.classList.remove('theme-basic-light', 'theme-basic-dark');
        
        // Add the selected theme class to both html and body
        document.documentElement.classList.add(`theme-${themeName}`);
        document.body.classList.add(`theme-${themeName}`);
        
        // Save the theme to localStorage
        localStorage.setItem('selected-theme', themeName);
        
        // Update theme selector if it exists
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = themeName;
        }
        
        // Dispatch a custom event to notify other scripts that theme has changed
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: themeName } }));
        
        // Font color adjustment for light/dark mode
        if (themeName === 'basic-light') {
            document.body.style.color = '#1A3D63'; // dark blue for light mode
            document.querySelectorAll('.recent-post-card, .post-card-hover').forEach(card => {
                card.style.backgroundColor = '#F6FAFD'; // light background
                card.style.color = '#1A3D63';
            });
        } else {
            // Use an even lighter color for dark mode post text
            document.querySelectorAll('.recent-post-card, .post-card-hover').forEach(card => {
                card.style.backgroundColor = '#0A1931'; // dark background
                card.style.color = '#E3F2FD'; // very light icy blue
            });
        }
        
        // Handle modal text colors for better readability
        updateModalTextColors(themeName);
    }
    
    // Function to update modal text colors based on theme
    function updateModalTextColors(themeName) {
        console.log('🔍 THEME DEBUG: updateModalTextColors called with theme:', themeName);
        
        if (themeName === 'basic-dark') {
            console.log('🔍 THEME DEBUG: Applying dark mode styling');
            // Dark mode: Use icy blue colors for better readability
            const modalSelectors = [
                '#featured-post-modal',
                '#event-modal'
            ];
            
            modalSelectors.forEach(selector => {
                console.log('🔍 THEME DEBUG: Processing modal selector:', selector);
                const modal = document.querySelector(selector);
                if (modal) {
                    console.log('🔍 THEME DEBUG: Found modal:', selector);
                    // Force ALL text elements to icy blue in dark mode
                    const allTextElements = modal.querySelectorAll('*');
                    console.log('🔍 THEME DEBUG: Found', allTextElements.length, 'elements in modal');
                    allTextElements.forEach(element => {
                        // Skip buttons, links, and elements with specific background colors
                        if (element.tagName !== 'BUTTON' && 
                            element.tagName !== 'A' && 
                            !element.classList.contains('bg-[#4A7FA7]') &&
                            !element.classList.contains('bg-[#1A3D63]') &&
                            !element.classList.contains('bg-[#B3CFE5]') &&
                            !element.classList.contains('text-white') &&
                            !element.classList.contains('text-[#B3CFE5]') &&
                            !element.classList.contains('text-[#4A7FA7]')) {
                            
                            console.log('🔍 THEME DEBUG: Styling element:', element.tagName, element.className);
                            // Apply icy blue color for better readability in dark mode
                            element.style.setProperty('color', '#E3F2FD', 'important');
                        }
                    });
                    
                    // Special handling for specific text elements
                    const textElements = modal.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div');
                    textElements.forEach(element => {
                        if (!element.classList.contains('text-white') && 
                            !element.classList.contains('text-[#B3CFE5]') &&
                            !element.classList.contains('text-[#4A7FA7]') &&
                            !element.classList.contains('bg-[#4A7FA7]') &&
                            !element.classList.contains('bg-[#1A3D63]') &&
                            !element.classList.contains('bg-[#B3CFE5]')) {
                            
                            console.log('🔍 THEME DEBUG: Styling text element:', element.tagName, element.className);
                            // Force icy blue color with !important
                            element.style.setProperty('color', '#E3F2FD', 'important');
                        }
                    });
                } else {
                    console.log('❌ THEME DEBUG: Modal not found:', selector);
                }
            });
            
            // Handle any other dynamically created modals (future-proofing)
            const allModals = document.querySelectorAll('[id$="-modal"]');
            allModals.forEach(modal => {
                if (modal.id !== 'event-modal' && modal.id !== 'featured-post-modal') {
                    console.log('🔍 THEME DEBUG: Found unknown modal:', modal.id);
                    // Apply basic styling to unknown modals
                    const textElements = modal.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div');
                    textElements.forEach(element => {
                        if (!element.classList.contains('text-white') && 
                            !element.classList.contains('text-[#B3CFE5]') &&
                            !element.classList.contains('text-[#4A7FA7]') &&
                            !element.classList.contains('bg-[#4A7FA7]') &&
                            !element.classList.contains('bg-[#1A3D63]') &&
                            !element.classList.contains('bg-[#B3CFE5]')) {
                            element.style.setProperty('color', '#E3F2FD', 'important');
                        }
                    });
                }
            });
        } else {
            // Light mode: Reset to default colors
            const modalSelectors = [
                '#featured-post-modal',
                '#event-modal'
            ];
            
            modalSelectors.forEach(selector => {
                const modal = document.querySelector(selector);
                if (modal) {
                    const textElements = modal.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div');
                    textElements.forEach(element => {
                        // Remove inline styles for light mode
                        if (element.style.color === '#E3F2FD' || element.style.getPropertyValue('color') === '#E3F2FD') {
                            element.style.removeProperty('color');
                        }
                    });
                }
            });
        }
    }

    // Function to initialize theme functionality
    function initializeTheme() {
        // Apply the saved theme immediately
        applyTheme(savedTheme);

        // Set up event listener for theme selector
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            // Set the current value
            themeSelect.value = savedTheme;
            
            // Add event listener for theme selector
            themeSelect.addEventListener('change', function() {
                const selectedTheme = this.value;
                applyTheme(selectedTheme);
            });
        }
        
        // Listen for theme changes from other sources
        window.addEventListener('themeChanged', function(event) {
            updateModalTextColors(event.detail.theme);
        });
        
        // Handle dynamically created modals (like when posts are loaded)
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1 && node.id && node.id.endsWith('-modal')) {
                            console.log('🔍 THEME DEBUG: New modal detected:', node.id);
                            // New modal added, update its text colors
                            setTimeout(() => updateModalTextColors(savedTheme), 100);
                        }
                    });
                }
            });
        });
        
        // Start observing for modal additions
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initialize theme as soon as possible
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTheme);
    } else {
        // If DOM is already loaded, initialize immediately
        initializeTheme();
    }

    // Also apply theme immediately for faster visual feedback
    applyTheme(savedTheme);

    // Additional fallback to ensure theme is applied
    setTimeout(() => {
        if (!document.body.classList.contains(`theme-${savedTheme}`)) {
            applyTheme(savedTheme);
        }
    }, 100);
    
    // Final fallback to ensure theme is applied even if other scripts interfere
    setTimeout(() => {
        if (!document.body.classList.contains(`theme-${savedTheme}`)) {
            applyTheme(savedTheme);
        }
    }, 500);
    
    // Expose the updateModalTextColors function globally for manual updates
    window.updateModalTextColors = updateModalTextColors;
})();