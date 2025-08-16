/**
 * posts.js
 * This file contains the core functions for interacting with the 'posts'
 * collection in the Firestore database.
 */

/*
    FIRESTORE DATABASE STRUCTURE for the 'posts' collection:
    - title (string)
    - content (string)
    - description (string)
    - photoUrl (string)
    - authorId (string)
    - authorName (string)
    - createdAt (timestamp)
    - status (string): "pending", "approved", "rejected"
    - genre (string)
    - tags (array)
    - isFeatured (boolean, optional): Set to true for the featured post.
*/

async function createPost(postData) {
    console.log("createPost called with data:", postData);
    const user = auth.currentUser;
    if (!user) {
        console.error("No user is logged in.");
        return { success: false, error: "You must be logged in to create a post." };
    }

    console.log("User authenticated:", user.uid, user.email);

    try {
        // Convert the comma-separated tags string into an array of strings.
        const tagsArray = postData.tags ? postData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        console.log("Tags array:", tagsArray);

        const newPost = {
            title: postData.title,
            content: postData.content,
            description: postData.description || "",
            photoUrl: postData.photoUrl || "",
            genre: postData.genre || "General",
            tags: tagsArray,
            authorId: user.uid,
            authorName: user.displayName || user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: "pending",
            isFeatured: false // Default to not featured
        };

        console.log("Prepared post data:", newPost);
        console.log("Attempting to add to Firestore...");

        const docRef = await db.collection("posts").add(newPost);
        console.log("Post created successfully with ID:", docRef.id);
        
        // Note: Stats will be updated when the post is approved by admin
        // We don't update stats for pending posts to keep counts accurate
        
        return { success: true, postId: docRef.id };

    } catch (error) {
        console.error("Error creating post:", error);
        console.error("Error details:", error.message, error.code);
        return { success: false, error: "Failed to create post: " + error.message };
    }
}

/**
 * Fetches all blog posts from Firestore that have been approved.
 */
async function getApprovedPosts() {
    try {
        const snapshot = await db.collection("posts")
            .where("status", "==", "approved")
            .orderBy("createdAt", "desc") // Show the newest posts first
            .get();

        if (snapshot.empty) {
            console.log("No approved posts found.");
            return { success: true, posts: [] };
        }

        const posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { success: true, posts: posts };

    } catch (error) {
        console.error("Error fetching approved posts:", error);
        return { success: false, error: "Failed to fetch posts." };
    }
}

/**
 * Fetches a single blog post from Firestore using its document ID.
 */
async function getPostById(postId) {
    try {
        const docRef = db.collection("posts").doc(postId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            return { success: true, post: { id: docSnap.id, ...docSnap.data() } };
        } else {
            console.error("No such document!");
            return { success: false, error: "Post not found." };
        }
    } catch (error) {
        console.error("Error fetching post by ID:", error);
        return { success: false, error: "Failed to fetch post." };
    }
}

/**
 * Fetches the single post marked as featured.
 * @returns {Promise<object>} A promise that resolves with the featured post object.
 */
async function getFeaturedPost() {
    try {
        const snapshot = await db.collection("posts")
            .where("isFeatured", "==", true)
            .where("status", "==", "approved")
            .limit(1)
            .get();

        if (snapshot.empty) {
            return { success: false, error: "No featured post found." };
        }

        const post = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        return { success: true, post: post };

    } catch (error) {
        console.error("Error fetching featured post:", error);
        return { success: false, error: "Failed to fetch post." };
    }
}

/**
 * Fetches all posts written by a specific author.
 * @param {string} authorId - The UID of the author.
 * @returns {Promise<object>} A promise that resolves with an array of the author's posts.
 */
