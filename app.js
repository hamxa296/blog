/**
 * app.js
 * This is the main application script. It handles the integration
 * of frontend elements with the backend functions.
 */

document.addEventListener('DOMContentLoaded', async () => {
    console.log("App.js: DOM Content Loaded");
    
    // Wait a bit for Firebase to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if user data needs to be loaded
    if (typeof window.ensureUserDataLoaded === 'function') {
        try {
            const currentUser = firebase.auth().currentUser;
            if (currentUser) {
                console.log("App.js: Ensuring user data is loaded on page load");
                await window.ensureUserDataLoaded();
            }
        } catch (error) {
            console.error("App.js: Error ensuring user data loaded on page load:", error);
        }
    }
    
    // --- Initialize Quill Editor ---
    let quill;
    if (document.getElementById('editor-container')) {
        // Clear any existing Quill instances
        const existingEditor = document.querySelector('.ql-editor');
        if (existingEditor) {
            existingEditor.remove();
        }
        
        // Clear the container
        const container = document.getElementById('editor-container');
        container.innerHTML = '';
        
        // Initialize new Quill instance
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

    // --- Post Form Logic (Handles both Create and Edit) ---
    const postForm = document.getElementById('post-form');
    if (postForm) {
        // Clear form message when user starts typing
        const clearFormMessage = () => {
            const formMessage = document.getElementById('form-message');
            if (formMessage && formMessage.textContent.includes('submitted successfully')) {
                formMessage.textContent = '';
                formMessage.className = 'text-center h-5';
            }
        };
        
        // Add event listeners to clear message when user starts editing
        const titleInput = document.getElementById('post-title');
        if (titleInput) {
            titleInput.addEventListener('input', clearFormMessage);
        }
        
        if (quill) {
            quill.on('text-change', clearFormMessage);
        }
        const urlParams = new URLSearchParams(window.location.search);
        const postIdToEdit = urlParams.get('edit');
        if (postIdToEdit) {
            document.getElementById('page-title').textContent = 'Edit Your Post';
            document.getElementById('page-subtitle').textContent = 'Make your changes and resubmit for review.';
            document.getElementById('submit-post-button').textContent = 'Update Post';
            document.getElementById('post-id').value = postIdToEdit;
            const loadPostForEditing = async () => {
                const result = await getPostForEditing(postIdToEdit);
                if (result.success) {
                    const post = result.post;
                    document.getElementById('post-title').value = post.title;
                    document.getElementById('post-description').value = post.description || '';
                    document.getElementById('post-photo').value = post.photoUrl || '';
                    document.getElementById('post-genre').value = post.genre || 'General';
                    document.getElementById('post-tags').value = post.tags ? post.tags.join(', ') : '';
                    quill.root.innerHTML = post.content;
                } else {
                    document.getElementById('form-message').textContent = result.error;
                }
            };
            loadPostForEditing();
        }
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formMessage = document.getElementById('form-message');
            if (!quill || quill.getLength() <= 1) {
                formMessage.textContent = 'Please write some content for your post.';
                formMessage.className = 'text-center h-5 text-red-600 font-medium';
                return;
            }
            formMessage.textContent = 'Submitting...';
            formMessage.className = 'text-center h-5 text-blue-600 font-medium';
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
                result = await updatePost(postId, postData);
            } else {
                result = await createPost(postData);
            }
            if (result.success) {
                formMessage.textContent = '✅ Your post has been submitted successfully! It will be reviewed and approved if it matches our guidelines.';
                formMessage.className = 'text-center h-5 text-green-600 font-medium';
                // Clear the form for a new post
                document.getElementById('post-title').value = '';
                document.getElementById('post-description').value = '';
                document.getElementById('post-photo').value = '';
                document.getElementById('post-genre').value = 'General';
                document.getElementById('post-tags').value = '';
                quill.setText('');
                // Clear the hidden post ID if it was set
                document.getElementById('post-id').value = '';
                // Reset button text
                document.getElementById('submit-post-button').textContent = 'Submit for Review';
                // Reset page title and subtitle
                document.getElementById('page-title').textContent = 'Blog Editor';
                document.getElementById('page-subtitle').textContent = 'Your one-stop hub for student life, engineering marvels, and campus tales at GIKI Institute.';
            } else {
                formMessage.textContent = result.error;
                formMessage.className = 'text-center h-5 text-red-600 font-medium';
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
                const newProfile = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0],
                    photoURL: user.photoURL || '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                await db.collection('users').doc(user.uid).set(newProfile);
                loadProfileData(user);
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
            myPostsContainer.innerHTML = '';
            if (result.success && result.posts.length > 0) {
                result.posts.forEach(post => {
                    const postElement = document.createElement('div');
                    postElement.className = 'flex justify-between items-center p-4 border rounded-lg';
                    let statusColor = 'bg-yellow-200 text-yellow-800';
                    if (post.status === 'approved') {
                        statusColor = 'bg-green-200 text-green-800';
                    } else if (post.status === 'rejected') {
                        statusColor = 'bg-red-200 text-red-800';
                    }
                    postElement.innerHTML = `
                        <div>
                            <a href="post.html?id=${post.id}" class="font-bold text-lg hover:text-blue-600">${post.title}</a>
                            <p class="text-sm text-gray-500 mt-1">Status: 
                                <span class="px-2 py-1 rounded-full text-xs font-semibold ${statusColor}">${post.status}</span>
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
                                <a href="post.html?id=${post.id}"><img class="h-64 lg:h-full w-full object-cover" src="${post.photoUrl || 'https://placehold.co/800x600/002347/FFFFFF?text=Campus+View'}" alt="${post.title}"></a>
                            </div>
                            <div class="p-8 lg:p-12 lg:w-1/2 flex flex-col justify-center">
                                <p class="text-sm text-blue-500 font-semibold">Featured Article</p>
                                <a href="post.html?id=${post.id}"><h2 class="text-3xl font-bold mt-2 mb-4 hover:text-blue-600">${post.title}</h2></a>
                                <p class="text-gray-600 mb-6">${post.description || ''}</p>
                                <div class="flex items-center"><p class="font-semibold">${post.authorName}</p></div>
                            </div>
                        </div>`;
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
                        <a href="post.html?id=${post.id}"><img class="h-48 w-full object-cover" src="${post.photoUrl || 'https://placehold.co/600x400/E2E8F0/4A5568?text=GIKI+Blog'}" alt="${post.title}"></a>
                        <div class="p-6">
                            <p class="text-sm text-gray-500 mb-2">${postDate}</p>
                            <h4 class="text-xl font-semibold mb-3">${post.title}</h4>
                            <p class="text-gray-600 text-sm mb-4">${post.description || ''}</p>
                            <a href="post.html?id=${post.id}" class="font-semibold text-blue-600 hover:underline">Read More &rarr;</a>
                        </div>`;
                    recentPostsGrid.appendChild(postCard);
                });
            } else if (result.success) {
                recentPostsGrid.innerHTML = '<p class="text-gray-500">No posts have been approved yet.</p>';
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

    // --- Contact Form Logic ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formMessage = document.getElementById('form-message');
            formMessage.textContent = 'Sending...';
            const submissionData = {
                name: contactForm.name.value,
                email: contactForm.email.value,
                subject: contactForm.subject.value,
                message: contactForm.message.value
            };
            const result = await saveContactSubmission(submissionData);
            if (result.success) {
                formMessage.textContent = 'Message sent successfully!';
                formMessage.classList.add('text-green-500');
                contactForm.reset();
            } else {
                formMessage.textContent = result.error;
                formMessage.classList.add('text-red-500');
            }
        });
    }

    // Listen for custom auth state changed events (for cross-tab synchronization)
    window.addEventListener('authStateChanged', async (event) => {
        console.log("App.js: Custom auth state changed event received:", event.detail);
        const { user, initialized } = event.detail;
        
        if (initialized && user) {
            // Ensure user data is properly loaded when auth state is initialized
            if (typeof window.ensureUserDataLoaded === 'function') {
                try {
                    await window.ensureUserDataLoaded();
                } catch (error) {
                    console.error("App.js: Error ensuring user data loaded from custom event:", error);
                }
            }
        }
    });

    // --- Dynamic Navigation Bar & Logout Logic ---
    onAuthStateChange(async user => {
        console.log("App.js: Auth state changed, user:", user ? user.uid : "No user");
        
        const userNav = document.getElementById('user-nav');
        const guestNav = document.getElementById('guest-nav');
        const mobileUserNav = document.getElementById('mobile-user-nav');
        const mobileGuestNav = document.getElementById('mobile-guest-nav');
        const adminAccessBtn = document.getElementById('admin-access-btn');
        const mobileAdminAccessBtn = document.getElementById('mobile-admin-access-btn');
        
        if (user) {
            // Ensure user data is properly loaded
            if (typeof window.ensureUserDataLoaded === 'function') {
                try {
                    const dataLoaded = await window.ensureUserDataLoaded();
                    console.log("App.js: User data loaded:", dataLoaded);
                } catch (error) {
                    console.error("App.js: Error ensuring user data loaded:", error);
                }
            }
            
            if (userNav) userNav.style.display = 'flex';
            if (guestNav) guestNav.style.display = 'none';
            if (mobileUserNav) mobileUserNav.style.display = 'block';
            if (mobileGuestNav) mobileGuestNav.style.display = 'none';
            
            // Show user navigation in sidebar
            const sidebarUserNav = document.getElementById('sidebar-user-nav');
            const sidebarGuestNav = document.getElementById('sidebar-guest-nav');
            if (sidebarUserNav) sidebarUserNav.style.display = 'block';
            if (sidebarGuestNav) sidebarGuestNav.style.display = 'none';
            
            // Check if user is admin and show admin access button
            if (typeof checkUserAdminStatus === 'function') {
                try {
                    const isAdmin = await checkUserAdminStatus();
                    console.log("App.js: Admin status check result:", isAdmin);
                    if (isAdmin && adminAccessBtn) {
                        adminAccessBtn.style.display = 'inline-block';
                    }
                    if (isAdmin && mobileAdminAccessBtn) {
                        mobileAdminAccessBtn.style.display = 'block';
                    }
                    // Show sidebar admin button
                    const sidebarAdminBtn = document.getElementById('sidebar-admin-access-btn');
                    if (isAdmin && sidebarAdminBtn) {
                        sidebarAdminBtn.style.display = 'flex';
                    }
                } catch (error) {
                    console.error("App.js: Error checking admin status:", error);
                }
            }
        } else {
            if (userNav) userNav.style.display = 'none';
            if (guestNav) guestNav.style.display = 'flex';
            if (mobileUserNav) mobileUserNav.style.display = 'none';
            if (mobileGuestNav) mobileGuestNav.style.display = 'block';
            if (adminAccessBtn) adminAccessBtn.style.display = 'none';
            if (mobileAdminAccessBtn) mobileAdminAccessBtn.style.display = 'none';
            
            // Show guest navigation in sidebar
            const sidebarUserNav = document.getElementById('sidebar-user-nav');
            const sidebarGuestNav = document.getElementById('sidebar-guest-nav');
            if (sidebarUserNav) sidebarUserNav.style.display = 'none';
            if (sidebarGuestNav) sidebarGuestNav.style.display = 'block';
            
            // Hide sidebar admin button
            const sidebarAdminBtn = document.getElementById('sidebar-admin-access-btn');
            if (sidebarAdminBtn) sidebarAdminBtn.style.display = 'none';
        }
    });

    // Admin access button click handlers
    const adminAccessBtn = document.getElementById('admin-access-btn');
    if (adminAccessBtn) {
        adminAccessBtn.addEventListener('click', () => {
            window.location.href = 'admin-access.html';
        });
    }
    
    const mobileAdminAccessBtn = document.getElementById('mobile-admin-access-btn');
    if (mobileAdminAccessBtn) {
        mobileAdminAccessBtn.addEventListener('click', () => {
            window.location.href = 'admin-access.html';
        });
    }

    const sidebarAdminAccessBtn = document.getElementById('sidebar-admin-access-btn');
    if (sidebarAdminAccessBtn) {
        sidebarAdminAccessBtn.addEventListener('click', () => {
            window.location.href = 'admin-access.html';
        });
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            await logoutUser();
            window.location.href = 'index.html';
        });
    }
    const mobileLogoutButton = document.getElementById('mobile-logout-button');
    if (mobileLogoutButton) {
        mobileLogoutButton.addEventListener('click', async () => {
            await logoutUser();
            window.location.href = 'index.html';
        });
    }

    const sidebarLogoutButton = document.getElementById('sidebar-logout-button');
    if (sidebarLogoutButton) {
        sidebarLogoutButton.addEventListener('click', async () => {
            await logoutUser();
            window.location.href = 'index.html';
        });
    }
    // --- Gallery Page Logic ---
    const galleryGrid = document.getElementById('gallery-grid');
    if (galleryGrid) {
        const highlightedPhotoSection = document.getElementById('highlighted-photo');
        const categoryFilter = document.getElementById('category-filter');
        const openModalBtn = document.getElementById('open-submission-modal');
        const closeModalBtn = document.getElementById('close-modal');
        const submissionModal = document.getElementById('submission-modal');
        const submissionForm = document.getElementById('submission-form');
        const formMessage = document.getElementById('form-message');



        let allPhotos = [];

        const renderGallery = (photos) => {
            galleryGrid.innerHTML = '';
            if (photos.length === 0) {
                galleryGrid.innerHTML = `<p class="text-gray-500">No photos found for this category.</p>`;
                return;
            }
            photos.forEach(photo => {
                const photoCard = document.createElement('div');
                photoCard.className = 'bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-200';
                photoCard.innerHTML = `
                     <div class="relative">
                         <img src="${photo.imageUrl}" alt="${photo.caption}" class="w-full h-64 object-cover" loading="lazy" data-fullsize="${photo.fullSizeUrl || photo.imageUrl}">
                     </div>
                     <div class="p-4">
                         <p class="font-semibold mb-2">${photo.caption}</p>
                         <p class="text-sm text-gray-500">${photo.category}</p>
                         <p class="text-xs text-gray-400">By ${photo.uploaderName}</p>
                     </div>
                 `;

                // Add click event for fullscreen view
                photoCard.addEventListener('click', () => {
                    openFullscreenView(photo);
                });

                galleryGrid.appendChild(photoCard);
            });
        };

        let currentSlideIndex = 0;
        let slideshowInterval;

        const loadPhotos = async () => {
            const result = await getGalleryPhotos();
            if (result.success) {
                allPhotos = result.photos;
                renderGallery(allPhotos);
                loadHighlightedSlideshow();
            }
        };

        const loadHighlightedSlideshow = async () => {
            const result = await getHighlightedPhotos();
            if (result.success && result.photos.length > 0) {
                const highlightedPhotos = result.photos;

                // Clear existing interval
                if (slideshowInterval) {
                    clearInterval(slideshowInterval);
                }

                // Function to show current slide
                const showSlide = (index) => {
                    const photo = highlightedPhotos[index];
                    highlightedPhotoSection.innerHTML = `
                        <div class="relative">
                            <div class="cursor-pointer transform hover:scale-105 transition-transform duration-200" onclick="openFullscreenView(${JSON.stringify(photo)})">
                                <img src="${photo.imageUrl}" alt="${photo.caption}" class="w-full h-96 object-cover rounded-xl">
                                ${highlightedPhotos.length > 1 ? `
                                    <div class="absolute top-4 right-4 flex space-x-2">
                                        ${highlightedPhotos.map((_, i) => `
                                            <div class="w-3 h-3 rounded-full ${i === index ? 'bg-white' : 'bg-white bg-opacity-50'}"></div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                            <div class="mt-4 text-center">
                                <h3 class="text-2xl font-bold text-gray-800 mb-2">${photo.caption}</h3>
                                <p class="text-lg text-gray-600">${photo.category}</p>
                                <p class="text-sm text-gray-500 mt-1">By ${photo.uploaderName}</p>
                            </div>
                        </div>
                    `;
                };

                // Show first slide
                showSlide(0);

                // Auto-advance slideshow every 5 seconds if multiple photos
                if (highlightedPhotos.length > 1) {
                    slideshowInterval = setInterval(() => {
                        currentSlideIndex = (currentSlideIndex + 1) % highlightedPhotos.length;
                        showSlide(currentSlideIndex);
                    }, 5000);
                }
            } else {
                // Show first photo as fallback if no highlighted photos
                if (allPhotos.length > 0) {
                    highlightedPhotoSection.innerHTML = `
                        <div class="relative">
                            <div class="cursor-pointer transform hover:scale-105 transition-transform duration-200" onclick="openFullscreenView(${JSON.stringify(allPhotos[0])})">
                                <img src="${allPhotos[0].imageUrl}" alt="${allPhotos[0].caption}" class="w-full h-96 object-cover rounded-xl">
                            </div>
                            <div class="mt-4 text-center">
                                <h3 class="text-2xl font-bold text-gray-800 mb-2">${allPhotos[0].caption}</h3>
                                <p class="text-lg text-gray-600">${allPhotos[0].category}</p>
                                <p class="text-sm text-gray-500 mt-1">By ${allPhotos[0].uploaderName}</p>
                            </div>
                        </div>
                    `;
                }
            }
        };



        categoryFilter.addEventListener('change', () => {
            const category = categoryFilter.value;
            if (category === 'all') {
                renderGallery(allPhotos);
            } else {
                const filteredPhotos = allPhotos.filter(p => p.category === category);
                renderGallery(filteredPhotos);
            }
        });

        openModalBtn.addEventListener('click', () => submissionModal.classList.remove('hidden'));
        closeModalBtn.addEventListener('click', () => submissionModal.classList.add('hidden'));



        submissionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = submissionForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;

            // Disable form and show loading state
            submitButton.disabled = true;
            submitButton.textContent = 'Uploading...';
            formMessage.textContent = 'Uploading...';

            const caption = document.getElementById('caption').value;
            const category = document.getElementById('photo-category').value;
            const file = document.getElementById('photo-upload').files[0];

            if (!file) {
                formMessage.textContent = 'Please select a photo.';
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                return;
            }

            if (!category) {
                formMessage.textContent = 'Please select a category.';
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                return;
            }

            // Check file size (10MB limit)
            const maxSize = 10 * 1024 * 1024; // 10MB in bytes
            if (file.size > maxSize) {
                formMessage.textContent = 'File is too large. Please select an image under 10MB.';
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                return;
            }

            try {
                const result = await submitPhotoForReview(caption, category, file);
                if (result.success) {
                    formMessage.textContent = 'Photo added to gallery!';
                    submitButton.textContent = 'Success!';
                    setTimeout(() => {
                        submissionModal.classList.add('hidden');
                        formMessage.textContent = '';
                        submissionForm.reset();
                        submitButton.disabled = false;
                        submitButton.textContent = originalButtonText;
                        loadPhotos(); // Refresh the gallery to show the new photo
                    }, 2000);
                } else {
                    formMessage.textContent = result.error;
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
            } catch (error) {
                console.error('Upload error:', error);
                formMessage.textContent = 'Upload failed. Please try again.';
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });



        loadPhotos();
    }

    // Fullscreen view function
    window.openFullscreenView = function (photo) {
        const fullscreenModal = document.createElement('div');
        fullscreenModal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
        fullscreenModal.innerHTML = `
            <div class="relative max-w-4xl max-h-full p-4">
                <button onclick="this.parentElement.parentElement.remove()" class="absolute top-2 right-2 text-white text-2xl font-bold bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75">×</button>
                <img src="${photo.fullSizeUrl || photo.imageUrl}" alt="${photo.caption}" class="max-w-full max-h-full object-contain">
            </div>
        `;

        // Close on background click
        fullscreenModal.addEventListener('click', (e) => {
            if (e.target === fullscreenModal) {
                fullscreenModal.remove();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                fullscreenModal.remove();
                document.removeEventListener('keydown', closeOnEscape);
            }
        });

        document.body.appendChild(fullscreenModal);
    };

    // Toggle highlight function
    window.toggleHighlight = async function (photoId, isHighlighted) {
        const result = await togglePhotoHighlight(photoId, isHighlighted);
        if (result.success) {
            // Reload photos to update the UI
            loadPhotos();
        } else {
            alert('Failed to update photo status. Please try again.');
        }
    };
    // --- Admin Page Logic ---
    const adminContent = document.getElementById('admin-content');
    if (adminContent) {
        const loadingMessage = document.getElementById('loading-message');
        const pendingPostsContainer = document.getElementById('pending-posts-container');

        const displayPendingPosts = async () => {
            console.log("Fetching pending posts...");
            const result = await getPendingPosts();
            console.log("Pending posts result:", result);
            
            pendingPostsContainer.innerHTML = ''; // Clear loader

            if (result.success && result.posts.length > 0) {
                console.log("Displaying", result.posts.length, "pending posts");
                result.posts.forEach(post => {
                    const postElement = document.createElement('div');
                    postElement.className = 'flex justify-between items-center p-4 border rounded-lg bg-gray-50';
                    postElement.innerHTML = `
                        <div>
                            <p class="font-bold text-lg">${post.title}</p>
                            <p class="text-sm text-gray-500">By: ${post.authorName}</p>
                        </div>
                        <div class="flex space-x-2">
                            <button data-id="${post.id}" class="approve-btn bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold hover:bg-green-600">Approve</button>
                            <button data-id="${post.id}" class="reject-btn bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold hover:bg-red-600">Reject</button>
                        </div>
                    `;
                    pendingPostsContainer.appendChild(postElement);
                });
            } else {
                console.log("No pending posts or error:", result.error);
                pendingPostsContainer.innerHTML = '<p class="text-gray-500">There are no posts awaiting review.</p>';
            }

            // Add event listeners to the new buttons
            document.querySelectorAll('.approve-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const postId = e.target.dataset.id;
                    await updatePostStatus(postId, 'approved');
                    displayPendingPosts(); // Refresh the list
                });
            });

            document.querySelectorAll('.reject-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const postId = e.target.dataset.id;
                    await updatePostStatus(postId, 'rejected');
                    displayPendingPosts(); // Refresh the list
                });
            });
        };

        const checkAdminAndLoad = async () => {
            console.log("Checking admin status...");
            
            // Check for secure access first
            const hasSecureAccess = checkSecureAdminAccess();
            console.log("Secure access check:", hasSecureAccess);
            
            if (hasSecureAccess) {
                console.log("✅ Secure admin access granted");
                loadingMessage.style.display = 'none';
                adminContent.style.display = 'block';
                displayPendingPosts();
                return;
            }
            
            // TEMPORARY: Force admin access for testing
            const forceAdmin = false; // Set this to false to restore normal admin checking
            
            if (forceAdmin) {
                console.log("🔧 TEMPORARY: Bypassing admin check for testing");
                loadingMessage.style.display = 'none';
                adminContent.style.display = 'block';
                displayPendingPosts();
                return;
            }
            
            // Try the simple test first
            const testResult = await testAdminStatus();
            console.log("Test admin result:", testResult);
            
            const isAdmin = typeof checkUserAdminStatus === 'function' ? await checkUserAdminStatus() : false;
            console.log("Admin status result:", isAdmin);
            
            if (isAdmin) {
                console.log("Admin access granted, loading dashboard...");
                loadingMessage.style.display = 'none';
                adminContent.style.display = 'block';
                displayPendingPosts();
            } else {
                console.log("Admin access denied");
                loadingMessage.innerHTML = '<p class="text-lg text-red-500">Access Denied. You must be an administrator to view this page.</p>';
            }
        };

        onAuthStateChange(user => {
            if (user) {
                checkAdminAndLoad();
            } else {
                // If no user is logged in, redirect to the login page
                window.location.href = 'login.html';
            }
        });
    }
    const displayApprovedPostsAdmin = async () => {
        const result = await getApprovedPosts();
        approvedPostsContainer.innerHTML = ''; // Clear loader

        if (result.success && result.posts.length > 0) {
            result.posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'flex justify-between items-center p-4 border rounded-lg bg-white';

                const featureButtonText = post.isFeatured ? 'Unfeature' : 'Feature';
                const featureButtonClass = post.isFeatured ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600';

                postElement.innerHTML = `
                        <div>
                            <p class="font-bold text-lg">${post.title}</p>
                            <p class="text-sm text-gray-500">By: ${post.authorName}</p>
                        </div>
                        <div class="flex space-x-2">
                            <button data-id="${post.id}" data-featured="${post.isFeatured}" class="feature-btn ${featureButtonClass} text-white px-3 py-1 rounded-full text-sm font-semibold">${featureButtonText}</button>
                        </div>
                    `;
                approvedPostsContainer.appendChild(postElement);
            });
        } else {
            approvedPostsContainer.innerHTML = '<p class="text-gray-500">There are no approved posts to feature.</p>';
        }

        // Add event listeners to the new feature buttons
        document.querySelectorAll('.feature-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const postId = e.target.dataset.id;
                const isCurrentlyFeatured = e.target.dataset.featured === 'true';
                await toggleFeaturedStatus(postId, !isCurrentlyFeatured);
                displayApprovedPostsAdmin(); // Refresh the list
            });
        });
    };
});
