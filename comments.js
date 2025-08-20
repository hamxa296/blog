/**
 * comments.js
 * This file contains functions for handling comments and reactions on blog posts.
 */

/*
    FIRESTORE DATABASE STRUCTURE:
    
    'comments' collection:
    - postId (string): ID of the blog post
    - authorId (string): User ID of the commenter
    - authorName (string): Display name of the commenter
    - text (string): Comment content
    - createdAt (timestamp): When the comment was posted
    - status (string): "approved" or "pending" (for moderation if needed)
    - parentId (string, optional): ID of parent comment for replies
    - replyCount (number): Number of replies to this comment
    
    'reactions' collection:
    - postId (string): ID of the blog post
    - userId (string): User ID who reacted
    - type (string): "like", "heart", "celebrate", "insightful"
    - createdAt (timestamp): When the reaction was made
    
    'bookmarks' collection:
    - userId (string): User ID who bookmarked
    - postId (string): ID of the bookmarked post
    - createdAt (timestamp): When the bookmark was made
    
    'userProfiles' collection:
    - userId (string): User ID (document ID)
    - bio (string): User biography
    - profilePicture (string): URL to profile picture
    - joinedAt (timestamp): When user joined
    - stats (object): { postsCount, commentsCount, reactionsReceived }
    - socialLinks (object): { website, twitter, linkedin, github }
*/

// Current post ID (will be set when page loads)
let currentPostId = null;

// Ensure Firebase is initialized before using auth and db
if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) {
    console.error('Firebase not initialized. Comments functionality will not work.');
}

// Ensure auth and db are available
if (typeof auth === 'undefined' || typeof db === 'undefined') {
    console.error('Firebase auth or db not available. Comments functionality will not work.');
}

/**
 * Adds a comment or reply to a blog post
 */
async function addComment(postId, commentText, parentId = null) {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: "You must be logged in to comment." };
    }

    if (!commentText.trim()) {
        return { success: false, error: "Comment cannot be empty." };
    }

    try {
        const newComment = {
            postId: postId,
            authorId: user.uid,
            authorName: user.displayName || user.email,
            text: commentText.trim(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: "approved", // Auto-approve for now, can add moderation later
            replyCount: 0
        };

        // Add parentId if this is a reply
        if (parentId) {
            newComment.parentId = parentId;
        }

        const docRef = await db.collection("comments").add(newComment);

        // If this is a reply, update the parent comment's reply count
        if (parentId) {
            await db.collection("comments").doc(parentId).update({
                replyCount: firebase.firestore.FieldValue.increment(1)
            });
        }

        // Update user's comment count in their profile stats
        try {
            const currentStats = await calculateUserStats(user.uid);
            if (currentStats.success) {
                await updateUserStats(user.uid, currentStats.stats);
            }
        } catch (error) {
            // Stats update failed, but comment was posted successfully
        }

        return { success: true, message: parentId ? "Reply posted successfully!" : "Comment posted successfully!" };

    } catch (error) {
        console.error("Error adding comment:", error);
        return { success: false, error: "Failed to post comment." };
    }
}

/**
 * Gets all approved comments for a specific post, organized by threading
 */
