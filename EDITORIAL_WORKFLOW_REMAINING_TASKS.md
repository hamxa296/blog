# 📋 Editorial Workflow — Remaining Features & Implementation Roadmap

> **Document Purpose:** Complete specification and actionable checklist of all remaining features, requirements, and architectural gaps identified across `Editorial_requirements.md`, user feedback, and the security audit. Use this document as your step-by-step implementation guide.

---

## 🎯 Executive Checklist of Remaining Work

- [ ] **1. "Notify Editor" / Trigger Resubmission Email Button in Article Editor**
- [ ] **2. Full Email Notification Suite in `emailService.ts`**
  - [ ] Author notification when changes are requested (`queueChangesRequestedEmail`)
  - [ ] Editor notification on author resubmission / manual trigger (`queueResubmissionEmail`)
  - [ ] Author notification on rejection (`queueRejectionEmail`)
- [ ] **3. Post Schema & Assignment Engine Updates**
  - [ ] Add `assignedEditorEmail` to `Post` interface in `firebase.ts`
  - [ ] Stamp `assignedEditorEmail` during auto-allotment and manual reassignment
- [ ] **4. Firestore Security Rules Update for `/mail`**
  - [ ] Allow authenticated authors to queue resubmission emails without permission errors
- [ ] **5. Restrict & Hide Main CMS from Editors**
  - [ ] Hide `/cms` link in `FloatingMenu.tsx` for editors (only show `/editor`)
  - [ ] Restrict `/cms` route in `App.tsx` and redirect editors to `/editor`
- [ ] **6. Fix Pre-existing Lint / Syntax Bug in `BlogBrowse.tsx`**

---

## 1. "Notify Editor" Button in Post Editor (`WritePost.tsx`)

### 1.1 Objective
When an author opens their article in the editor (`WritePost.tsx`)—especially after making requested revisions—provide an explicit, manual action button to trigger a resubmission email to their assigned editor (*"Notify Editor"*).

### 1.2 User Flow & UX
1. **Visibility Conditions:**
   - Post is being edited (`postIdToEdit` exists).
   - Post has an assigned editor (`post.assignedEditorId` is present).
   - Post status is `changes_requested` or `pending`.
2. **Button Location & Design:**
   - Positioned in the action footer or inside the sticky **"Editor Feedback"** callout card.
   - Styled as a distinct secondary/accent button with an envelope/send icon:
     ```tsx
     <Button
       type="button"
       variant="outline"
       disabled={isNotifying || cooldownActive}
       onClick={handleNotifyEditor}
       className="border-sky-500/40 text-sky-300 hover:bg-sky-500/10"
     >
       <Mail className="w-4 h-4 mr-2" />
       {isNotifying ? "Notifying..." : "Notify Editor of Changes"}
     </Button>
     ```
3. **Spam & Abuse Protection:**
   - Implement a 60-second cooldown in local storage or component state (e.g., `lastNotifiedTimestamp`) to prevent authors from spamming the editor's inbox.
   - Display a Sonner toast upon success: `toast.success("Editor has been notified of your changes via email.")`.

---

## 2. Complete Email Notification Suite (`emailService.ts`)

