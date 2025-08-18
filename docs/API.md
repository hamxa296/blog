# 🔌 GIKI Chronicles - API Documentation

## 📋 **Overview**

This document provides comprehensive API documentation for the GIKI Chronicles website, covering all Firebase services, custom endpoints, and integration points.

---

## 🔥 **Firebase Services**

### **Authentication API**

#### **User Registration**
```javascript
// Email/Password Registration
const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
const user = userCredential.user;

// Google Sign-In
const provider = new firebase.auth.GoogleAuthProvider();
const result = await firebase.auth().signInWithPopup(provider);
```

#### **User Login**
```javascript
// Email/Password Login
const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);

// Sign Out
await firebase.auth().signOut();
```

#### **User State Management**
```javascript
// Listen to auth state changes
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        console.log('User ID:', user.uid);
    } else {
        // User is signed out
    }
});
```

### **Firestore Database API**

#### **Posts Collection**
```javascript
// Create a new post
const postRef = await db.collection('posts').add({
    title: 'Post Title',
    content: 'Post content...',
    authorId: user.uid,
    authorName: user.displayName,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    status: 'pending', // pending, approved, rejected
    tags: ['tag1', 'tag2'],
    category: 'general'
});

// Get all approved posts
const postsSnapshot = await db.collection('posts')
    .where('status', '==', 'approved')
    .orderBy('timestamp', 'desc')
    .get();

// Update a post
await db.collection('posts').doc(postId).update({
    title: 'Updated Title',
    content: 'Updated content...'
});

// Delete a post
await db.collection('posts').doc(postId).delete();
```

#### **Users Collection**
```javascript
// Create user profile
await db.collection('users').doc(user.uid).set({
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    isAdmin: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
});

// Get user profile
const userDoc = await db.collection('users').doc(user.uid).get();
const userData = userDoc.data();

// Update user profile
await db.collection('users').doc(user.uid).update({
    displayName: 'New Name',
    bio: 'User bio...',
    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
});
```

#### **Gallery Photos Collection**
```javascript
// Upload photo metadata
const photoRef = await db.collection('galleryPhotos').add({
    title: 'Photo Title',
    description: 'Photo description...',
    uploadedBy: user.uid,
    uploadedByName: user.displayName,
    imageUrl: cloudinaryUrl,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    status: 'pending', // pending, approved, rejected
    tags: ['campus', 'event']
});

// Get approved photos
const photosSnapshot = await db.collection('galleryPhotos')
    .where('status', '==', 'approved')
    .orderBy('timestamp', 'desc')
    .get();
```

#### **Comments Collection**
```javascript
// Add comment to post
const commentRef = await db.collection('comments').add({
    postId: postId,
    authorId: user.uid,
    authorName: user.displayName,
    content: 'Comment content...',
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
});

// Get comments for a post
const commentsSnapshot = await db.collection('comments')
    .where('postId', '==', postId)
    .orderBy('timestamp', 'asc')
    .get();
```

#### **User Checklists Collection**
```javascript
// Create user checklist
const checklistRef = await db.collection('userChecklists').add({
    userId: user.uid,
    items: [
        { id: 'item1', text: 'Item 1', checked: false },
        { id: 'item2', text: 'Item 2', checked: true }
    ],
    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
});

// Update checklist
await db.collection('userChecklists').doc(checklistId).update({
    items: updatedItems,
    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
});
```

### **Security Collections**

#### **MFA Data Collection**
```javascript
// Store MFA data
await db.collection('mfa_data').doc(user.uid).set({
    secret: encryptedSecret,
    backupCodes: hashedBackupCodes,
    isEnabled: true,
    lastUsed: firebase.firestore.FieldValue.serverTimestamp(),
    failedAttempts: 0
});

// Get MFA data
const mfaDoc = await db.collection('mfa_data').doc(user.uid).get();
```

#### **Security Logs Collection**
```javascript
// Log security event
await db.collection('security_logs').add({
    userId: user.uid,
    eventType: 'login_attempt',
    status: 'success',
    ipAddress: clientIP,
    userAgent: navigator.userAgent,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    details: {
        method: 'email_password',
        location: 'Pakistan'
    }
});
```

#### **IP Access Logs Collection**
```javascript
// Log IP access attempt
await db.collection('ip_access_logs').add({
    ipAddress: clientIP,
    userId: user.uid,
    action: 'admin_access',
    status: 'allowed',
    country: 'Pakistan',
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    userAgent: navigator.userAgent
});
```

---

## ☁️ **Cloudinary API**

### **Image Upload**
```javascript
// Upload image to Cloudinary
const formData = new FormData();
formData.append('file', file);
formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData
});

const result = await response.json();
const imageUrl = result.secure_url;
```

### **Image Transformations**
```javascript
// Resize image
const resizedUrl = imageUrl.replace('/upload/', '/upload/w_300,h_200,c_fill/');

// Apply filters
const filteredUrl = imageUrl.replace('/upload/', '/upload/e_art:audrey/');

// Generate thumbnail
const thumbnailUrl = imageUrl.replace('/upload/', '/upload/w_150,h_150,c_thumb/');
```

---

## 🛡️ **Security API**

### **Admin Validation**
```javascript
// Check if user is admin
const isAdmin = await window.SecureAdmin.isAdmin(user.uid);

// Validate admin action
const canPerformAction = await window.SecureAdmin.validateAction(user.uid, 'delete_post', postId);
```

