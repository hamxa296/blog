# Implementation Plan: Post Enhancements

## Goal
1. Allow users to edit their already-published articles. Doing so will safely revert the article to a `draft` status, unpublishing it so it can be reviewed again.
2. Automatically provide a default GIKI cover photo for posts if the user forgets to upload one.

## Proposed Changes

### 1. Allow Editing of Published Posts
- **`firestore.rules`**: Update the rules for `posts` to allow the author to edit posts that are currently in an `approved` status (changing it to `draft` or `pending`).
- **`Profile.tsx`**: In the 'My Posts' section, the "Edit" button is currently hidden for approved posts. We will remove this restriction so the "Edit" button is always visible for the author's own posts.

### 2. Default Cover Photo
- **`WritePost.tsx`**: When submitting a post or saving a draft, if the `photoUrl` is empty and no image was uploaded, we will automatically set it to `/background.webp` (a beautiful default GIKI picture already in your public assets folder). 

## Verification Plan
1. Edit an already published post from the Profile page.
2. Verify that clicking "Save Draft" or "Preview" correctly sets the post status back to `draft`.
3. Create a new post without providing a cover photo.
4. Verify that the post automatically uses `/background.webp` as its cover photo.

## User Review Required
Please review these changes. Re-editing a published post will temporarily take it down (unpublish it) until it gets re-approved. Is this the exact workflow you want? Let me know and I will proceed!
