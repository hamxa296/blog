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
})();