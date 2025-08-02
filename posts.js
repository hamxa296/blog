/**
 * posts.js
 * This file contains the core functions for interacting with the 'posts'
 * collection in the Firestore database.
 */

/*
    FIRESTORE DATABASE STRUCTURE for the 'posts' collection:

    Each document in the 'posts' collection will represent a single blog post
    and will have the following fields:

    - title (string): The title of the blog post.
    - content (string): The main body of the post (HTML from the Quill editor).
    - description (string): A short, catchy description for post previews.
    - photoUrl (string): The URL for the post's featured image.
    - authorId (string): The unique ID (uid) of the user who wrote the post.
    - authorName (string): The display name or email of the author.
    - createdAt (timestamp): The date and time the post was created.
    - status (string): The current state of the post ("pending", "approved", "rejected").
    - genre (string): A category for the post, like "Engineering", "Campus Life", etc.
    - tags (array): An array of strings, e.g., ["AI", "GIKI", "Projects"].
*/

/**
 * Creates a new blog post document in Firestore.
 * This function automatically adds the author's ID, name, a creation timestamp,
 * and sets the initial status to "pending".
 * @param {object} postData - An object containing all the post's data from the form.
 * @returns {Promise<object>} A promise that resolves with the new post's ID on success, or an error object on failure.
 */
async function createPost(postData) {
    const user = auth.currentUser;

    if (!user) {
        console.error("No user is logged in.");
        return { success: false, error: "You must be logged in to create a post." };
    }

    try {
        // Convert the comma-separated tags string into an array of strings.
        // This trims whitespace from each tag and removes any empty tags.
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
            status: "pending"
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
 * @returns {Promise<object>} A promise that resolves with an array of approved post objects, or an error object on failure.
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
 * @param {string} postId - The unique ID of the post to fetch.
 * @returns {Promise<object>} A promise that resolves with the post object on success, or an error object if not found.
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