async function getCommentsForPost(postId) {
    try {
        const snapshot = await db.collection("comments")
            .where("postId", "==", postId)
            .where("status", "==", "approved")
            .orderBy("createdAt", "desc")
            .limit(50) // Limit to prevent performance issues
            .get();

        const allComments = [];
        snapshot.forEach(doc => {
            allComments.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Organize into parent comments and replies
        const parentComments = allComments.filter(comment => !comment.parentId);
        const replies = allComments.filter(comment => comment.parentId);

        // Group replies by parent ID
        const repliesByParent = {};
        replies.forEach(reply => {
            if (!repliesByParent[reply.parentId]) {
                repliesByParent[reply.parentId] = [];
            }
            repliesByParent[reply.parentId].push(reply);
        });

        // Sort replies within each parent (oldest first for replies)
        Object.keys(repliesByParent).forEach(parentId => {
            repliesByParent[parentId].sort((a, b) => {
                const aTime = a.createdAt ? a.createdAt.seconds : 0;
                const bTime = b.createdAt ? b.createdAt.seconds : 0;
                return aTime - bTime; // Oldest first for replies
            });
        });

        return { success: true, comments: parentComments, replies: repliesByParent };

    } catch (error) {
        console.error("Error fetching comments:", error);
        return { success: false, error: "Failed to load comments." };
    }
}

/**
 * Deletes a comment (only by author or admin)
 */
async function deleteComment(commentId) {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: "You must be logged in." };
    }

    try {
        // Get the comment to check ownership
        const commentDoc = await db.collection("comments").doc(commentId).get();
        if (!commentDoc.exists) {
            return { success: false, error: "Comment not found." };
        }

        const commentData = commentDoc.data();
        const isAuthor = commentData.authorId === user.uid;
        const isAdmin = typeof isUserAdmin === 'function' ? await isUserAdmin() : false;

        if (!isAuthor && !isAdmin) {
            return { success: false, error: "You can only delete your own comments." };
        }

        await db.collection("comments").doc(commentId).delete();
        return { success: true, message: "Comment deleted successfully!" };

    } catch (error) {
        console.error("Error deleting comment:", error);
        return { success: false, error: "Failed to delete comment." };
    }
}

/**
 * Toggles a reaction on a blog post
 */
async function toggleReaction(postId, reactionType) {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: "You must be logged in to react." };
    }

    try {
        // Check if user already has this reaction
        const existingReaction = await db.collection("reactions")
            .where("postId", "==", postId)
            .where("userId", "==", user.uid)
            .where("type", "==", reactionType)
            .get();

        if (!existingReaction.empty) {
            // Remove existing reaction
            const reactionDoc = existingReaction.docs[0];
            await db.collection("reactions").doc(reactionDoc.id).delete();
            
            return { success: true, action: "removed", message: "Reaction removed!" };
        } else {
            // Add new reaction
            const newReaction = {
                postId: postId,
                userId: user.uid,
                type: reactionType,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection("reactions").add(newReaction);
            
            return { success: true, action: "added", message: "Reaction added!" };
        }

    } catch (error) {
        console.error("Error toggling reaction:", error);
        return { success: false, error: "Failed to update reaction." };
    }
}

/**
 * Gets reaction counts for a specific post
 */
async function getReactionsForPost(postId) {
    try {
        const snapshot = await db.collection("reactions")
            .where("postId", "==", postId)
            .get();

        const reactions = {
            like: 0,
            heart: 0,
            celebrate: 0,
            insightful: 0
        };

        const userReactions = new Set();
        const user = auth.currentUser;

        snapshot.forEach(doc => {
            const data = doc.data();
            reactions[data.type]++;
            
            // Track current user's reactions
            if (user && data.userId === user.uid) {
                userReactions.add(data.type);
            }
        });

        return { success: true, reactions: reactions, userReactions: userReactions };

    } catch (error) {
        console.error("Error fetching reactions:", error);
        return { success: false, error: "Failed to load reactions." };
    }
}

/**
 * Toggles bookmark status for a post
 */
async function toggleBookmark(postId) {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: "You must be logged in to bookmark posts." };
    }

    try {
        // Check if post is already bookmarked
        const existingBookmark = await db.collection("bookmarks")
            .where("userId", "==", user.uid)
            .where("postId", "==", postId)
            .get();

        if (!existingBookmark.empty) {
            // Remove bookmark
            const bookmarkDoc = existingBookmark.docs[0];
            await db.collection("bookmarks").doc(bookmarkDoc.id).delete();
            return { success: true, action: "removed", message: "Bookmark removed!" };
        } else {
            // Add bookmark
            const newBookmark = {
                userId: user.uid,
                postId: postId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection("bookmarks").add(newBookmark);
            return { success: true, action: "added", message: "Post bookmarked!" };
        }

    } catch (error) {
        console.error("Error toggling bookmark:", error);
        return { success: false, error: "Failed to update bookmark." };
    }
}

/**
 * Checks if a post is bookmarked by the current user
 */
