/**
 * app.js
 * This is the main application script. It handles the integration
 * of frontend elements with the backend authentication functions.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Shared Elements ---
    const googleSignInButton = document.getElementById('google-signin-button');
    const errorMessage = document.getElementById('error-message');

    // --- Login Page Logic ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;

            const result = await loginUser(email, password);

            if (result.success) {
                window.location.href = 'index.html';
            } else {
                errorMessage.textContent = result.error;
            }
        });
    }

    // --- Sign-up Page Logic ---
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = signupForm.email.value;
            const password = signupForm.password.value;

            const result = await signUpUser(email, password);

            if (result.success) {
                window.location.href = 'index.html';
            } else {
                errorMessage.textContent = result.error;
            }
        });
    }

    // --- Google Sign-In Logic ---
    if (googleSignInButton) {
        googleSignInButton.addEventListener('click', async () => {
            const result = await signInWithGoogle();
            if (result.success) {
                window.location.href = 'index.html';
            } else {
                if (errorMessage) {
                    errorMessage.textContent = result.error;
                }
            }
        });
    }

    // --- Dynamic Navigation Bar Logic (to be implemented on index.html) ---
    // This function will check if a user is logged in and show the correct
    // navigation links. You will need to add `id="user-nav"` and `id="guest-nav"`
    // to the appropriate divs in your main index.html file.
    onAuthStateChange(user => {
        const userNav = document.getElementById('user-nav');
        const guestNav = document.getElementById('guest-nav');

        if (user) {
            // User is signed in.
            console.log('User is logged in:', user.email);
            if (userNav) userNav.style.display = 'flex';
            if (guestNav) guestNav.style.display = 'none';
        } else {
            // User is signed out.
            console.log('User is logged out.');
            if (userNav) userNav.style.display = 'none';
            if (guestNav) guestNav.style.display = 'flex';
        }
    });

    // --- Logout Button Logic (to be implemented on index.html) ---
    // This will handle logging the user out. You will need a button
    // with `id="logout-button"` in your main index.html file.
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            await logoutUser();
            window.location.href = 'index.html';
        });
    }
});
