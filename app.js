/**
 * app.js
 * This is the main application script. It handles the integration
 * of frontend elements with the backend functions.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Initialize Quill Editor ---
    let quill;
    if (document.getElementById('editor-container')) {
        quill = new Quill('#editor-container', {
            theme: 'snow',
            placeholder: 'Craft your story here...',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['link', 'image'],
                    ['clean']
                ]
            }
        });
    }

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

    // --- Create Post Page Logic ---
    const createPostForm = document.getElementById('create-post-form');
    if (createPostForm) {
        createPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formMessage = document.getElementById('form-message');
            formMessage.textContent = 'Submitting...';
            formMessage.classList.remove('text-red-500');
            formMessage.classList.add('text-blue-500');

            const formData = new FormData(createPostForm);
            const postData = {
                title: formData.get('title'),
                description: formData.get('description'),
                photoUrl: formData.get('photoUrl'),
                genre: formData.get('genre'),
                tags: formData.get('tags'),
                content: quill.root.innerHTML
            };

            const result = await createPost(postData);

            if (result.success) {
                formMessage.textContent = 'Post submitted successfully for review!';
                formMessage.classList.remove('text-blue-500');
                formMessage.classList.add('text-green-500');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                formMessage.textContent = result.error;
                formMessage.classList.remove('text-blue-500');
                formMessage.classList.add('text-red-500');
            }
        });
    }

    // --- Homepage Logic ---
    const recentPostsGrid = document.getElementById('recent-posts-grid');
    if (recentPostsGrid) {
        const displayApprovedPosts = async () => {
            const result = await getApprovedPosts();
            if (result.success && result.posts.length > 0) {
                recentPostsGrid.innerHTML = ''; // Clear the placeholder posts
                result.posts.forEach(post => {
                    const postCard = document.createElement('div');
                    postCard.className = 'bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300';

                    const postDate = post.createdAt ? post.createdAt.toDate().toLocaleDateString() : 'N/A';

                    postCard.innerHTML = `
                        <img class="h-48 w-full object-cover" src="${post.photoUrl || 'https://placehold.co/600x400/E2E8F0/4A5568?text=GIKI+Blog'}" alt="${post.title}">
                        <div class="p-6">
                            <p class="text-sm text-gray-500 mb-2">${postDate}</p>
                            <h4 class="text-xl font-semibold mb-3">${post.title}</h4>
                            <p class="text-gray-600 text-sm mb-4">${post.description || ''}</p>
                            <a href="#" class="font-semibold text-blue-600 hover:underline">Read More &rarr;</a>
                        </div>
                    `;
                    recentPostsGrid.appendChild(postCard);
                });
            } else if (result.success) {
                recentPostsGrid.innerHTML = '<p class="text-gray-500">No posts have been approved yet. Check back soon!</p>';
            }
        };
        displayApprovedPosts();
    }

    // --- Dynamic Navigation Bar Logic ---
    onAuthStateChange(user => {
        const userNav = document.getElementById('user-nav');
        const guestNav = document.getElementById('guest-nav');

        if (user) {
            console.log('User is logged in:', user.email);
            if (userNav) userNav.style.display = 'flex';
            if (guestNav) guestNav.style.display = 'none';
        } else {
            console.log('User is logged out.');
            if (userNav) userNav.style.display = 'none';
            if (guestNav) guestNav.style.display = 'flex';
        }
    });

    // --- Logout Button Logic ---
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            await logoutUser();
            window.location.href = 'index.html';
        });
    }
});