async function isPostBookmarked(postId) {
    const user = auth.currentUser;
    if (!user) return false;

    try {
        const snapshot = await db.collection("bookmarks")
            .where("userId", "==", user.uid)
            .where("postId", "==", postId)
            .get();

        return !snapshot.empty;
    } catch (error) {
        console.error("Error checking bookmark status:", error);
        return false;
    }
}

/**
 * Gets all bookmarked posts for a user
 */
async function getUserBookmarks(userId) {
    try {
        const snapshot = await db.collection("bookmarks")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .get();

        const bookmarkIds = [];
        snapshot.forEach(doc => {
            bookmarkIds.push(doc.data().postId);
        });

        return { success: true, bookmarkIds: bookmarkIds };
    } catch (error) {
        console.error("Error fetching bookmarks:", error);
        return { success: false, error: "Failed to load bookmarks." };
    }
}

/**
 * User profile functions
 */

/**
 * Creates or updates user profile
 */
async function updateUserProfile(profileData) {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: "You must be logged in." };
    }

    try {
        const profileRef = db.collection("userProfiles").doc(user.uid);
        const existingProfile = await profileRef.get();

        const profileUpdate = {
            bio: profileData.bio || "",
            socialLinks: profileData.socialLinks || {},
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (!existingProfile.exists) {
            // Create new profile
            profileUpdate.joinedAt = firebase.firestore.FieldValue.serverTimestamp();
            profileUpdate.stats = {
                postsCount: 0,
                commentsCount: 0,
                reactionsReceived: 0
            };
        }

        await profileRef.set(profileUpdate, { merge: true });
        return { success: true, message: "Profile updated successfully!" };

    } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: "Failed to update profile." };
    }
}

/**
 * Gets user profile data
 */
