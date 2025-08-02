/**
 * app.js
 * This is the main application script. It handles the integration
 * of frontend elements with the backend functions.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Initialize Quill Editor ---
    let quill;
    if (document.getElementById('editor-container')) {
        console.log("Initializing Quill editor..."); // DEBUG
        quill = new Quill('#editor-container', {
            theme: 'snow',
            placeholder: 'Craft your story here...',
            modules: { toolbar: [[{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline'], [{ 'list': 'ordered' }, { 'list': 'bullet' }], ['link', 'image'], ['clean']] }
        });
        console.log("Quill editor initialized successfully"); // DEBUG
        
        // Ensure Quill is fully ready
        setTimeout(() => {
            if (quill && quill.root) {
                console.log("Quill editor is fully ready"); // DEBUG
            }
        }, 50);
    } else {
        console.log("Editor container not found"); // DEBUG
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

    // --- Post Form Logic (Handles both Create and Edit) ---
    // **FIX:** Changed getElementById to look for 'post-form' to match the HTML.
    const postForm = document.getElementById('post-form');
    if (postForm) {
        console.log("Post Form logic loaded."); // DEBUG
        const urlParams = new URLSearchParams(window.location.search);
        const postIdToEdit = urlParams.get('edit');
        console.log("URL parameters:", window.location.search); // DEBUG
        console.log("Post ID to edit:", postIdToEdit); // DEBUG

        // Check if we are in "edit mode"
        if (postIdToEdit) {
            console.log("Attempting to edit post with ID:", postIdToEdit); // DEBUG

            // Change UI for editing
            document.getElementById('page-title').textContent = 'Edit Your Post';
            document.getElementById('page-subtitle').textContent = 'Make your changes and resubmit for review.';
            document.getElementById('submit-post-button').textContent = 'Update Post';
            document.getElementById('post-id').value = postIdToEdit;

            // Show loading state
            const showLoadingState = () => {
                // Disable form inputs
                document.getElementById('post-title').disabled = true;
                document.getElementById('post-description').disabled = true;
                document.getElementById('post-photo').disabled = true;
                document.getElementById('post-genre').disabled = true;
                document.getElementById('post-tags').disabled = true;
                document.getElementById('submit-post-button').disabled = true;
                
                // Add loading placeholder to title
                document.getElementById('post-title').value = 'Loading post...';
                document.getElementById('post-title').classList.add('opacity-50');
                
                // Add loading placeholder to description
                document.getElementById('post-description').value = 'Loading post content...';
                document.getElementById('post-description').classList.add('opacity-50');
                
                // Show loading message
                document.getElementById('form-message').textContent = 'Loading your post...';
                document.getElementById('form-message').className = 'text-center h-5 text-blue-600';
            };

            // Hide loading state and enable form
            const hideLoadingState = () => {
                // Enable form inputs
                document.getElementById('post-title').disabled = false;
                document.getElementById('post-description').disabled = false;
                document.getElementById('post-photo').disabled = false;
                document.getElementById('post-genre').disabled = false;
                document.getElementById('post-tags').disabled = false;
                document.getElementById('submit-post-button').disabled = false;
                
                // Remove loading placeholders and styling
                document.getElementById('post-title').classList.remove('opacity-50');
                document.getElementById('post-description').classList.remove('opacity-50');
                
                // Clear loading message
                document.getElementById('form-message').textContent = '';
                document.getElementById('form-message').className = 'text-center h-5';
            };

            // Load the existing post data into the form
            const loadPostForEditing = async () => {
                console.log("Loading post data for editing..."); // DEBUG
                
                // Show loading state
                showLoadingState();
                
                try {
                    const result = await getPostForEditing(postIdToEdit);
                    console.log("Result from getPostForEditing:", result); // DEBUG

                    if (result.success) {
                        const post = result.post;
                        console.log("Post data to load:", post); // DEBUG
                        
                        // Check if Quill is initialized
                        if (!quill || !quill.root) {
                            console.error("Quill editor is not initialized!"); // DEBUG
                            hideLoadingState();
                            document.getElementById('form-message').textContent = 'Editor not ready. Please refresh the page.';
                            return;
                        }
                        
                        // Populate form fields
                        document.getElementById('post-title').value = post.title;
                        document.getElementById('post-description').value = post.description || '';
                        document.getElementById('post-photo').value = post.photoUrl || '';
                        document.getElementById('post-genre').value = post.genre || 'General';
                        document.getElementById('post-tags').value = post.tags ? post.tags.join(', ') : '';
                        
                        // Set Quill content with a small delay to ensure editor is ready
                        console.log("Setting Quill content:", post.content); // DEBUG
                        setTimeout(() => {
                            if (quill && quill.root) {
                                quill.root.innerHTML = post.content;
                                console.log("Quill content set successfully"); // DEBUG
                                
                                // Hide loading state after everything is loaded
                                hideLoadingState();
                            } else {
                                console.error("Quill editor still not ready after delay"); // DEBUG
                                hideLoadingState();
                                document.getElementById('form-message').textContent = 'Editor not ready. Please refresh the page.';
                            }
                        }, 100); // Small delay to ensure Quill is fully ready
                        
                    } else {
                        console.error("Failed to load post:", result.error); // DEBUG
                        hideLoadingState();
                        document.getElementById('form-message').textContent = result.error;
                    }
                } catch (error) {
                    console.error("Error in loadPostForEditing:", error); // DEBUG
                    hideLoadingState();
                    document.getElementById('form-message').textContent = 'Error loading post data.';
                }
            };
            
            // Wait for authentication state to be established before loading post data
            const waitForAuthAndLoad = () => {
                const currentUser = auth.currentUser;
                console.log("Checking auth state - Current user:", currentUser ? currentUser.uid : "Not logged in"); // DEBUG
                
                if (currentUser) {
                    console.log("User is authenticated, loading post data..."); // DEBUG
                    
                    // Show initial loading state immediately
                    showLoadingState();
                    
                    // Add a small delay before loading to ensure Quill is initialized
                    setTimeout(() => {
                        loadPostForEditing();
                    }, 200);
                } else {
                    console.log("User not authenticated yet, waiting..."); // DEBUG
                    // Wait a bit and check again
                    setTimeout(waitForAuthAndLoad, 100);
                }
            };
            
            // Start the authentication check process
            waitForAuthAndLoad();
        } else {
            console.log("No post ID found in URL - creating new post"); // DEBUG
        }

        postForm.addEventListener('submit', async (e) => {
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

            let result;
            const postId = document.getElementById('post-id').value;

            if (postId) {
                // We are updating an existing post
                result = await updatePost(postId, postData);
            } else {
                // We are creating a new post
                result = await createPost(postData);
            }

            if (result.success) {
                formMessage.textContent = 'Post submitted successfully!';
                setTimeout(() => { window.location.href = 'profile.html'; }, 2000); // Redirect to profile to see status
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
            } else {
                // If the profile doesn't exist, create a basic one.
                console.log("No profile found, creating a new one...");
                const newProfile = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0],
                    photoURL: user.photoURL || '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                await db.collection('users').doc(user.uid).set(newProfile);
                loadProfileData(user); // Reload the data now that it's created
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

        const loadUserPosts = async (user) => {
            if (!user) return;
            const myPostsContainer = document.getElementById('my-posts-container');
            if (!myPostsContainer) return;

            const result = await getPostsByAuthor(user.uid);
            myPostsContainer.innerHTML = ''; // Clear the "Loading..." message

            if (result.success && result.posts.length > 0) {
                result.posts.forEach(post => {
                    const postElement = document.createElement('div');
                    postElement.className = 'flex justify-between items-center p-4 border rounded-lg';

                    let statusColor = 'bg-yellow-200 text-yellow-800'; // Default for pending
                    if (post.status === 'approved') {
                        statusColor = 'bg-green-200 text-green-800';
                    } else if (post.status === 'rejected') {
                        statusColor = 'bg-red-200 text-red-800';
                    }

                    postElement.innerHTML = `
                        <div>
                            <a href="post.html?id=${post.id}" class="font-bold text-lg hover:text-blue-600">${post.title}</a>
                            <p class="text-sm text-gray-500 mt-1">Status: 
                                <span class="px-2 py-1 rounded-full text-xs font-semibold ${statusColor}">
                                    ${post.status}
                                </span>
                            </p>
                        </div>
                        <a href="write.html?edit=${post.id}" class="text-sm font-semibold text-blue-600 hover:underline">Edit</a>
                    `;
                    myPostsContainer.appendChild(postElement);
                });
            } else {
                myPostsContainer.innerHTML = '<p class="text-gray-500">You have not written any posts yet.</p>';
            }
        };

        onAuthStateChange(user => {
            if (user) {
                loadProfileData(user);
                loadUserPosts(user);
            } else {
                window.location.href = 'login.html';
            }
        });
    }

    // --- Homepage Logic ---
    const recentPostsGrid = document.getElementById('recent-posts-grid');
    if (recentPostsGrid) {
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

        const displayApprovedPosts = async () => {
            const result = await getApprovedPosts();
            recentPostsGrid.innerHTML = '';
            if (result.success && result.posts.length > 0) {
                result.posts.forEach(post => {
                    if (post.isFeatured) return;

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