### **MFA Operations**
```javascript
// Generate MFA secret
const mfaData = await window.MFA.initializeMFA(user.uid);

// Verify TOTP code
const isValid = await window.MFA.verifyTOTP(user.uid, totpCode);

// Generate backup codes
const backupCodes = await window.MFA.generateBackupCodes(user.uid);
```

### **IP Restriction**
```javascript
// Check IP access
const hasAccess = await window.IPRestriction.checkIPAccess();

// Get access statistics
const stats = await window.IPRestriction.getAccessStats();
```

---

## 📊 **Custom Security Modules API**

### **Input Sanitization**
```javascript
// Sanitize user input
const sanitizedInput = window.InputSanitizer.inputSanitizer(userInput, 'text');

// Sanitize HTML content
const sanitizedHTML = window.ContentSanitizer.sanitizeHTML(htmlContent, 'user');
```

### **File Upload Security**
```javascript
// Validate file upload
const validation = await window.FileUploadSecurity.secureFileUpload(file, {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png'],
    maxDimensions: { width: 1920, height: 1080 }
});
```

### **Session Management**
```javascript
// Get current session
const session = window.sessionManager.getCurrentSession();

// Extend session
window.sessionManager.extendSession();

// Log user activity
window.sessionManager.logActivity('page_view', { page: 'home' });
```

### **Error Handling**
```javascript
// Handle error securely
window.errorHandler.handleError(error, {
    context: 'user_action',
    userId: user.uid,
    action: 'create_post'
});
```

---

## 🔄 **Real-time Listeners**

### **Posts Real-time Updates**
```javascript
// Listen to posts changes
const unsubscribe = db.collection('posts')
    .where('status', '==', 'approved')
    .orderBy('timestamp', 'desc')
    .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                // New post added
                addPostToUI(change.doc.data());
            } else if (change.type === 'modified') {
                // Post modified
                updatePostInUI(change.doc.id, change.doc.data());
            } else if (change.type === 'removed') {
                // Post removed
                removePostFromUI(change.doc.id);
            }
        });
    });
```

### **Comments Real-time Updates**
```javascript
// Listen to comments for a specific post
const unsubscribeComments = db.collection('comments')
    .where('postId', '==', postId)
    .orderBy('timestamp', 'asc')
    .onSnapshot((snapshot) => {
        // Update comments UI
        updateCommentsUI(snapshot.docs);
    });
```

---

## 📈 **Analytics & Monitoring**

### **User Analytics**
```javascript
// Track page view
window.sessionManager.logActivity('page_view', {
    page: window.location.pathname,
    referrer: document.referrer,
    userAgent: navigator.userAgent
});

// Track user action
window.sessionManager.logActivity('user_action', {
    action: 'create_post',
    postId: postId,
    category: postCategory
});
```

### **Performance Monitoring**
```javascript
// Monitor API response times
const startTime = performance.now();
try {
    await db.collection('posts').get();
    const endTime = performance.now();
    window.apiSecurity.logPerformance('firestore_query', endTime - startTime);
} catch (error) {
    window.errorHandler.handleError(error);
}
```

---

## 🚨 **Error Handling**

### **Common Error Codes**
- `auth/user-not-found`: User doesn't exist
- `auth/wrong-password`: Incorrect password
- `auth/email-already-in-use`: Email already registered
- `permission-denied`: Insufficient permissions
- `unavailable`: Network connectivity issues

### **Error Response Format**
```javascript
{
    success: false,
    error: {
        code: 'permission-denied',
        message: 'User-friendly error message',
        details: {
            context: 'admin_action',
            userId: 'user123',
            action: 'delete_post'
        }
    }
}
```

---

## 🔧 **Configuration**

### **Environment Variables**
```javascript
// Firebase Configuration
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;
```

### **Security Configuration**
```javascript
// Rate limiting
const RATE_LIMITS = {
    login_attempts: 5,
    post_creation: 10,
    file_upload: 20,
    admin_actions: 50
};

// Session configuration
const SESSION_CONFIG = {
    timeout: 30 * 60 * 1000, // 30 minutes
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    maxInactiveTime: 60 * 60 * 1000 // 1 hour
};
```

---

## 📚 **Best Practices**

### **Security Best Practices**
1. **Always validate input** before processing
2. **Use server-side validation** for critical operations
3. **Implement rate limiting** for all API endpoints
4. **Log all security events** for monitoring
5. **Use HTTPS** for all communications
6. **Sanitize user content** before display

### **Performance Best Practices**
1. **Use pagination** for large datasets
2. **Implement caching** for frequently accessed data
3. **Optimize queries** with proper indexing
4. **Monitor response times** and optimize slow operations
5. **Use real-time listeners** sparingly

### **Error Handling Best Practices**
1. **Provide user-friendly error messages**
2. **Log detailed errors** for debugging
3. **Implement retry mechanisms** for transient failures
4. **Use proper error codes** for different scenarios
5. **Handle network failures** gracefully

---

## 🆘 **Support**

For API-related issues:
- Check [Firebase Documentation](https://firebase.google.com/docs)
- Review [Cloudinary Documentation](https://cloudinary.com/documentation)
- Contact the development team
- Check [Security Guide](SECURITY.md) for security-related issues

---

**API Status**: ✅ Active  
**Documentation**: Complete 📚  
**Security**: Enterprise-Grade 🛡️  
**Performance**: Optimized ⚡
