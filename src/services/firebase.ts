import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Admin Configuration
export const ADMIN_UIDS = [
  "DNDjKZRt0yQNh4d3inNchRcs0oY2", // Primary admin account
  "zCINcUAy84aMwHF83wlRUTO2Dn32",
  "gn2AlkdswANjVg58rUXOLoPaX192",
  "b7QYLqpUCNbCKGvU1SQgr1pHBJj1"
];

export function isAdminUID(uid: string): boolean {
  return ADMIN_UIDS.includes(uid);
}

// Interface definitions
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  bio?: string;
  isAdmin?: boolean;
  isBlocked?: boolean;
  role?: 'admin' | 'editor' | 'moderator' | 'author' | 'user';
  createdAt?: Timestamp;
  lastUpdated?: Timestamp;
}

export interface Post {
  id?: string;
  title: string;
  content: string;
  description: string;
  photoUrl: string;
  genre: string;
  tags: string[];
  authorId: string;
  authorName: string;
  createdAt: Timestamp | null;
  status: 'pending' | 'approved' | 'rejected' | 'draft';
  isFeatured: boolean;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  rejectionReason?: string;
}

export interface GalleryPhoto {
  id?: string;
  imageUrl: string;
  fullSizeUrl: string;
  caption: string;
  category: string;
  uploaderName: string;
  uploaderId: string;
  cloudinaryId?: string;
  isHighlighted: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface CalendarEvent {
  id?: string;
  eventName: string;
  eventDate: string; // YYYY-MM-DD
  eventTime?: string;
  eventType: string; // Tech, Cultural, Academic, Sports
  eventLocation: string;
  eventDescription: string;
  createdAt: Timestamp;
  uploaderId: string;
}

// -------------------------------------------------------------
// AUTHENTICATION UTILITIES
// -------------------------------------------------------------

export async function signUpUser(email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userData: UserProfile = {
      uid: user.uid,
      email: user.email || email,
      displayName: email.split('@')[0],
      photoURL: '',
      role: isAdminUID(user.uid) ? 'admin' : 'author',
    };

    if (isAdminUID(user.uid)) {
      userData.isAdmin = true;
    }

    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      createdAt: serverTimestamp()
    });

    return { success: true, user };
  } catch (error: any) {
    console.error("Sign-up Error:", error);
    let userFriendlyError = "An error occurred during signup. Please try again.";
    if (error.code === 'auth/email-already-in-use') {
      userFriendlyError = "An account with this email already exists.";
    } else if (error.code === 'auth/invalid-email') {
      userFriendlyError = "Please enter a valid email address.";
    } else if (error.code === 'auth/weak-password') {
      userFriendlyError = "Password is too weak (minimum 6 characters required).";
    }
    return { success: false, error: userFriendlyError };
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch and check if user is blocked
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;
      if (userData.isBlocked) {
        await signOut(auth);
        return { success: false, error: "Your account has been blocked. Please contact support." };
      }

      // Sync data, preserve admin
      await updateDoc(userDocRef, {
        email: user.email || email,
        displayName: userData.displayName || user.displayName || email.split('@')[0],
        photoURL: userData.photoURL || user.photoURL || '',
        lastUpdated: serverTimestamp()
      });
    } else {
      // Create user document if it does not exist
      const userData: UserProfile = {
        uid: user.uid,
        email: user.email || email,
        displayName: user.displayName || email.split('@')[0],
        photoURL: user.photoURL || '',
        role: isAdminUID(user.uid) ? 'admin' : 'author',
      };
      if (isAdminUID(user.uid)) {
        userData.isAdmin = true;
      }
      await setDoc(userDocRef, {
        ...userData,
        createdAt: serverTimestamp()
      });
    }

    return { success: true, user };
  } catch (error: any) {
    console.error("Login Error:", error);
    let userFriendlyError = "An error occurred during login. Please try again.";
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      userFriendlyError = "Invalid email or password.";
    } else if (error.code === 'auth/too-many-requests') {
      userFriendlyError = "Too many failed attempts. Please try again later.";
    }
    return { success: false, error: userFriendlyError };
  }
}

