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
        console.log('Applying theme:', themeName);
        
        // Remove all existing theme classes from both html and body
        document.documentElement.classList.remove('theme-basic-light', 'theme-basic-dark', 'theme-giki');
        document.body.classList.remove('theme-basic-light', 'theme-basic-dark', 'theme-giki');
        
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
        
        console.log('Theme applied successfully. Current classes:', document.body.className);
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
})(); 