async function getUserProfile(userId) {
    try {
        const profileDoc = await db.collection("userProfiles").doc(userId).get();
        
        if (profileDoc.exists) {
            return { success: true, profile: { id: userId, ...profileDoc.data() } };
        } else {
            // Return default profile if none exists
            return { 
                success: true, 
                profile: {
                    id: userId,
                    bio: "",
                    socialLinks: {},
                    stats: { postsCount: 0, commentsCount: 0, reactionsReceived: 0 },
                    joinedAt: null
                }
            };
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
        return { success: false, error: "Failed to load profile." };
    }
}

/**
 * Gets posts written by a specific user
 */
async function getUserPosts(userId) {
    try {
        const snapshot = await db.collection("posts")
            .where("authorId", "==", userId)
            .where("status", "==", "approved")
            .orderBy("createdAt", "desc")
            .get();

        const posts = [];
        snapshot.forEach(doc => {
            posts.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return { success: true, posts: posts };
    } catch (error) {
        console.error("Error fetching user posts:", error);
        return { success: false, error: "Failed to load user posts." };
    }
}

/**
 * Calculates user statistics from their activity
 */
async function calculateUserStats(userId) {
    try {
        // Count approved posts
        const postsSnapshot = await db.collection("posts")
            .where("authorId", "==", userId)
            .where("status", "==", "approved")
            .get();
        const postsCount = postsSnapshot.size;

        // Count approved comments
        const commentsSnapshot = await db.collection("comments")
            .where("authorId", "==", userId)
            .where("status", "==", "approved")
            .get();
        const commentsCount = commentsSnapshot.size;

        // Count reactions received on user's posts
        let reactionsReceived = 0;
        const userPostIds = [];
        postsSnapshot.forEach(doc => {
            userPostIds.push(doc.id);
        });

        if (userPostIds.length > 0) {
            const reactionsSnapshot = await db.collection("reactions")
                .where("postId", "in", userPostIds)
                .get();
            reactionsReceived = reactionsSnapshot.size;
        }

        return {
            success: true,
            stats: {
                postsCount,
                commentsCount,
                reactionsReceived
            }
        };
    } catch (error) {
        console.error("Error calculating user stats:", error);
        return {
            success: false,
            error: "Failed to calculate stats.",
            stats: { postsCount: 0, commentsCount: 0, reactionsReceived: 0 }
        };
    }
}

/**
 * Updates user profile statistics
 */
async function updateUserStats(userId, stats) {
    try {
        const profileRef = db.collection("userProfiles").doc(userId);
        await profileRef.set({
            stats: stats,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return { success: true, message: "Stats updated successfully!" };
    } catch (error) {
        console.error("Error updating user stats:", error);
        return { success: false, error: "Failed to update stats." };
    }
}

/**
 * Refreshes user statistics by recalculating them
 */
async function refreshUserStats(userId) {
    const statsResult = await calculateUserStats(userId);
    if (statsResult.success) {
        await updateUserStats(userId, statsResult.stats);
        return statsResult.stats;
    }
    return { postsCount: 0, commentsCount: 0, reactionsReceived: 0 };
}

/**
 * Displays comments for the current post with threading
 */
async function displayComments(postId) {
    console.log('Displaying comments for post:', postId);
    
    const commentsLoading = document.getElementById('comments-loading');
    const commentsList = document.getElementById('comments-list');
    const noComments = document.getElementById('no-comments');

    // Check if elements exist before proceeding
    if (!commentsLoading || !commentsList || !noComments) {
        console.error('Comment elements not found:', { commentsLoading: !!commentsLoading, commentsList: !!commentsList, noComments: !!noComments });
        return; // Silently return if elements don't exist
    }

    // Show loading
    commentsLoading.classList.remove('hidden');
    commentsList.classList.add('hidden');
    noComments.classList.add('hidden');

    try {
        const result = await getCommentsForPost(postId);

        // Hide loading
        commentsLoading.classList.add('hidden');

        if (result.success) {
            const totalComments = result.comments.length + Object.values(result.replies).reduce((sum, replies) => sum + replies.length, 0);
            
            if (totalComments > 0) {
                commentsList.innerHTML = '';
                
                // Display parent comments with their replies
                result.comments.forEach(comment => {
                    const commentElement = createCommentElement(comment, result.replies[comment.id] || []);
                    commentsList.appendChild(commentElement);
                });
                
                commentsList.classList.remove('hidden');
            } else {
                noComments.classList.remove('hidden');
            }
        } else {
            commentsList.innerHTML = '<p class="text-red-500">Failed to load comments.</p>';
            commentsList.classList.remove('hidden');
        }
    } catch (error) {
        console.warn('Error loading comments:', error);
        commentsLoading.classList.add('hidden');
        if (commentsList) {
            commentsList.innerHTML = '<p class="text-red-500">Failed to load comments.</p>';
            commentsList.classList.remove('hidden');
        }
    }
}

/**
 * Creates a comment DOM element with replies
 */
function createCommentElement(comment, replies = []) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment-item bg-gray-50 rounded-lg p-4 pl-6 mb-4';
    
    const commentDate = comment.createdAt ? 
        new Date(comment.createdAt.seconds * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Just now';

    const user = auth.currentUser;
    const isAdmin = typeof isUserAdmin === 'function' ? isUserAdmin() : false;
    const canDelete = user && (comment.authorId === user.uid || isAdmin);
    const canReply = user !== null;

    commentDiv.innerHTML = `
        <div class="flex items-start justify-between">
            <div class="flex-1">
                <div class="flex items-center space-x-2 mb-2">
                    <a href="profile.html?user=${comment.authorId}" class="font-semibold text-gray-800 hover:text-blue-600 transition duration-200">${comment.authorName}</a>
                    <span class="text-sm text-gray-500">${commentDate}</span>
                </div>
                <p class="text-gray-700 leading-relaxed mb-3">${comment.text}</p>
                
                <!-- Action buttons -->
                <div class="flex items-center space-x-4 text-sm">
                    ${canReply ? `
                        <button onclick="toggleReplyForm('${comment.id}')" class="text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                            </svg>
                            <span>Reply</span>
                        </button>
                    ` : ''}
                    ${replies.length > 0 ? `
                        <span class="text-gray-500">${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}</span>
                    ` : ''}
                </div>
                
                <!-- Reply form (hidden by default) -->
                ${canReply ? `
                    <div id="reply-form-${comment.id}" class="hidden mt-4 bg-white rounded-lg p-3 border-l-4 border-blue-500">
                        <form onsubmit="handleReplySubmit(event, '${comment.id}')" class="space-y-3">
                            <textarea 
                                placeholder="Write a reply..." 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" 
                                rows="2"
                                required
                            ></textarea>
                            <div class="flex justify-end space-x-2">
                                <button type="button" onclick="toggleReplyForm('${comment.id}')" class="px-3 py-1 text-gray-600 hover:text-gray-800">
                                    Cancel
                                </button>
                                <button type="submit" class="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                                    Reply
                                </button>
                            </div>
                        </form>
                    </div>
                ` : ''}
            </div>
            ${canDelete ? `
                <button onclick="handleDeleteComment('${comment.id}')" class="text-red-500 hover:text-red-700 text-sm ml-4">
                    Delete
                </button>
            ` : ''}
        </div>
        
        <!-- Replies section -->
        ${replies.length > 0 ? `
            <div class="ml-6 mt-4 space-y-3 border-l-2 border-gray-200 pl-4">
                ${replies.map(reply => createReplyElement(reply)).join('')}
            </div>
        ` : ''}
    `;

    return commentDiv;
}

/**
 * Creates a reply DOM element
 */
function createReplyElement(reply) {
    const replyDate = reply.createdAt ? 
        new Date(reply.createdAt.seconds * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Just now';

    const user = auth.currentUser;
    const isAdmin = typeof isUserAdmin === 'function' ? isUserAdmin() : false;
    const canDelete = user && (reply.authorId === user.uid || isAdmin);

    return `
        <div class="bg-white rounded-lg p-3 border border-gray-200">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-2">
                        <a href="profile.html?user=${reply.authorId}" class="font-semibold text-gray-800 text-sm hover:text-blue-600 transition duration-200">${reply.authorName}</a>
                        <span class="text-xs text-gray-500">${replyDate}</span>
                    </div>
                    <p class="text-gray-700 text-sm leading-relaxed">${reply.text}</p>
                </div>
                ${canDelete ? `
                    <button onclick="handleDeleteComment('${reply.id}')" class="text-red-500 hover:text-red-700 text-xs ml-2">
                        Delete
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Displays reactions for the current post
 */
async function displayReactions(postId) {
    console.log('Displaying reactions for post:', postId);
    
    try {
        const result = await getReactionsForPost(postId);

        if (result.success) {
            // Update counts with error handling
            const likeCount = document.getElementById('like-count');
            const heartCount = document.getElementById('heart-count');
            const celebrateCount = document.getElementById('celebrate-count');
            const insightfulCount = document.getElementById('insightful-count');

            if (likeCount) likeCount.textContent = result.reactions.like;
            if (heartCount) heartCount.textContent = result.reactions.heart;
            if (celebrateCount) celebrateCount.textContent = result.reactions.celebrate;
            if (insightfulCount) insightfulCount.textContent = result.reactions.insightful;

            // Update active states
            const user = auth.currentUser;
            if (user) {
                const likeBtn = document.getElementById('like-btn');
                const heartBtn = document.getElementById('heart-btn');
                const celebrateBtn = document.getElementById('celebrate-btn');
                const insightfulBtn = document.getElementById('insightful-btn');

                if (likeBtn) likeBtn.classList.toggle('active', result.userReactions.has('like'));
                if (heartBtn) heartBtn.classList.toggle('active', result.userReactions.has('heart'));
                if (celebrateBtn) celebrateBtn.classList.toggle('active', result.userReactions.has('celebrate'));
                if (insightfulBtn) insightfulBtn.classList.toggle('active', result.userReactions.has('insightful'));
            }
        }
    } catch (error) {
        console.warn('Error loading reactions:', error);
    }
}

/**
 * Handles comment form submission
 */
async function handleCommentSubmit(event) {
    event.preventDefault();
    
    const commentText = document.getElementById('comment-text').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';

    const result = await addComment(currentPostId, commentText);

    if (result.success) {
        // Clear form
        document.getElementById('comment-text').value = '';
        
        // Refresh comments
        await displayComments(currentPostId);
    } else {
        if (typeof window.showToast === 'function') showToast(result.error || 'Failed to post comment.', 'error');
        else alert(result.error);
    }

    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.textContent = 'Post Comment';
}

/**
 * Handles reply form submission
 */
async function handleReplySubmit(event, parentId) {
    event.preventDefault();
    
    const textarea = event.target.querySelector('textarea');
    const replyText = textarea.value;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Replying...';

    const result = await addComment(currentPostId, replyText, parentId);

    if (result.success) {
        // Hide reply form
        toggleReplyForm(parentId);
        
        // Refresh comments
        await displayComments(currentPostId);
    } else {
        if (typeof window.showToast === 'function') showToast(result.error || 'Failed to post reply.', 'error');
        else alert(result.error);
    }

    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.textContent = 'Reply';
}

/**
 * Toggles reply form visibility
 */
function toggleReplyForm(commentId) {
    const replyForm = document.getElementById(`reply-form-${commentId}`);
    if (replyForm) {
        const isHidden = replyForm.classList.contains('hidden');
        
        // Hide all other reply forms first
        document.querySelectorAll('[id^="reply-form-"]').forEach(form => {
            form.classList.add('hidden');
        });
        
        if (isHidden) {
            replyForm.classList.remove('hidden');
            // Focus on the textarea
            const textarea = replyForm.querySelector('textarea');
            if (textarea) {
                textarea.focus();
            }
        }
    }
}

/**
 * Handles reaction button clicks
 */
async function handleReactionClick(reactionType) {
    const user = auth.currentUser;
    if (!user) {
        if (typeof window.showToast === 'function') showToast('Please log in to react to this post.', 'warning');
        else alert('Please log in to react to this post.');
        return;
    }

    // Get the button element for immediate visual feedback
    const button = document.getElementById(`${reactionType}-btn`);
    const countElement = document.getElementById(`${reactionType}-count`);
    
    if (!button || !countElement) {
        console.error('Reaction button or count element not found');
        return;
    }

    // Immediate visual feedback
    const isCurrentlyActive = button.classList.contains('active');
    const currentCount = parseInt(countElement.textContent) || 0;
    
    // Optimistically update UI
    if (isCurrentlyActive) {
        button.classList.remove('active');
        countElement.textContent = Math.max(0, currentCount - 1);
    } else {
        button.classList.add('active');
        countElement.textContent = currentCount + 1;
    }

    const result = await toggleReaction(currentPostId, reactionType);
    
    if (result.success) {
        // Only refresh if there was an error or if we need to sync with server
        // For now, we'll trust our optimistic update
    } else {
        // Revert optimistic update on error
        if (isCurrentlyActive) {
            button.classList.add('active');
            countElement.textContent = currentCount;
        } else {
            button.classList.remove('active');
            countElement.textContent = Math.max(0, currentCount - 1);
        }
        if (typeof window.showToast === 'function') showToast(result.error || 'Failed to update reaction.', 'error');
        else alert(result.error);
    }
}

/**
 * Handles comment deletion
 */
async function handleDeleteComment(commentId) {
    const ok = await (typeof window.showConfirmModal === 'function'
        ? showConfirmModal('This action will permanently remove your comment.', { title: 'Delete comment?', confirmText: 'Delete', variant: 'danger' })
        : Promise.resolve(confirm('Are you sure you want to delete this comment?')));
    if (!ok) return;

    const result = await deleteComment(commentId);
    
    if (result.success) {
        // Refresh comments
        await displayComments(currentPostId);
    } else {
        if (typeof window.showToast === 'function') showToast(result.error || 'Failed to delete comment.', 'error');
        else alert(result.error);
    }
}

/**
 * Handles bookmark button click
 */
async function handleBookmarkClick() {
    const user = auth.currentUser;
    if (!user) {
        if (typeof window.showToast === 'function') showToast('Please log in to bookmark posts.', 'warning');
        else alert('Please log in to bookmark posts.');
        return;
    }

    const bookmarkBtn = document.getElementById('bookmark-btn');
    const result = await toggleBookmark(currentPostId);
    
    if (result.success) {
        updateBookmarkButton(result.action === 'added');
    } else {
        if (typeof window.showToast === 'function') showToast(result.error || 'Failed to update bookmark.', 'error');
        else alert(result.error);
    }
}

/**
 * Updates bookmark button appearance
 */
function updateBookmarkButton(isBookmarked) {
    const bookmarkBtn = document.getElementById('bookmark-btn');
    const bookmarkIcon = bookmarkBtn.querySelector('svg');
    const bookmarkText = bookmarkBtn.querySelector('span');
    
    if (isBookmarked) {
        bookmarkBtn.classList.add('bookmarked');
        bookmarkText.textContent = 'Bookmarked';
        bookmarkIcon.setAttribute('fill', 'currentColor');
    } else {
        bookmarkBtn.classList.remove('bookmarked');
        bookmarkText.textContent = 'Bookmark';
        bookmarkIcon.setAttribute('fill', 'none');
    }
}

/**
 * Initializes comments, reactions, and bookmarks for the current post
 */
function initializeCommentsAndReactions(postId) {
    console.log('Initializing comments and reactions for post:', postId);
    
    if (!postId) {
        console.error('No post ID provided to initializeCommentsAndReactions');
        return;
    }
    
    currentPostId = postId;
    
    // Set up comment form
    const commentForm = document.getElementById('comment-form');
    const commentFormContainer = document.getElementById('comment-form-container');
    const commentLoginPrompt = document.getElementById('comment-login-prompt');
    
    if (commentForm) {
        commentForm.addEventListener('submit', handleCommentSubmit);
    }

    // Show appropriate UI based on auth state
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            if (commentFormContainer) commentFormContainer.classList.remove('hidden');
            if (commentLoginPrompt) commentLoginPrompt.classList.add('hidden');
            
            // Check bookmark status (non-blocking)
            isPostBookmarked(postId).then(isBookmarked => {
                updateBookmarkButton(isBookmarked);
            }).catch(error => {
                console.warn('Failed to check bookmark status:', error);
            });
        } else {
            if (commentFormContainer) commentFormContainer.classList.add('hidden');
            if (commentLoginPrompt) commentLoginPrompt.classList.remove('hidden');
            
            // Reset bookmark button for logged out users
            updateBookmarkButton(false);
        }
    });

    // Set up reaction buttons with proper checks
    const likeBtn = document.getElementById('like-btn');
    const heartBtn = document.getElementById('heart-btn');
    const celebrateBtn = document.getElementById('celebrate-btn');
    const insightfulBtn = document.getElementById('insightful-btn');

    console.log('Reaction buttons found:', { likeBtn: !!likeBtn, heartBtn: !!heartBtn, celebrateBtn: !!celebrateBtn, insightfulBtn: !!insightfulBtn });

    if (likeBtn) {
        likeBtn.addEventListener('click', () => handleReactionClick('like'));
    }

    if (heartBtn) {
        heartBtn.addEventListener('click', () => handleReactionClick('heart'));
    }

    if (celebrateBtn) {
        celebrateBtn.addEventListener('click', () => handleReactionClick('celebrate'));
    }

    if (insightfulBtn) {
        insightfulBtn.addEventListener('click', () => handleReactionClick('insightful'));
    }

    // Set up bookmark button
    const bookmarkBtn = document.getElementById('bookmark-btn');
    console.log('Bookmark button found:', !!bookmarkBtn);
    if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', handleBookmarkClick);
    }

    // Load reactions first (faster, less data)
    setTimeout(() => {
        displayReactions(postId).catch(error => {
            console.warn('Failed to load reactions:', error);
        });
    }, 500); // 0.5 second delay

    // Load comments much later (more data, can wait)
    setTimeout(() => {
        displayComments(postId).catch(error => {
            console.warn('Failed to load comments:', error);
        });
    }, 1500); // 1.5 second delay after reactions
}

// Make functions globally available
window.initializeCommentsAndReactions = initializeCommentsAndReactions;
window.handleCommentSubmit = handleCommentSubmit;
window.handleReplySubmit = handleReplySubmit;
window.handleReactionClick = handleReactionClick;
window.handleDeleteComment = handleDeleteComment;
window.handleBookmarkClick = handleBookmarkClick;
window.toggleReplyForm = toggleReplyForm;
window.displayComments = displayComments;
window.displayReactions = displayReactions;

// Log that comments.js has loaded successfully
console.log('Comments.js loaded successfully. Available functions:', Object.keys(window).filter(key => key.includes('Comment') || key.includes('Reaction') || key.includes('Bookmark')));