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
    const user = auth.currentUser;
    if (!user) {
        console.error("No user is logged in.");
        return { success: false, error: "You must be logged in to create a post." };
    }

    try {
        // Convert the comma-separated tags string into an array of strings.
        const tagsArray = postData.tags ? postData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

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

        const docRef = await db.collection("posts").add(newPost);
        console.log("Post created successfully with ID:", docRef.id);
        return { success: true, postId: docRef.id };

    } catch (error) {
        console.error("Error creating post:", error);
        return { success: false, error: "Failed to create post." };
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