export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;
      if (userData.isBlocked) {
        await signOut(auth);
        return { success: false, error: "Your account has been blocked. Please contact support." };
      }

      await updateDoc(userDocRef, {
        email: user.email || userData.email,
        displayName: userData.displayName || user.displayName || 'User',
        photoURL: userData.photoURL || user.photoURL || '',
        lastUpdated: serverTimestamp()
      });
    } else {
      const userData: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'User',
        photoURL: user.photoURL || '',
        role: isAdminUID(user.uid) ? 'admin' : 'author',
      };
      if (isAdminUID(user.uid)) {
        userData.isAdmin = true;
      }
      await setDoc(userDocRef, {
        ...userData,
        createdAt: serverTimestamp()
      });
    }

    return { success: true, user };
  } catch (error: any) {
    console.error("Google Sign-in Error:", error);
    let userFriendlyError = "An error occurred during Google sign-in. Please try again.";
    if (error.code === 'auth/popup-closed-by-user') {
      userFriendlyError = "Sign-in was cancelled.";
    }
    return { success: false, error: userFriendlyError };
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -------------------------------------------------------------
// USER PROFILE UTILITIES
// -------------------------------------------------------------

export async function getUserProfile(userId: string) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { success: true, profile: userDoc.data() as UserProfile };
    }
    return { success: false, error: "Profile not found." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUserProfile(userId: string, profileData: Partial<UserProfile>) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...profileData,
      lastUpdated: serverTimestamp()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function uploadProfilePicture(userId: string, file: File) {
  try {
    const fileRef = ref(storage, `profile_pictures/${userId}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    return { success: true, url: downloadURL };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -------------------------------------------------------------
// BLOG POSTS UTILITIES
// -------------------------------------------------------------

export async function createPost(postData: {
  title: string;
  content: string;
  description: string;
  photoUrl: string;
  genre: string;
  tags: string;
}) {
  const user = auth.currentUser;
  if (!user) return { success: false, error: "You must be logged in to create a post." };

  try {
    const tagsArray = postData.tags 
      ? postData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) 
      : [];

    const newPost = {
      title: postData.title,
      content: postData.content,
      description: postData.description || "",
      photoUrl: postData.photoUrl || "",
      genre: postData.genre || "General",
      tags: tagsArray,
      authorId: user.uid,
      authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
      createdAt: serverTimestamp(),
      status: "pending",
      isFeatured: false
    };

    const docRef = await addDoc(collection(db, 'posts'), newPost);
    return { success: true, postId: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getApprovedPosts() {
  try {
    const q = query(
      collection(db, 'posts'),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
    return { success: true, posts };
  } catch (error: any) {
    console.error("Error fetching approved posts:", error);
    return { success: false, error: error.message };
  }
}

export async function getPostById(postId: string) {
  try {
    const docSnap = await getDoc(doc(db, 'posts', postId));
    if (docSnap.exists()) {
      return { success: true, post: { id: docSnap.id, ...docSnap.data() } as Post };
    }
    return { success: false, error: "Post not found." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getFeaturedPost() {
  try {
    const q = query(
      collection(db, 'posts'),
      where('isFeatured', '==', true),
      where('status', '==', 'approved'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return { success: false, error: "No featured post found." };
    }
    const doc = snapshot.docs[0];
    return { success: true, post: { id: doc.id, ...doc.data() } as Post };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPostsByAuthor(authorId: string) {
  try {
    const q = query(
      collection(db, 'posts'),
      where('authorId', '==', authorId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
    return { success: true, posts };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPostForEditing(postId: string) {
  const user = auth.currentUser;
  if (!user) return { success: false, error: "Authentication required." };

  try {
    const docRef = doc(db, 'posts', postId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, error: "Post not found." };

    const post = docSnap.data() as Post;
    if (post.authorId !== user.uid) {
      return { success: false, error: "You are not authorized to edit this post." };
    }

    return { success: true, post: { id: docSnap.id, ...post } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePost(postId: string, postData: {
  title: string;
  content: string;
  description: string;
  photoUrl: string;
  genre: string;
  tags: string;
}) {
  const user = auth.currentUser;
  if (!user) return { success: false, error: "Authentication required." };

  try {
    const tagsArray = postData.tags 
      ? postData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) 
      : [];

    await updateDoc(doc(db, 'posts', postId), {
      title: postData.title,
      content: postData.content,
      description: postData.description || "",
      photoUrl: postData.photoUrl || "",
      genre: postData.genre || "General",
      tags: tagsArray,
      status: "pending" // Reset status to pending for re-approval
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function savePostAsDraft(postData: {
  title: string;
  content: string;
  description: string;
  photoUrl: string;
  genre: string;
  tags: string;
}, postId: string | null = null) {
  const user = auth.currentUser;
  if (!user) return { success: false, error: "Authentication required." };

  try {
    const tagsArray = postData.tags 
      ? postData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) 
      : [];

    const draftData = {
      title: postData.title,
      content: postData.content,
      description: postData.description || "",
      photoUrl: postData.photoUrl || "",
      genre: postData.genre || "General",
      tags: tagsArray,
      authorId: user.uid,
      authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
      createdAt: serverTimestamp(),
      status: "draft" as const
    };

    if (postId) {
      await updateDoc(doc(db, 'posts', postId), draftData);
      return { success: true, postId };
    } else {
      const docRef = await addDoc(collection(db, 'posts'), draftData);
      return { success: true, postId: docRef.id };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -------------------------------------------------------------
// ADMIN / MODERATION UTILITIES
// -------------------------------------------------------------

export async function getPendingPosts() {
  try {
    const q = query(
      collection(db, 'posts'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
    return { success: true, posts };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePostStatus(postId: string, newStatus: 'approved' | 'rejected', rejectionReason = "") {
  const user = auth.currentUser;
  if (!user) return { success: false, error: "Authentication required." };

  try {
    const updateData: any = {
      status: newStatus,
      reviewedBy: user.uid,
      reviewedAt: serverTimestamp()
    };
    if (newStatus === 'rejected') {
      updateData.rejectionReason = rejectionReason;
    }
    await updateDoc(doc(db, 'posts', postId), updateData);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleFeaturedStatus(postId: string, isFeatured: boolean) {
  const user = auth.currentUser;
  if (!user) return { success: false, error: "Authentication required." };

  try {
    await updateDoc(doc(db, 'posts', postId), {
      isFeatured,
      featuredBy: user.uid,
      featuredAt: serverTimestamp()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAllPosts(status: string = "all") {
  try {
    let q;
    if (status && status !== "all") {
      q = query(
        collection(db, 'posts'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc')
      );
    }
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
    return { success: true, posts };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePostPermanently(postId: string) {
  try {
    await deleteDoc(doc(db, 'posts', postId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -------------------------------------------------------------
// GALLERY UTILITIES
// -------------------------------------------------------------

export async function getGalleryPhotos(status = "approved") {
  try {
    let q;
    if (status === "all") {
      q = query(collection(db, 'galleryPhotos'), orderBy('createdAt', 'desc'));
    } else {
      q = query(
        collection(db, 'galleryPhotos'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    }
    const snapshot = await getDocs(q);
    const photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryPhoto));
    return { success: true, photos };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function uploadGalleryPhoto(photoData: {
  imageUrl: string;
  fullSizeUrl: string;
  caption: string;
  category: string;
  cloudinaryId?: string;
}) {
  const user = auth.currentUser;
  if (!user) return { success: false, error: "Authentication required." };

  try {
    const docData = {
      ...photoData,
      uploaderName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
      uploaderId: user.uid,
      isHighlighted: false,
      status: 'pending' as const,
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'galleryPhotos'), docData);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateGalleryPhotoStatus(photoId: string, status: 'approved' | 'rejected', rejectionReason = "") {
  const user = auth.currentUser;
  if (!user) return { success: false, error: "Authentication required." };

  try {
    await updateDoc(doc(db, 'galleryPhotos', photoId), {
      status,
      rejectionReason,
      reviewedBy: user.uid,
      reviewedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteGalleryPhoto(photoId: string) {
  try {
    await deleteDoc(doc(db, 'galleryPhotos', photoId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getHighlightedPhotos() {
  try {
    const q = query(
      collection(db, 'galleryPhotos'),
      where('status', '==', 'approved'),
      where('isHighlighted', '==', true)
    );
    const snapshot = await getDocs(q);
    const photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryPhoto));
    // Sort client-side by createdAt descending to avoid composite index requirement
    photos.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
    return { success: true, photos };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function togglePhotoHighlight(photoId: string, isHighlighted: boolean) {
  const user = auth.currentUser;
  if (!user) return { success: false, error: "Authentication required." };

  try {
    await updateDoc(doc(db, 'galleryPhotos', photoId), {
      isHighlighted,
      highlightedBy: user.uid,
      highlightedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -------------------------------------------------------------
// CALENDAR EVENTS UTILITIES
// -------------------------------------------------------------

export async function getEvents() {
  try {
    const q = query(collection(db, 'events'), orderBy('eventDate', 'asc'));
    const snapshot = await getDocs(q);
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent));
    return { success: true, events };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createEvent(eventData: {
  eventName: string;
  eventDate: string;
  eventTime?: string;
  eventType: string;
  eventLocation: string;
  eventDescription: string;
}) {
  const user = auth.currentUser;
  if (!user) return { success: false, error: "Authentication required." };

  try {
    const docData = {
      ...eventData,
      uploaderId: user.uid,
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'events'), docData);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -------------------------------------------------------------
// USER BLOCK & LIST MODERATION UTILITIES
// -------------------------------------------------------------

export async function getAllUsers() {
  try {
    const snapshot = await getDocs(query(collection(db, 'users'), orderBy('email', 'asc')));
    const users = snapshot.docs.map(doc => doc.data() as UserProfile);
    return { success: true, users };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleBlockUser(userId: string, isBlocked: boolean) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      isBlocked,
      lastUpdated: serverTimestamp()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -------------------------------------------------------------
// CMS / COMMENT MODERATION & ROLE MANAGEMENT UTILITIES
// -------------------------------------------------------------

export async function getAllComments() {
  try {
    const q = query(collection(db, 'comments'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const comments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        postId: data.postId,
        authorId: data.authorId,
        authorName: data.authorName,
        authorPhotoURL: data.authorPhotoURL,
        content: data.content || data.text || '',
        createdAt: data.createdAt
      };
    });
    return { success: true, comments };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteComment(commentId: string) {
  try {
    await deleteDoc(doc(db, 'comments', commentId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUserRole(uid: string, newRole: 'admin' | 'editor' | 'moderator' | 'author' | 'user') {
  try {
    const updateData: any = { role: newRole };
    if (newRole === 'admin') {
      updateData.isAdmin = true;
    } else {
      updateData.isAdmin = false;
    }
    await updateDoc(doc(db, 'users', uid), updateData);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