async function getPostsByAuthor(authorId) {
    try {
        const snapshot = await db.collection("posts")
            .where("authorId", "==", authorId)
            .orderBy("createdAt", "desc")
            .get();

        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { success: true, posts: posts };

    } catch (error) {
        console.error("Error fetching posts by author:", error);
        return { success: false, error: "Failed to fetch posts." };
    }
}
/**
 * Fetches a post for editing, ensuring the current user is the author.
 * @param {string} postId - The ID of the post to fetch.
 * @returns {Promise<object>}
 */
async function getPostForEditing(postId) {
    console.log("getPostForEditing called with postId:", postId); // DEBUG

    const user = auth.currentUser;
    console.log("Current user in getPostForEditing:", user ? user.uid : "Not logged in"); // DEBUG

    if (!user) return { success: false, error: "Authentication required." };

    try {
        console.log("Attempting to fetch document from Firestore..."); // DEBUG
        const docRef = db.collection("posts").doc(postId);
        const docSnap = await docRef.get();

        console.log("Document exists:", docSnap.exists); // DEBUG

        if (!docSnap.exists) return { success: false, error: "Post not found." };

        const post = docSnap.data();
        console.log("Post data retrieved:", post); // DEBUG
        console.log("Post authorId:", post.authorId); // DEBUG
        console.log("Current user UID:", user.uid); // DEBUG

        // Security check: ensure the person editing is the original author.
        if (post.authorId !== user.uid) {
            console.log("Authorization failed - user not the author"); // DEBUG
            return { success: false, error: "You are not authorized to edit this post." };
        }

        console.log("Authorization successful, returning post data"); // DEBUG
        return { success: true, post: { id: docSnap.id, ...post } };
    } catch (error) {
        console.error("Error fetching post for editing:", error);
        return { success: false, error: "Failed to fetch post." };
    }
}

/**
 * Updates an existing post in Firestore.
 * @param {string} postId - The ID of the post to update.
 * @param {object} postData - An object containing the updated data.
 * @returns {Promise<object>}
 */
async function updatePost(postId, postData) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: "Authentication required." };

    try {
        const tagsArray = postData.tags ? postData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

        const updatedPost = {
            title: postData.title,
            content: postData.content,
            description: postData.description || "",
            photoUrl: postData.photoUrl || "",
            genre: postData.genre || "General",
            tags: tagsArray,
            status: "pending" // Reset status to pending for re-approval
        };

        const docRef = db.collection("posts").doc(postId);
        await docRef.update(updatedPost);

        return { success: true };
    } catch (error) {
        console.error("Error updating post:", error);
        return { success: false, error: "Failed to update post." };
    }
}
async function savePostAsDraft(postData, postId = null) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: "Authentication required." };

    try {
        const tagsArray = postData.tags ? postData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        const draftData = {
            title: postData.title,
            content: postData.content,
            description: postData.description || "",
            photoUrl: postData.photoUrl || "",
            genre: postData.genre || "General",
            tags: tagsArray,
            authorId: user.uid,
            authorName: user.displayName || user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: "draft" // Set status to draft
        };

        if (postId) {
            // Update the existing draft
            const docRef = db.collection("posts").doc(postId);
            await docRef.update(draftData);
            return { success: true, postId: postId };
        } else {
            // Create a new draft
            const docRef = await db.collection("posts").add(draftData);
            return { success: true, postId: docRef.id };
        }
    } catch (error) {
        console.error("Error saving draft:", error);
        return { success: false, error: "Failed to save draft." };
    }
}
/**
 * Fetches all posts that are awaiting admin review.
 * @returns {Promise<object>} A promise that resolves with an array of pending post objects.
 */
