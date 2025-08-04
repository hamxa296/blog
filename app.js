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

    // --- Post Form Logic (Handles both Create and Edit) ---
    const postForm = document.getElementById('post-form');
    if (postForm) {
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
                result = await updatePost(postId, postData);
            } else {
                result = await createPost(postData);
            }
            if (result.success) {
                formMessage.textContent = 'Post submitted successfully!';
                setTimeout(() => { window.location.href = 'profile.html'; }, 2000);
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

    // --- Dynamic Navigation Bar & Logout Logic ---
    onAuthStateChange(user => {
        const userNav = document.getElementById('user-nav');
        const guestNav = document.getElementById('guest-nav');
        const mobileUserNav = document.getElementById('mobile-user-nav');
        const mobileGuestNav = document.getElementById('mobile-guest-nav');
        if (user) {
            if (userNav) userNav.style.display = 'flex';
            if (guestNav) guestNav.style.display = 'none';
            if (mobileUserNav) mobileUserNav.style.display = 'block';
            if (mobileGuestNav) mobileGuestNav.style.display = 'none';
        } else {
            if (userNav) userNav.style.display = 'none';
            if (guestNav) guestNav.style.display = 'flex';
            if (mobileUserNav) mobileUserNav.style.display = 'none';
            if (mobileGuestNav) mobileGuestNav.style.display = 'block';
        }
    });

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
});
