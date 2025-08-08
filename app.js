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
    
    // --- Quill Editor Initialization ---
    // Note: Quill is now initialized in write.html after DOM is ready
    // This ensures proper loading order and availability

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
        // Wait for Quill to be ready if it's needed
        if (document.getElementById('editor-container')) {
            window.addEventListener('quillReady', function() {
                initializePostForm();
            });
        } else {
            // No editor on this page, initialize form normally
            initializePostForm();
        }
    }
    
    function initializePostForm() {
        console.log('initializePostForm called');
        const postForm = document.getElementById('post-form');
        if (!postForm) {
            console.error('Post form not found');
            return;
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
                    if (window.quill) {
                        window.quill.root.innerHTML = post.content;
                    }
                } else {
                    document.getElementById('form-message').textContent = result.error;
                }
            };
            loadPostForEditing();
        }
        
        // Remove any existing event listeners to prevent duplicates
        const newPostForm = postForm.cloneNode(true);
        postForm.parentNode.replaceChild(newPostForm, postForm);
        
        newPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Form submission started');
            const formMessage = document.getElementById('form-message');
            
            // Check if user is authenticated
            const user = auth.currentUser;
            if (!user) {
                formMessage.textContent = 'You must be logged in to submit a post.';
                return;
            }
            
            // Better content validation
            let hasContent = false;
            if (window.quill) {
                const content = window.quill.root.innerHTML;
                const textContent = window.quill.getText().trim();
                console.log('Quill content length:', window.quill.getLength());
                console.log('Quill text content:', textContent);
                console.log('Quill HTML content:', content);
                
                // Check if there's actual text content (not just empty paragraphs)
                hasContent = textContent.length > 0 && content !== '<p><br></p>' && content !== '<p></p>';
            }
            
            if (!hasContent) {
                formMessage.textContent = 'Please write some content for your post.';
                return;
            }
            
            formMessage.textContent = 'Submitting...';
            console.log('Preparing post data...');
            
            const postData = {
                title: document.getElementById('post-title').value,
                description: document.getElementById('post-description').value,
                photoUrl: document.getElementById('post-photo').value,
                genre: document.getElementById('post-genre').value,
                tags: document.getElementById('post-tags').value,
                content: window.quill.root.innerHTML
            };
            
            console.log('Post data prepared:', postData);
            
            let result;
            const postId = document.getElementById('post-id').value;
            if (postId) {
                console.log('Updating existing post:', postId);
                result = await updatePost(postId, postData);
            } else {
                console.log('Creating new post');
                result = await createPost(postData);
            }
            
            console.log('Post operation result:', result);
            
            if (result.success) {
                formMessage.textContent = 'Post submitted successfully!';
                setTimeout(() => { window.location.href = 'profile.html'; }, 2000);
            } else {
                formMessage.textContent = result.error;
            }
        });
        
        console.log('Post form initialized successfully');
    } // End of initializePostForm function
    
    // Make the function globally available
    window.initializePostForm = initializePostForm;

    // --- Profile Page Logic (Legacy - only for old profile pages) ---
    const profileForm = document.getElementById('profile-form');
    const displayNameInput = document.getElementById('display-name'); // Check for old profile page
    if (profileForm && displayNameInput) {
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
                if (displayNameInput) displayNameInput.value = profile.displayName || '';
                if (userEmailInput) userEmailInput.value = profile.email || '';
                if (userBioInput) userBioInput.value = profile.bio || '';
                if (profile.photoURL && profilePicImg) {
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
                if (typeof loadProfileData === 'function') {
                    loadProfileData(user);
                }
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
                // Filter out featured posts and limit to 3 posts
                const nonFeaturedPosts = result.posts.filter(post => !post.isFeatured);
                const limitedPosts = nonFeaturedPosts.slice(0, 3);
                
                limitedPosts.forEach(post => {
                    const postCard = document.createElement('div');
                    postCard.className = 'bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300';
                    const postDate = post.createdAt ? post.createdAt.toDate().toLocaleDateString() : 'N/A';
                    postCard.innerHTML = `
                        <a href="post.html?id=${post.id}"><img class="h-48 w-full object-cover" src="${post.photoUrl || 'https://placehold.co/600x400/E2E8F0/4A5568?text=GIKI+Blog'}" alt="${post.title}"></a>
                        <div class="p-6">
                            <p class="text-sm text-gray-500 mb-2">${postDate} • by <a href="profile.html?user=${post.authorId}" class="text-blue-600 hover:text-blue-800 font-medium">${post.authorName}</a></p>
                            <h4 class="text-xl font-semibold mb-3">${post.title}</h4>
                            <p class="text-gray-600 text-sm mb-4">${post.description || ''}</p>
                            <a href="post.html?id=${post.id}" class="font-semibold text-blue-600 hover:underline">Read More &rarr;</a>
                        </div>`;
                    recentPostsGrid.appendChild(postCard);
                });
                
                // Add "View More" button if there are more than 3 posts
                if (nonFeaturedPosts.length > 3) {
                    const viewMoreContainer = document.createElement('div');
                    viewMoreContainer.className = 'col-span-full flex justify-center mt-8';
                    viewMoreContainer.innerHTML = `
                        <a href="browse.html" class="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition duration-300 font-semibold shadow-lg transform hover:-translate-y-1">
                            View More Posts
                        </a>
                    `;
                    recentPostsGrid.appendChild(viewMoreContainer);
                }
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
                document.getElementById('post-meta').innerHTML = `Posted by <a href="profile.html?user=${post.authorId}" class="text-blue-600 hover:text-blue-800 font-medium">${post.authorName}</a> on ${postDate}`;
                if (post.photoUrl) {
                    document.getElementById('post-image').src = post.photoUrl;
                } else {
                    document.getElementById('post-image').style.display = 'none';
                }
                document.getElementById('post-content').innerHTML = post.content;
                
                // Initialize comments and reactions for this post
                if (typeof initializeCommentsAndReactions === 'function') {
                    initializeCommentsAndReactions(postId);
                }
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
        const pendingGalleryContainer = document.getElementById('pending-gallery-container');

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
                        <div class="flex-1">
                            <p class="font-bold text-lg">${post.title}</p>
                            <p class="text-sm text-gray-500">By: ${post.authorName}</p>
                            <p class="text-sm text-gray-600 mt-1">${post.description || 'No description provided'}</p>
                            <p class="text-xs text-gray-400 mt-1">Genre: ${post.genre || 'General'}</p>
                        </div>
                        <div class="flex space-x-2">
                            <button data-id="${post.id}" class="view-content-btn bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold hover:bg-blue-600">View Content</button>
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
            document.querySelectorAll('.view-content-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const postId = e.target.dataset.id;
                    await showPostContent(postId);
                });
            });

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

        // Function to show full post content in modal
        const showPostContent = async (postId) => {
            try {
                console.log("Fetching full post content for ID:", postId);
                
                // Get the post document from Firestore
                const postDoc = await db.collection("posts").doc(postId).get();
                
                if (!postDoc.exists) {
                    alert("Post not found");
                    return;
                }
                
                const post = postDoc.data();
                const modal = document.getElementById('post-content-modal');
                const contentContainer = document.getElementById('modal-post-content');
                
                // Generate full post HTML
                const postHTML = generateFullPostHTML(post, postId);
                contentContainer.innerHTML = postHTML;
                
                // Set up modal action buttons
                setupModalActions(postId);
                
                // Set up close functionality
                setupModalCloseHandlers();
                
                // Show modal
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden'; // Prevent background scrolling
                
            } catch (error) {
                console.error("Error fetching post content:", error);
                alert("Error loading post content");
            }
        };

        // Generate full post HTML for modal display
        function generateFullPostHTML(post, postId) {
            const tagsHTML = post.tags && post.tags.length > 0 
                ? `<div class="flex flex-wrap gap-2 mb-6">
                     ${post.tags.map(tag => `<span class="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">${tag}</span>`).join('')}
                   </div>`
                : '';

            const photoHTML = post.photoUrl 
                ? `<div class="mb-8">
                     <img src="${post.photoUrl}" alt="${post.title}" class="w-full h-64 object-cover rounded-lg shadow-lg">
                   </div>`
                : '';

            const descriptionHTML = post.description 
                ? `<div class="mb-8 text-xl text-gray-600 font-light leading-relaxed">
                     ${post.description}
                   </div>`
                : '';

            const submittedDate = post.submittedAt ? new Date(post.submittedAt.seconds * 1000).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Unknown date';

            return `
                <div class="max-w-4xl mx-auto">
                    <!-- Post Header -->
                    <div class="mb-8">
                        <div class="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-semibold">PENDING REVIEW</span>
                            <span>•</span>
                            <span class="bg-gray-100 px-3 py-1 rounded-full">${post.genre || 'General'}</span>
                            <span>•</span>
                            <span>Submitted: ${submittedDate}</span>
                            <span>•</span>
                            <span>By: ${post.authorName || 'Unknown Author'}</span>
                        </div>
                        
                        <h1 class="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
                            ${post.title}
                        </h1>
                        
                        ${descriptionHTML}
                        ${tagsHTML}
                    </div>

                    <!-- Featured Image -->
                    ${photoHTML}

                    <!-- Post Content -->
                    <div class="prose prose-lg max-w-none">
                        ${post.content || '<p class="text-gray-500 italic">No content provided</p>'}
                    </div>

                    <!-- Admin Notes -->
                    <div class="mt-12 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div class="flex items-start">
                            <svg class="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div>
                                <span class="text-blue-800 font-medium">Admin Review</span>
                                <p class="text-blue-700 text-sm mt-1">This post is pending approval. Review the content for quality, appropriateness, and adherence to community guidelines before approving.</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Setup modal action buttons
        function setupModalActions(postId) {
            const approveBtn = document.getElementById('modal-approve-btn');
            const rejectBtn = document.getElementById('modal-reject-btn');
            
            // Remove existing listeners
            approveBtn.replaceWith(approveBtn.cloneNode(true));
            rejectBtn.replaceWith(rejectBtn.cloneNode(true));
            
            // Get fresh references
            const newApproveBtn = document.getElementById('modal-approve-btn');
            const newRejectBtn = document.getElementById('modal-reject-btn');
            
            newApproveBtn.addEventListener('click', async () => {
                await updatePostStatus(postId, 'approved');
                window.closePostModal();
                displayPendingPosts(); // Refresh the list
            });
            
            newRejectBtn.addEventListener('click', async () => {
                const confirm = window.confirm('Are you sure you want to reject this post?');
                if (confirm) {
                    await updatePostStatus(postId, 'rejected');
                    window.closePostModal();
                    displayPendingPosts(); // Refresh the list
                }
            });
        }

        // Close post modal (global function)
        window.closePostModal = function() {
            const modal = document.getElementById('post-content-modal');
            if (modal) {
                modal.classList.add('hidden');
                document.body.style.overflow = ''; // Restore scrolling
                console.log('Modal closed');
            }
        }

        // Setup modal close handlers
        function setupModalCloseHandlers() {
            const closeBtn = document.getElementById('close-post-modal');
            const modal = document.getElementById('post-content-modal');
            
            if (closeBtn) {
                // Remove any existing listeners and add new one
                closeBtn.replaceWith(closeBtn.cloneNode(true));
                const newCloseBtn = document.getElementById('close-post-modal');
                newCloseBtn.addEventListener('click', window.closePostModal);
                console.log('Close button listener attached');
            }
            
            if (modal) {
                // Close on overlay click
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        window.closePostModal();
                    }
                });
                
                // Close on Escape key (attach to document)
                document.addEventListener('keydown', handleEscapeKey);
            }
        }
        
        // Handle escape key for modal
        function handleEscapeKey(e) {
            if (e.key === 'Escape') {
                const modal = document.getElementById('post-content-modal');
                if (modal && !modal.classList.contains('hidden')) {
                    window.closePostModal();
                }
            }
        }

        const displayPendingEvents = async () => {
            console.log("Fetching pending events...");
            const result = await getPendingEvents();
            console.log("Pending events result:", result);
            
            const pendingEventsContainer = document.getElementById('pending-events-container');
            if (!pendingEventsContainer) {
                console.error("Pending events container not found");
                return;
            }
            
            pendingEventsContainer.innerHTML = ''; // Clear loader

            if (result.success && result.events.length > 0) {
                console.log("Displaying", result.events.length, "pending events");
                result.events.forEach(event => {
                    const eventElement = document.createElement('div');
                    eventElement.className = 'flex justify-between items-center p-4 border rounded-lg bg-gray-50';
                    eventElement.innerHTML = `
                        <div>
                            <p class="font-bold text-lg">${event.name}</p>
                            <p class="text-sm text-gray-500">Date: ${event.date} ${event.time ? `at ${event.time}` : ''}</p>
                            <p class="text-sm text-gray-500">Type: ${event.type} | Location: ${event.location}</p>
                            <p class="text-sm text-gray-600">${event.description}</p>
                        </div>
                        <div class="flex space-x-2">
                            <button data-id="${event.id}" class="approve-event-btn bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold hover:bg-green-600">Approve</button>
                            <button data-id="${event.id}" class="reject-event-btn bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold hover:bg-red-600">Reject</button>
                        </div>
                    `;
                    pendingEventsContainer.appendChild(eventElement);
                });
            } else {
                console.log("No pending events or error:", result.error);
                pendingEventsContainer.innerHTML = '<p class="text-gray-500">There are no events awaiting review.</p>';
            }

            // Add event listeners to the new buttons
            document.querySelectorAll('.approve-event-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const eventId = e.target.dataset.id;
                    await updateEventStatus(eventId, 'approved');
                    displayPendingEvents(); // Refresh the list
                });
            });

            document.querySelectorAll('.reject-event-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const eventId = e.target.dataset.id;
                    await updateEventStatus(eventId, 'rejected');
                    displayPendingEvents(); // Refresh the list
                });
            });
        };

        const displayPendingGallery = async () => {
            if (!pendingGalleryContainer) return;
            const result = await getPendingGalleryPhotos();
            pendingGalleryContainer.innerHTML = '';

            if (result.success && result.photos.length > 0) {
                result.photos.forEach(photo => {
                    const el = document.createElement('div');
                    el.className = 'p-4 border rounded-lg bg-gray-50';
                    el.innerHTML = `
                        <div class="flex items-start gap-4">
                            <img src="${photo.imageUrl}" alt="${photo.caption || ''}" class="w-24 h-24 object-cover rounded"/>
                            <div class="flex-1">
                                <p class="font-semibold">${photo.caption || 'Untitled'}</p>
                                <p class="text-sm text-gray-500">Category: ${photo.category || 'General'} | By: ${photo.uploaderName || ''}</p>
                            </div>
                        </div>
                        <div class="mt-3 flex items-center gap-2">
                            <label class="inline-flex items-center text-sm text-gray-700 gap-2">
                                <input type="checkbox" class="highlight-toggle" data-id="${photo.id}"> Highlight in slideshow
                            </label>
                            <div class="ml-auto flex gap-2">
                                <button data-id="${photo.id}" class="approve-photo-btn bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold hover:bg-green-600">Approve</button>
                                <button data-id="${photo.id}" class="reject-photo-btn bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold hover:bg-red-600">Reject</button>
                            </div>
                        </div>
                    `;
                    pendingGalleryContainer.appendChild(el);
                });

                // Approve
                pendingGalleryContainer.querySelectorAll('.approve-photo-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const id = e.currentTarget.dataset.id;
                        const chk = e.currentTarget.closest('div').querySelector('.highlight-toggle');
                        const highlight = chk ? chk.checked : false;
                        await updateGalleryPhotoStatus(id, 'approved', { isHighlighted: highlight });
                        displayPendingGallery();
                    });
                });
                // Reject
                pendingGalleryContainer.querySelectorAll('.reject-photo-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const id = e.currentTarget.dataset.id;
                        await updateGalleryPhotoStatus(id, 'rejected');
                        displayPendingGallery();
                    });
                });
            } else {
                pendingGalleryContainer.innerHTML = '<p class="text-gray-500">There are no gallery photos awaiting review.</p>';
            }
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
                displayPendingEvents();
                displayPendingGallery();
                return;
            }
            
            // TEMPORARY: Force admin access for testing
            const forceAdmin = false; // Set this to false to restore normal admin checking
            
            if (forceAdmin) {
                console.log("🔧 TEMPORARY: Bypassing admin check for testing");
                loadingMessage.style.display = 'none';
                adminContent.style.display = 'block';
                displayPendingPosts();
                displayPendingEvents();
                displayPendingGallery();
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
                displayPendingEvents();
                displayPendingGallery();
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

    // --- Theme Management ---
    const themeSelect = document.getElementById('theme-select');

    // Always apply saved theme on load, even if there's no dropdown on this page
            const savedTheme = localStorage.getItem('selected-theme') || 'basic-dark';
    applyTheme(savedTheme);

    if (themeSelect) {
        // Sync dropdown with saved theme
        themeSelect.value = savedTheme;

        // Add event listener for theme changes
        themeSelect.addEventListener('change', (e) => {
            const selectedTheme = e.target.value;
            localStorage.setItem('selected-theme', selectedTheme);
            applyTheme(selectedTheme);
        });
    }

    // Function to apply theme
    function applyTheme(themeName) {
        // Remove all existing theme classes
        document.body.classList.remove('theme-basic-light', 'theme-basic-dark', 'theme-giki');
        
        // Add the selected theme class
        document.body.classList.add(`theme-${themeName}`);
        
        // Update the GIKI Chronicles logo color based on theme
        const logoElement = document.querySelector('a[href="index.html"]');
        if (logoElement) {
            const logoText = logoElement.innerHTML;
            if (logoText.includes('GIKI<span class="text-blue-600">Chronicles</span>')) {
                // Update the blue color in the logo to match the theme
                const newLogoText = logoText.replace('text-blue-600', `text-[${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}]`);
                logoElement.innerHTML = newLogoText;
            }
        }
    }
});
