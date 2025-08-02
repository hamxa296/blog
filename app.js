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
            modules: { toolbar: [[{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline'], [{ 'list': 'ordered' }, { 'list': 'bullet' }], ['link', 'image'], ['clean']] }
        });
    }

    // --- Authentication Logic (Login, Signup, Google) ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const result = await loginUser(loginForm.email.value, loginForm.password.value);
            if (result.success) window.location.href = 'index.html';
            else document.getElementById('error-message').textContent = result.error;
        });
    }
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const result = await signUpUser(signupForm.email.value, signupForm.password.value);
            if (result.success) window.location.href = 'index.html';
            else document.getElementById('error-message').textContent = result.error;
        });
    }
    const googleSignInButton = document.getElementById('google-signin-button');
    if (googleSignInButton) {
        googleSignInButton.addEventListener('click', async () => {
            const result = await signInWithGoogle();
            if (result.success) window.location.href = 'index.html';
            else if (document.getElementById('error-message')) document.getElementById('error-message').textContent = result.error;
        });
    }

    // --- Create Post Page Logic ---
    const createPostForm = document.getElementById('create-post-form');
    if (createPostForm) {
        createPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formMessage = document.getElementById('form-message');
            if (!quill || quill.getLength() <= 1) {
                formMessage.textContent = 'Please write some content for your post.';
                return;
            }
            formMessage.textContent = 'Submitting...';
            const postData = {
                title: document.getElementById('post-title').value,
                description: document.getElementById('post-description').value,
                photoUrl: document.getElementById('post-photo').value,
                genre: document.getElementById('post-genre').value,
                tags: document.getElementById('post-tags').value,
                content: quill.root.innerHTML
            };
            const result = await createPost(postData);
            if (result.success) {
                formMessage.textContent = 'Post submitted successfully!';
                setTimeout(() => { window.location.href = 'index.html'; }, 2000);
            } else {
                formMessage.textContent = result.error;
            }
        });
    }

    // --- Profile Page Logic ---
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        const displayNameInput = document.getElementById('display-name');
        const userEmailInput = document.getElementById('user-email');
        const userBioInput = document.getElementById('user-bio');
        const profilePicImg = document.getElementById('profile-pic');
        const photoUploadButton = document.querySelector('#profile-pic + button');
        const photoUploadInput = document.getElementById('photo-upload');
        const formMessage = document.getElementById('form-message');

        const loadProfileData = async (user) => {
            if (!user) return;
            const result = await getUserProfile(user.uid);
            if (result.success) {
                const profile = result.profile;
                displayNameInput.value = profile.displayName || '';
                userEmailInput.value = profile.email || '';
                userBioInput.value = profile.bio || '';
                if (profile.photoURL) {
                    profilePicImg.src = profile.photoURL;
                }
            }
        };

        if (photoUploadButton) {
            photoUploadButton.addEventListener('click', () => photoUploadInput.click());
        }

        if (photoUploadInput) {
            photoUploadInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                const user = auth.currentUser;
                if (file && user) {
                    formMessage.textContent = 'Uploading...';
                    const uploadResult = await uploadProfilePicture(user.uid, file);
                    if (uploadResult.success) {
                        await updateUserProfile(user.uid, { photoURL: uploadResult.url });
                        profilePicImg.src = uploadResult.url;
                        formMessage.textContent = 'Photo updated!';
                    } else {
                        formMessage.textContent = uploadResult.error;
                    }
                }
            });
        }

        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (user) {
                formMessage.textContent = 'Saving...';
                const profileData = {
                    displayName: displayNameInput.value,
                    bio: userBioInput.value
                };
                const result = await updateUserProfile(user.uid, profileData);
                if (result.success) {
                    formMessage.textContent = 'Profile saved successfully!';
                } else {
                    formMessage.textContent = result.error;
                }
            }
        });

        onAuthStateChange(user => {
            if (user) {
                loadProfileData(user);
            } else {
                window.location.href = 'login.html';
            }
        });
    }

    // --- Homepage Logic ---
    const recentPostsGrid = document.getElementById('recent-posts-grid');
    if (recentPostsGrid) {
        // Function to display the featured post
        const displayFeaturedPost = async () => {
            const result = await getFeaturedPost();
            if (result.success) {
                const post = result.post;
                const featuredPostContainer = document.getElementById('featured-post');
                if (featuredPostContainer) {
                    featuredPostContainer.innerHTML = `
                        <div class="bg-white rounded-xl shadow-lg overflow-hidden lg:flex">
                            <div class="lg:w-1/2">
                                <a href="post.html?id=${post.id}">
                                    <img class="h-64 lg:h-full w-full object-cover" src="${post.photoUrl || 'https://placehold.co/800x600/002347/FFFFFF?text=Campus+View'}" alt="${post.title}">
                                </a>
                            </div>
                            <div class="p-8 lg:p-12 lg:w-1/2 flex flex-col justify-center">
                                <p class="text-sm text-blue-500 font-semibold">Featured Article</p>
                                <a href="post.html?id=${post.id}"><h2 class="text-3xl font-bold mt-2 mb-4 hover:text-blue-600">${post.title}</h2></a>
                                <p class="text-gray-600 mb-6">${post.description || ''}</p>
                                <div class="flex items-center">
                                    <p class="font-semibold">${post.authorName}</p>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }
        };

        // Function to display regular approved posts
        const displayApprovedPosts = async () => {
            const result = await getApprovedPosts();
            recentPostsGrid.innerHTML = '';
            if (result.success && result.posts.length > 0) {
                result.posts.forEach(post => {
                    if (post.isFeatured) return; // Don't show the featured post again in the recent list

                    const postCard = document.createElement('div');
                    postCard.className = 'bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300';
                    const postDate = post.createdAt ? post.createdAt.toDate().toLocaleDateString() : 'N/A';
                    postCard.innerHTML = `
                        <a href="post.html?id=${post.id}">
                            <img class="h-48 w-full object-cover" src="${post.photoUrl || 'https://placehold.co/600x400/E2E8F0/4A5568?text=GIKI+Blog'}" alt="${post.title}">
                        </a>
                        <div class="p-6">
                            <p class="text-sm text-gray-500 mb-2">${postDate}</p>
                            <h4 class="text-xl font-semibold mb-3">${post.title}</h4>
                            <p class="text-gray-600 text-sm mb-4">${post.description || ''}</p>
                            <a href="post.html?id=${post.id}" class="font-semibold text-blue-600 hover:underline">Read More &rarr;</a>
                        </div>
                    `;
                    recentPostsGrid.appendChild(postCard);
                });
            } else if (result.success) {
                recentPostsGrid.innerHTML = '<p class="text-gray-500">No posts have been approved yet. Check back soon!</p>';
            }
        };

        // Call both functions to populate the homepage
        displayFeaturedPost();
        displayApprovedPosts();
    }

    // --- Single Post Page Logic ---
    if (document.getElementById('post-content')) {
        const displaySinglePost = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const postId = urlParams.get('id');
            if (!postId) {
                document.getElementById('post-title').textContent = 'Post not found!';
                return;
            }
            const result = await getPostById(postId);
            if (result.success) {
                const post = result.post;
                document.title = `${post.title} - GIKI Chronicles`;
                document.getElementById('post-title').textContent = post.title;
                const postDate = post.createdAt ? post.createdAt.toDate().toLocaleDateString() : 'N/A';
                document.getElementById('post-meta').textContent = `Posted by ${post.authorName} on ${postDate}`;
                if (post.photoUrl) {
                    document.getElementById('post-image').src = post.photoUrl;
                } else {
                    document.getElementById('post-image').style.display = 'none';
                }
                document.getElementById('post-content').innerHTML = post.content;
            } else {
                document.getElementById('post-title').textContent = 'Error';
            }
        };
        displaySinglePost();
    }

    // --- Dynamic Navigation Bar & Logout Logic ---
    onAuthStateChange(user => {
        const userNav = document.getElementById('user-nav');
        const guestNav = document.getElementById('guest-nav');
        if (user) {
            if (userNav) userNav.style.display = 'flex';
            if (guestNav) guestNav.style.display = 'none';
        } else {
            if (userNav) userNav.style.display = 'none';
            if (guestNav) guestNav.style.display = 'flex';
        }
    });

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            await logoutUser();
            window.location.href = 'index.html';
        });
    }
});
