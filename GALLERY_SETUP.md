# Gallery Feature Setup Guide

## Overview
The gallery feature allows users to submit photos for review, which admins can then approve or reject. All photos are stored in Cloudinary with metadata in Firebase.

## Features
- **User Submission**: Users can submit photos with captions and categories
- **Admin Review**: Admins can approve or reject submissions
- **Category Filtering**: Photos can be filtered by location/category
- **Responsive Design**: Works on all device sizes
- **Cloudinary Integration**: Automatic image storage and optimization

## Setup Instructions

### 1. Cloudinary Configuration
1. Sign up for a free Cloudinary account at https://cloudinary.com
2. Get your Cloud Name from your dashboard
3. Create an upload preset:
   - Go to Settings > Upload
   - Scroll to "Upload presets"
   - Click "Add upload preset"
   - Set signing mode to "Unsigned"
   - Save the preset name

### 2. Update Configuration
In `gallery.js`, replace the placeholder values:
```javascript
const cloudName = "YOUR_CLOUDINARY_CLOUD_NAME"; // Your cloud name
const uploadPreset = "YOUR_CLOUDINARY_UPLOAD_PRESET"; // Your preset name
```

### 3. Admin Setup
To make a user an admin:
1. Go to your Firebase Console
2. Navigate to Firestore Database
3. Find the user document in the 'users' collection
4. Add a field: `isAdmin: true`

### 4. Firebase Security Rules
Add these rules to your Firestore security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read approved gallery photos
    match /galleryPhotos/{photoId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Users can submit photos for review
    match /gallerySubmissions/{submissionId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
      allow create: if request.auth != null;
    }
  }
}
```

## Usage

### For Users
1. Click "Get Featured" button
2. Fill in caption and select category
3. Upload photo
4. Submit for review

### For Admins
1. Admin button appears in navigation when logged in as admin
2. Click "Admin Panel" to view pending submissions
3. Approve or reject submissions
4. Rejected photos are automatically deleted from Cloudinary

## Categories
- Academic Blocks
- Hostels  
- Sports Complex
- General

## File Structure
- `gallery.html` - Main gallery page
- `gallery.js` - Gallery functionality and Firebase operations
- `app.js` - UI interactions and admin panel
- `auth.js` - Authentication and admin checking

## Notes
- Photos are automatically optimized by Cloudinary
- Rejected photos are permanently deleted
- Admin actions require confirmation for destructive operations
- The gallery is fully responsive and follows the site's design theme 