Currently, [emailService.ts](file:///c:/Users/hamzz/Desktop/Github/blog/src/services/emailService.ts) only implements `queuePublicationEmail()`. The remaining transactional email triggers must be implemented:

### 2.1 Changes Requested Email (Editor ➔ Author)
* **Function:** `queueChangesRequestedEmail(params: { to: string; authorName: string; postTitle: string; postId: string; editorName: string; feedbackText: string })`
* **Trigger Point:** Inside `requestChanges()` in [editorialService.ts](file:///c:/Users/hamzz/Desktop/Github/blog/src/services/editorialService.ts).
* **Subject:** `📝 Revisions Requested: "${postTitle}" on GIKI Chronicles`
* **Template Content:**
  - Greeting to author.
  - Notice that the editor reviewed their draft and requested revisions.
  - Highlight box with the editor's feedback notes (`feedbackText`).
  - Direct CTA button linking to: `https://gikichronicles.web.app/write?edit=${postId}`.

### 2.2 Resubmission / "Notify Editor" Email (Author ➔ Editor)
* **Function:** `queueResubmissionEmail(params: { to: string; editorName: string; authorName: string; postTitle: string; postId: string })`
* **Trigger Point:**
  1. Automatically inside `submitForReview()` when `isResubmit === true`.
  2. Manually when the author clicks the **"Notify Editor"** button in `WritePost.tsx`.
* **Subject:** `🔄 Article Resubmitted for Review: "${postTitle}"`
* **Template Content:**
  - Notice to the assigned editor that the author has updated their article and requested re-review.
  - Direct CTA button linking to: `https://gikichronicles.web.app/editor/review/${postId}`.

### 2.3 Rejection Email (Editor ➔ Author)
* **Function:** `queueRejectionEmail(params: { to: string; authorName: string; postTitle: string; rejectionReason: string })`
* **Trigger Point:** Inside `rejectPost()` in [editorialService.ts](file:///c:/Users/hamzz/Desktop/Github/blog/src/services/editorialService.ts).
* **Subject:** `Editorial Update: "${postTitle}" on GIKI Chronicles`
* **Template Content:**
  - Respectful notification that the submission was not accepted for publication.
  - Display of the editor's constructive explanation/rejection reason.

---

## 3. Data Schema & Assignment Engine Updates

### 3.1 Extended Post Model (`src/services/firebase.ts`)
Update the `Post` interface to persist the editor's email on the document:
```typescript
export interface Post {
  // Existing fields...
  assignedEditorId?: string;
  assignedEditorName?: string;
  assignedEditorEmail?: string; // <-- ADD THIS
  assignedAt?: Timestamp | null;
  // ...
}
```

### 3.2 Capturing Editor Email in `editorialService.ts`
1. Update `EditorRef` type:
   ```typescript
   export type EditorRef = { uid: string; displayName: string; email?: string };
   ```
2. In `findLeastLoadedEditor()`:
   - When mapping user documents from `collection(db, 'users')`, extract `email: data.email`.
3. In `stampAssignment()`:
   - Write `assignedEditorEmail: editor.email || ''` to the Firestore post document.
4. Fallback in `queueResubmissionEmail`:
   - If `post.assignedEditorEmail` is absent (legacy posts), lookup the editor's email in `users/{assignedEditorId}`.

---

## 4. Firestore Security Rules Update for `/mail`

### 4.1 Current Rule Deficiency
In [firestore.rules](file:///c:/Users/hamzz/Desktop/Github/blog/firestore.rules#L180-L183):
```firestore
match /mail/{mailId} {
  allow create: if isStaff();
  allow read, update, delete: if false;
}
```
* **Issue:** When a regular student author resubmits an article or clicks "Notify Editor", `isStaff()` evaluates to `false`, and Firestore denies the write to `/mail`.

### 4.2 Required Rule Adjustment
Update the rule to allow authenticated users to write emails specifically for permitted notification types:
```firestore
match /mail/{mailId} {
  allow create: if isAuthenticated() && (
    isStaff() ||
    (
      request.resource.data.metadata.notificationType in ['ARTICLE_RESUBMITTED', 'NOTIFY_EDITOR']
    )
  );
  allow read, update, delete: if false;
}
```

---

## 5. Access Control: Hiding Main CMS from Editors

### 5.1 Floating Navigation Menu (`src/components/nav/FloatingMenu.tsx`)
Currently, [FloatingMenu.tsx:L101-L105](file:///c:/Users/hamzz/Desktop/Github/blog/src/components/nav/FloatingMenu.tsx#L101-L105) sets:
```typescript
const isCms = profile?.isAdmin || profile?.role === 'admin' || profile?.role === 'editor' || profile?.role === 'moderator';
```
And conditionally renders both **"Editorial"** (`/editor`) and **"CMS"** (`/cms`).

#### Modification Required:
Separate the permissions:
```typescript
const isAdminUser = profile?.isAdmin === true || profile?.role === 'admin';
const isEditorStaff = profile?.role === 'editor' || profile?.role === 'moderator' || isAdminUser;

// In menuItems:
...(isEditorStaff ? [{ label: 'Editorial', path: '/editor' }] : []),
...(isAdminUser ? [{ label: 'CMS', path: '/cms' }] : []),
```
*Result:* Editors only see **Editorial**, while Admins see both **Editorial** and **CMS**.

### 5.2 Routing & Route Guards (`src/App.tsx` & `src/components/CmsRoute.tsx`)
1. In [App.tsx:L116-L122](file:///c:/Users/hamzz/Desktop/Github/blog/src/App.tsx#L116-L122):
   ```tsx
   {
     path: 'cms',
     element: (
       <CmsRoute allowedRoles={['admin']}>
         <CmsDashboard />
       </CmsRoute>
     ),
   }
   ```
2. In [CmsRoute.tsx:L27-L30](file:///c:/Users/hamzz/Desktop/Github/blog/src/components/CmsRoute.tsx#L27-L30):
   If an authenticated user with `role === 'editor'` attempts to access `/cms`, redirect them smoothly to `/editor` instead of showing Access Denied:
   ```tsx
   if (role === 'editor' && !allowedRoles.includes('editor')) {
     return <Navigate to="/editor" replace />;
   }
   ```

---

## 6. Pre-existing Code Hygiene (Syntax Error in `BlogBrowse.tsx`)

In [BlogBrowse.tsx:L44-L45](file:///c:/Users/hamzz/Desktop/Github/blog/src/pages/BlogBrowse.tsx#L44-L45), the first `useEffect` is currently missing its closing `}, []);`. This causes a build/lint parsing error:
```typescript
// CURRENT (BROKEN):
    fetchPosts();
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) return;

// FIXED:
    fetchPosts();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) return;
```

---

## 7. Recommended Implementation Order

1. **Step 1:** Fix the syntax error in `BlogBrowse.tsx` so the project builds and lints cleanly.
2. **Step 2:** Update `Post` interface in `firebase.ts` and `EditorRef` in `editorialService.ts` to include `assignedEditorEmail`.
3. **Step 3:** Add email helpers in `emailService.ts` (`queueChangesRequestedEmail`, `queueResubmissionEmail`, `queueRejectionEmail`).
4. **Step 4:** Wire email calls into `requestChanges()`, `rejectPost()`, and `submitForReview()` in `editorialService.ts`.
5. **Step 5:** Add the **"Notify Editor"** button into `WritePost.tsx`.
6. **Step 6:** Update `firestore.rules` for the `/mail` collection.
7. **Step 7:** Update `FloatingMenu.tsx`, `App.tsx`, and `CmsRoute.tsx` to restrict and hide the main CMS for editors.
