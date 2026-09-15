import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  createPost,
  updatePost,
  type AppNotification,
  type NotificationType,
  type Post,
  type PostFeedbackEntry,
  type PostStatus,
} from './firebase';
import { queuePublicationEmail } from './emailService';

export type EditorRef = { uid: string; displayName: string };

const ACTIVE_REVIEW_STATUSES: PostStatus[] = [
  'pending',
  'under_review',
  'changes_requested',
];

function currentEditorIdentity(): EditorRef | null {
  const user = auth.currentUser;
  if (!user) return null;
  return {
    uid: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'Editor',
  };
}

export async function createNotification(
  data: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> & { isRead?: boolean },
): Promise<{ success: boolean; error?: string }> {
  try {
    await addDoc(collection(db, 'notifications'), {
      ...data,
      isRead: data.isRead ?? false,
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: unknown) {
    console.error('createNotification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create notification.',
    };
  }
}

export async function findLeastLoadedEditor(): Promise<EditorRef | null> {
  try {
    const editorsQuery = query(
      collection(db, 'users'),
      where('role', 'in', ['editor', 'admin']),
    );
    const editorSnap = await getDocs(editorsQuery);

    if (editorSnap.empty) return null;

    const activeEditors: EditorRef[] = editorSnap.docs
      .map((d) => {
        const data = d.data();
        if (data.isBlocked === true) return null;
        return {
          uid: d.id,
          displayName: (data.displayName as string) || 'Editorial Board',
        };
      })
      .filter((e): e is EditorRef => e !== null);

    if (activeEditors.length === 0) return null;

    // Prefer discrete status queries to avoid composite index requirements on `in`
    const workloadMap: Record<string, number> = {};
    activeEditors.forEach((e) => {
      workloadMap[e.uid] = 0;
    });

    await Promise.all(
      ACTIVE_REVIEW_STATUSES.map(async (status) => {
        const postSnap = await getDocs(
          query(collection(db, 'posts'), where('status', '==', status)),
        );
        postSnap.docs.forEach((d) => {
          const assignedId = d.data().assignedEditorId as string | undefined;
          if (assignedId && workloadMap[assignedId] !== undefined) {
            workloadMap[assignedId] += 1;
          }
        });
      }),
    );

    return activeEditors.reduce((prev, curr) =>
      workloadMap[curr.uid] < workloadMap[prev.uid] ? curr : prev,
    );
  } catch (error) {
    console.error('findLeastLoadedEditor error:', error);
    return null;
  }
}

async function stampAssignment(
  postId: string,
  editor: EditorRef,
  notifyType: NotificationType,
  postTitle: string,
  senderId: string,
  senderName: string,
  message: string,
) {
  await updateDoc(doc(db, 'posts', postId), {
    assignedEditorId: editor.uid,
    assignedEditorName: editor.displayName,
    assignedAt: serverTimestamp(),
    status: 'pending' as PostStatus,
    updatedAt: serverTimestamp(),
  });

  await createNotification({
    recipientId: editor.uid,
    senderId,
    senderName,
    postId,
    postTitle,
    type: notifyType,
    message,
  });
}

export async function submitForReview(params: {
  title: string;
  content: string;
  description: string;
  photoUrl: string;
  genre: string;
  tags: string;
  postId?: string | null;
}): Promise<{ success: boolean; postId?: string; error?: string }> {
  const user = auth.currentUser;
  if (!user) return { success: false, error: 'You must be logged in.' };

  const senderName = user.displayName || user.email?.split('@')[0] || 'Author';
  let postId = params.postId ?? null;
  let existing: Post | null = null;

  try {
    if (postId) {
      const snap = await getDoc(doc(db, 'posts', postId));
      if (!snap.exists()) return { success: false, error: 'Post not found.' };
      existing = { id: snap.id, ...snap.data() } as Post;

      if (existing.authorId !== user.uid) {
        return { success: false, error: 'You are not authorized to submit this post.' };
      }

      const contentUpdate = await updatePost(postId, {
        title: params.title,
        content: params.content,
        description: params.description,
        photoUrl: params.photoUrl,
        genre: params.genre,
        tags: params.tags,
      });
      if (!contentUpdate.success) {
        return { success: false, error: contentUpdate.error || 'Failed to update post.' };
      }
    } else {
      const created = await createPost({
        title: params.title,
        content: params.content,
        description: params.description,
        photoUrl: params.photoUrl,
        genre: params.genre,
        tags: params.tags,
      });
      if (!created.success || !created.postId) {
        return { success: false, error: created.error || 'Failed to create post.' };
      }
      postId = created.postId;
    }

    const isResubmit = existing?.status === 'changes_requested' && !!existing.assignedEditorId;
    let editor: EditorRef | null = null;

    if (isResubmit && existing?.assignedEditorId) {
      editor = {
        uid: existing.assignedEditorId,
        displayName: existing.assignedEditorName || 'Editorial Board',
      };
    } else {
      editor = await findLeastLoadedEditor();
    }

    if (!editor) {
      // Still move to pending so staff can pick it up from Team Board
      await updateDoc(doc(db, 'posts', postId), {
        status: 'pending' as PostStatus,
        updatedAt: serverTimestamp(),
      });
      return {
        success: true,
        postId,
        error: 'Submitted, but no editors are available for auto-assignment yet.',
      };
    }

    await stampAssignment(
      postId,
      editor,
      isResubmit ? 'ARTICLE_RESUBMITTED' : 'ARTICLE_ALLOTTED',
      params.title,
      user.uid,
      senderName,
      isResubmit
        ? `${senderName} resubmitted "${params.title}" for your review.`
        : `New article "${params.title}" has been allotted to your queue.`,
    );

    return { success: true, postId };
  } catch (error: unknown) {
    console.error('submitForReview error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Submission failed.',
    };
  }
}

export async function markUnderReview(postId: string): Promise<{ success: boolean; error?: string }> {
  const editor = currentEditorIdentity();
  if (!editor) return { success: false, error: 'Authentication required.' };

  try {
    const snap = await getDoc(doc(db, 'posts', postId));
    if (!snap.exists()) return { success: false, error: 'Post not found.' };
    const post = snap.data() as Post;

    if (post.status === 'pending') {
      await updateDoc(doc(db, 'posts', postId), {
        status: 'under_review' as PostStatus,
        updatedAt: serverTimestamp(),
      });
    }
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark under review.',
    };
  }
}

export async function approvePost(postId: string): Promise<{ success: boolean; error?: string }> {
  const editor = currentEditorIdentity();
  if (!editor) return { success: false, error: 'Authentication required.' };

  try {
    const snap = await getDoc(doc(db, 'posts', postId));
    if (!snap.exists()) return { success: false, error: 'Post not found.' };
    const post = { id: snap.id, ...snap.data() } as Post;

    await updateDoc(doc(db, 'posts', postId), {
      status: 'approved' as PostStatus,
      reviewedBy: editor.uid,
      reviewedByName: editor.displayName,
      reviewedAt: serverTimestamp(),
      publishedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      rejectionReason: '',
    });

    await createNotification({
      recipientId: post.authorId,
      senderId: editor.uid,
      senderName: editor.displayName,
      postId,
      postTitle: post.title,
      type: 'ARTICLE_PUBLISHED',
      message: `Your article "${post.title}" is now live on GIKI Chronicles!`,
    });

    if (post.authorEmail) {
      await queuePublicationEmail({
        to: post.authorEmail,
        authorName: post.authorName,
        postTitle: post.title,
        postId,
      });
    }

    return { success: true };
  } catch (error: unknown) {
    console.error('approvePost error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve post.',
    };
  }
}

export async function requestChanges(
  postId: string,
  feedbackText: string,
): Promise<{ success: boolean; error?: string }> {
  const editor = currentEditorIdentity();
  if (!editor) return { success: false, error: 'Authentication required.' };
  if (!feedbackText.trim()) {
    return { success: false, error: 'Feedback is required when requesting revisions.' };
  }

  try {
    const snap = await getDoc(doc(db, 'posts', postId));
    if (!snap.exists()) return { success: false, error: 'Post not found.' };
    const post = { id: snap.id, ...snap.data() } as Post;

    const entry: PostFeedbackEntry = {
      id: `${Date.now()}_${editor.uid}`,
      editorId: editor.uid,
      editorName: editor.displayName,
      feedbackText: feedbackText.trim(),
      createdAt: Timestamp.now(),
      statusSnapshot: 'changes_requested',
    };

    const history = [...(post.feedbackHistory || []), entry];

    await updateDoc(doc(db, 'posts', postId), {
      status: 'changes_requested' as PostStatus,
      feedbackHistory: history,
      reviewedBy: editor.uid,
      reviewedByName: editor.displayName,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await createNotification({
      recipientId: post.authorId,
      senderId: editor.uid,
      senderName: editor.displayName,
      postId,
      postTitle: post.title,
      type: 'FEEDBACK_RECEIVED',
      message: `${editor.displayName} requested revisions on "${post.title}".`,
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('requestChanges error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to request changes.',
    };
  }
}

export async function rejectPost(
  postId: string,
  rejectionReason: string,
): Promise<{ success: boolean; error?: string }> {
  const editor = currentEditorIdentity();
  if (!editor) return { success: false, error: 'Authentication required.' };
  if (!rejectionReason.trim()) {
    return { success: false, error: 'A rejection reason is required.' };
  }

  try {
    const snap = await getDoc(doc(db, 'posts', postId));
    if (!snap.exists()) return { success: false, error: 'Post not found.' };
    const post = { id: snap.id, ...snap.data() } as Post;

    const entry: PostFeedbackEntry = {
      id: `${Date.now()}_${editor.uid}`,
      editorId: editor.uid,
      editorName: editor.displayName,
      feedbackText: rejectionReason.trim(),
      createdAt: Timestamp.now(),
      statusSnapshot: 'rejected',
    };

    const history = [...(post.feedbackHistory || []), entry];

    await updateDoc(doc(db, 'posts', postId), {
      status: 'rejected' as PostStatus,
      rejectionReason: rejectionReason.trim(),
      feedbackHistory: history,
      reviewedBy: editor.uid,
      reviewedByName: editor.displayName,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await createNotification({
      recipientId: post.authorId,
      senderId: editor.uid,
      senderName: editor.displayName,
      postId,
      postTitle: post.title,
      type: 'ARTICLE_REJECTED',
      message: `Your article "${post.title}" was not approved. See the editor's notes.`,
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('rejectPost error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject post.',
    };
  }
}

export async function reassignPost(
  postId: string,
  newEditor: EditorRef,
): Promise<{ success: boolean; error?: string }> {
  const editor = currentEditorIdentity();
  if (!editor) return { success: false, error: 'Authentication required.' };

  try {
    const snap = await getDoc(doc(db, 'posts', postId));
    if (!snap.exists()) return { success: false, error: 'Post not found.' };
    const post = { id: snap.id, ...snap.data() } as Post;

    await updateDoc(doc(db, 'posts', postId), {
      assignedEditorId: newEditor.uid,
      assignedEditorName: newEditor.displayName,
      assignedAt: serverTimestamp(),
      status: post.status === 'approved' || post.status === 'rejected'
        ? post.status
        : ('pending' as PostStatus),
      updatedAt: serverTimestamp(),
    });

    await createNotification({
      recipientId: newEditor.uid,
      senderId: editor.uid,
      senderName: editor.displayName,
      postId,
      postTitle: post.title,
      type: 'ARTICLE_ALLOTTED',
      message: `"${post.title}" has been reassigned to your queue.`,
    });

    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reassign post.',
    };
  }
}

export async function getEditorialQueue(options?: {
  assignedEditorId?: string;
  statuses?: PostStatus[];
}): Promise<{ success: boolean; posts?: Post[]; error?: string }> {
  try {
    const statuses =
      options?.statuses ??
      (['pending', 'under_review', 'changes_requested'] as PostStatus[]);

    const batches = await Promise.all(
      statuses.map(async (status) => {
        const constraints = [where('status', '==', status)];
        if (options?.assignedEditorId) {
          constraints.push(where('assignedEditorId', '==', options.assignedEditorId));
        }
        const snap = await getDocs(query(collection(db, 'posts'), ...constraints));
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
      }),
    );

    const posts = batches.flat().sort((a, b) => {
      const aTime = a.createdAt?.seconds ?? 0;
      const bTime = b.createdAt?.seconds ?? 0;
      return aTime - bTime;
    });

    return { success: true, posts };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load editorial queue.',
    };
  }
}

export async function getPublishedByEditor(
  editorId: string,
): Promise<{ success: boolean; posts?: Post[]; error?: string }> {
  try {
    const snap = await getDocs(
      query(
        collection(db, 'posts'),
        where('status', '==', 'approved'),
        where('reviewedBy', '==', editorId),
      ),
    );
    const posts = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Post))
      .sort((a, b) => (b.publishedAt?.seconds ?? 0) - (a.publishedAt?.seconds ?? 0));
    return { success: true, posts };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load published archive.',
    };
  }
}

export async function listActiveEditors(): Promise<{
  success: boolean;
  editors?: EditorRef[];
  error?: string;
}> {
  try {
    const snap = await getDocs(
      query(collection(db, 'users'), where('role', 'in', ['editor', 'admin', 'moderator'])),
    );
    const editors = snap.docs
      .map((d) => {
        const data = d.data();
        if (data.isBlocked === true) return null;
        return {
          uid: d.id,
          displayName: (data.displayName as string) || 'Editor',
        };
      })
      .filter((e): e is EditorRef => e !== null);
    return { success: true, editors };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list editors.',
    };
  }
}