async function getPendingPosts() {
    const user = auth.currentUser;
    if (!user) {
        console.log("No authenticated user");
        return { success: false, error: "Authentication required." };
    }

    console.log("Getting pending posts for user:", user.uid);

    // Verify admin status server-side
    try {
        console.log("Checking admin status...");
        const isAdmin = await isUserAdmin();
        console.log("Admin check result:", isAdmin);
        
        if (!isAdmin) {
            console.error("Unauthorized access attempt to fetch pending posts");
            return { success: false, error: "Admin privileges required." };
        }

        console.log("Admin verified, fetching pending posts...");
        const snapshot = await db.collection("posts")
            .where("status", "==", "pending")
            .orderBy("createdAt", "asc") // Show oldest submissions first
            .get();

        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Found", posts.length, "pending posts");
        return { success: true, posts: posts };

    } catch (error) {
        console.error("Error fetching pending posts:", error);
        return { success: false, error: "Failed to fetch pending posts." };
    }
}

/**
 * Updates the status of a post (e.g., to "approved" or "rejected").
 * @param {string} postId - The ID of the post to update.
 * @param {string} newStatus - The new status ("approved" or "rejected").
 * @returns {Promise<object>} A promise that resolves on success.
 */
async function updatePostStatus(postId, newStatus) {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: "Authentication required." };
    }

    // Verify admin status server-side
    try {
        const isAdmin = await isUserAdmin();
        if (!isAdmin) {
            console.error("Unauthorized access attempt to update post status");
            return { success: false, error: "Admin privileges required." };
        }

        const docRef = db.collection("posts").doc(postId);
        await docRef.update({ 
            status: newStatus,
            reviewedBy: user.uid,
            reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating post status:", error);
        return { success: false, error: "Failed to update status." };
    }
}

/**
 * Toggles the featured status of a post (admin only).
 * @param {string} postId - The ID of the post to toggle.
 * @param {boolean} isFeatured - Whether the post should be featured.
 * @returns {Promise<object>} A promise that resolves on success.
 */
async function toggleFeaturedStatus(postId, isFeatured) {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: "Authentication required." };
    }

    // Verify admin status server-side
    try {
        const isAdmin = await isUserAdmin();
        if (!isAdmin) {
            console.error("Unauthorized access attempt to toggle featured status");
            return { success: false, error: "Admin privileges required." };
        }

        const docRef = db.collection("posts").doc(postId);
        await docRef.update({ 
            isFeatured: isFeatured,
            featuredBy: user.uid,
            featuredAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error toggling featured status:", error);
        return { success: false, error: "Failed to toggle featured status." };
    }
}

/**
 * Fetches all blog posts from Firestore (admin only).
 * @param {string} status - Optional filter by status ("pending", "approved", "rejected", or "all")
 * @returns {Promise<object>} A promise that resolves with all posts.
 */
async function getAllPosts(status = "all") {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: "Authentication required." };
    }

    // Verify admin status server-side
    try {
        const isAdmin = await isUserAdmin();
        if (!isAdmin) {
            console.error("Unauthorized access attempt to fetch all posts");
            return { success: false, error: "Admin privileges required." };
        }

        let query = db.collection("posts").orderBy("createdAt", "desc");
        
        // Apply status filter if specified
        if (status && status !== "all") {
            query = query.where("status", "==", status);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            console.log("No posts found.");
            return { success: true, posts: [] };
        }

        const posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { success: true, posts: posts };

    } catch (error) {
        console.error("Error fetching all posts:", error);
        return { success: false, error: "Failed to fetch posts." };
    }
}

/**
 * Permanently deletes a post from Firestore (admin only).
 * @param {string} postId - The ID of the post to delete.
 * @returns {Promise<object>} A promise that resolves on success.
 */
async function deletePostPermanently(postId) {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: "Authentication required." };
    }

    // Verify admin status server-side
    try {
        const isAdmin = await isUserAdmin();
        if (!isAdmin) {
            console.error("Unauthorized access attempt to delete post");
            return { success: false, error: "Admin privileges required." };
        }

        // Delete the post document
        await db.collection("posts").doc(postId).delete();
        
        console.log("Post deleted permanently:", postId);
        return { success: true };

    } catch (error) {
        console.error("Error deleting post:", error);
        return { success: false, error: "Failed to delete post." };
    }
}