// Theme Management for GIKI Chronicles
// This file handles theme switching across all pages

// Load saved theme from localStorage and apply it
const savedTheme = localStorage.getItem('selected-theme') || 'basic-dark';

// Function to apply theme
function applyTheme(themeName) {
    // Remove all existing theme classes
    document.body.classList.remove('theme-basic-light', 'theme-basic-dark', 'theme-giki');
    
    // Add the selected theme class
    document.body.classList.add(`theme-${themeName}`);
    
    // Save the theme to localStorage
    localStorage.setItem('selected-theme', themeName);
}

// Function to initialize theme functionality
function initializeTheme() {
    // Apply the saved theme
    applyTheme(savedTheme);

    // Set the theme selector to match the saved theme
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.value = savedTheme;
        
        // Add event listener for theme selector
        themeSelect.addEventListener('change', function() {
            const selectedTheme = this.value;
            applyTheme(selectedTheme);
        });
    }
}

// Initialize theme when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTheme);
} else {
    initializeTheme();
} 