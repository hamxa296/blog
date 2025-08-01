/*
    JavaScript for GIKI Chronicles Blog
    Handles interactive elements of the site.
*/

// --- Mobile Menu Toggle ---

// Get the button that opens the mobile menu.
const mobileMenuButton = document.getElementById('mobile-menu-button');

// Get the mobile menu itself.
const mobileMenu = document.getElementById('mobile-menu');

// Check if both the button and the menu exist in the document.
if (mobileMenuButton && mobileMenu) {
    // Add a 'click' event listener to the button.
    // When the button is clicked, it will execute the arrow function.
    mobileMenuButton.addEventListener('click', () => {
        // The toggle() method adds the 'hidden' class if it's not present,
        // and removes it if it is present. Tailwind CSS uses the 'hidden'
        // class to set 'display: none;'.
        mobileMenu.classList.toggle('hidden');
    });
}
