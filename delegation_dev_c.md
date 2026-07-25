# Delegation Guide - Developer C

**Role:** Authentication, Database Integration, Moderation Dashboards, and Final Linkage
**Assigned Portion:** Portion 3 + Integration Phase

Your primary responsibility is to handle the core state management, secure routing, Firebase Database (Firestore) connections, user account management, and compile all branches together at the end.

---

## Technical Stack & Architecture

- **Build Tool:** Vite + React + TypeScript
- **Services Library:** Use standard modular Firebase v9+ or v10+ Web SDK packages (e.g. `import { getAuth } from 'firebase/auth'`).
- **Global Context:** Implement `AuthContext` to share user logs and authentication profile state down the component tree.
- **Routing:** Wrap private pages with a custom `<ProtectedRoute>` component to guard against unauthenticated sessions.

---

## Tasks & Walkthrough

### 1. Firebase API Services (`src/services/firebase.ts`)
- **Reference Files:** [combined.min.js](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/combined.min.js) and [firebase-config.js](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/firebase-config.js)
- **Action Items:**
  1. Refactor legacy client initialization calls to use modern ES modules syntax.
  2. Initialize Firebase using environment variables in Vite:
     ```typescript
     const firebaseConfig = {
       apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
       authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
       projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
       storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
       messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
       appId: import.meta.env.VITE_FIREBASE_APP_ID
     };
     ```
  3. Export standard Firestore helper utilities: `signUpUser`, `loginUser`, `logoutUser`, `signInWithGoogle`, `getApprovedPosts`, `getPostById`, `createPost`, `updateUserProfile`, etc.

### 2. Global Auth Context (`src/context/AuthContext.tsx`)
- **Action Items:**
  1. Create a `useAuth()` hook wrapper.
  2. Listen to standard Firebase Auth events via `onAuthStateChanged()`.
  3. Query the `users` collection to check user roles (e.g., if the user document contains an `isAdmin: true` flag).
  4. Build a `<ProtectedRoute>` component to protect write, profile edit, and admin dashboard views.

### 3. Authentication & Profile Pages (`src/pages/Login.tsx`, `Signup.tsx`, `Profile.tsx`)
- **Reference Files:** [login.html](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/login.html), [signup.html](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/signup.html), [profile.html](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/profile.html), and [firebase-error-handler.js](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/firebase-error-handler.js)
- **Action Items:**
  1. Port the login/signup layouts and validation rules. Enable standard credential forms and Google OAuth.
  2. Show clear user alerts using a custom Toast notifications hook.
  3. **Profile Panel:** Port the profile edit views (changing display names, avatar URLs). Hook up the avatar file input to upload directly to a Firebase Storage bucket.
  4. Renders a dashboard tab lists containing the logged-in user's own articles showing draft/approved/rejected statuses.

### 4. Blog Feed & Write Screen (`src/pages/BlogBrowse.tsx`, `BlogPostDetail.tsx`, `WritePost.tsx`)
- **Reference Files:** [browse.html](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/browse.html), [post_display.html](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/post_display.html), and [write.html](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/write.html)
- **Action Items:**
  1. **BlogBrowse:** Fetch approved blog posts from Firestore. Add client-side searching, genre category tags, and date sorting.
  2. **BlogPostDetail:** Handle route parameter inputs (e.g. `/posts/:id`) to retrieve and render full post contents, author, date, and headers.
  3. **WritePost:** Port the article editor form. Collect title, description, content, category, and main header image. Send document to Firestore under a pending review queue status.

### 5. Moderation Dashboards (`src/pages/AdminPortal.tsx`)
- **Action Items:**
  1. Create an admin dashboard to moderate submissions.
  2. Render queues of pending review posts, displaying options to **Approve**, **Reject**, or **Delete** posts.
  3. Display lists of registered users to allow blocking/flagging accounts.

### 6. Integration Steps
- **Action Items:**
  1. Merge completed branches of Developers A and B.
  2. Wire up all component routes inside `src/App.tsx`.
  3. Swap mock calendar events lists in `Calendar.tsx` with a live Firestore listener reading from the `events` collection.
  4. Swap mock image list arrays in `Gallery.tsx` with live collection queries reading from the `gallery` or `photos` collection.
  5. Swap mock landing page features in `Home.tsx` with a Firestore query loading the top 3 recent approved articles.

---

## Verification Checklist
- [ ] Attempting to navigate to `/write` or `/admin` when signed out redirects to `/login`.
- [ ] Logging in correctly establishes context state and pulls role information.
- [ ] Submitting articles sends documents to the pending Firestore queue.
- [ ] Admin approval switches post documents to approved, making them visible in the search browse grid and Home recent teaser grids.
- [ ] Running `npm run build` succeeds.
