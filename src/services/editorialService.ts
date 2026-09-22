import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
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
import {
  queuePublicationEmail,
  queueChangesRequestedEmail,
  queueResubmissionEmail,
  queueRejectionEmail,
} from './emailService';

export type EditorRef = { uid: string; displayName: string; email?: string };

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
    // STRICT: only users explicitly assigned role:'editor' or role:'admin' are eligible.
    // We do NOT fall back to isAdmin:true to prevent regular users from accidentally
    // entering the editor pool if their doc has stale/incorrect flags.
    const roleSnap = await getDocs(
      query(collection(db, 'users'), where('role', 'in', ['editor', 'admin'])),
    );

    if (roleSnap.empty) {
      console.warn('[findLeastLoadedEditor] No users with role=editor or role=admin found.');
      return null;
    }

    type LoadedEditor = EditorRef & { load: number };
    const activeEditors: LoadedEditor[] = roleSnap.docs
      .map((d) => {
        const data = d.data();
        if (data.isBlocked === true) return null;
        return {
          uid: d.id,
          displayName: (data.displayName as string) || 'Editorial Board',
          email: (data.email as string) || undefined,
          load: typeof data.editorialLoad === 'number' ? (data.editorialLoad as number) : 0,
        } as LoadedEditor;
      })
      .filter((e): e is LoadedEditor => e !== null);

    if (activeEditors.length === 0) {
      console.warn('[findLeastLoadedEditor] All eligible editors are blocked.');
      return null;
    }

    const chosen = activeEditors.reduce((prev, curr) => curr.load < prev.load ? curr : prev);
    console.log('[findLeastLoadedEditor] Chosen:', chosen.displayName, '(load:', chosen.load, ')');
    return chosen;
  } catch (error) {
    console.error('[findLeastLoadedEditor] Error:', error);
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
    assignedEditorEmail: editor.email || '',
    assignedAt: serverTimestamp(),
    status: 'pending' as PostStatus,
    updatedAt: serverTimestamp(),
  });

  // Increment the editor's active load counter (used by findLeastLoadedEditor)
  void updateDoc(doc(db, 'users', editor.uid), {
    editorialLoad: increment(1),
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

    // Email the assigned editor — both on first allotment and on resubmission
    if (editor.email) {
      queueResubmissionEmail({
        to: editor.email,
        editorName: editor.displayName,
        authorName: senderName,
        postTitle: params.title,
        postId,
      }).then((res) => {
        if (!res.success) console.error('[submitForReview] Editor email failed:', res.error);
      }).catch((e) => console.error('[submitForReview] Editor email error:', e));
    } else {
      console.warn('[submitForReview] Editor has no email address on file — skipping email notification.');
    }

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

    // Decrement the editor's load counter — article is resolved
    if (post.assignedEditorId) {
      void updateDoc(doc(db, 'users', post.assignedEditorId), {
        editorialLoad: increment(-1),
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

    // Send email to author with feedback details
    if (post.authorEmail) {
      queueChangesRequestedEmail({
        to: post.authorEmail,
        authorName: post.authorName,
        postTitle: post.title,
        postId,
        editorName: editor.displayName,
        feedbackText: feedbackText.trim(),
      }).then((res) => {
        if (!res.success) console.error('[requestChanges] Author email failed:', res.error);
      }).catch((e) => console.error('[requestChanges] Author email error:', e));
    } else {
      console.warn('[requestChanges] No authorEmail on post — skipping revision email.');
    }

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

    // Send rejection email to author with the reason
    if (post.authorEmail) {
      void queueRejectionEmail({
        to: post.authorEmail,
        authorName: post.authorName,
        postTitle: post.title,
        rejectionReason: rejectionReason.trim(),
      });
    }

    // Decrement the editor's load counter — article is resolved
    if (post.assignedEditorId) {
      void updateDoc(doc(db, 'users', post.assignedEditorId), {
        editorialLoad: increment(-1),
      });
    }

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
      assignedEditorEmail: newEditor.email || '',
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

export type EditorProfile = EditorRef & {
  role: string;
  editorialLoad: number;
  photoURL?: string;
};

export async function listActiveEditors(): Promise<{
  success: boolean;
  editors?: EditorProfile[];
  error?: string;
}> {
  try {
    // 1. Fetch all editorial staff
    const snap = await getDocs(
      query(collection(db, 'users'), where('role', 'in', ['editor', 'admin', 'moderator'])),
    );

    const staffDocs = snap.docs.filter((d) => d.data().isBlocked !== true);
    if (staffDocs.length === 0) return { success: true, editors: [] };

    // 2. Compute real-time workload from actual post documents.
    //    This runs in an editor/admin context so staff permissions apply.
    //    Query one status at a time (Firestore doesn't support status IN + assignedEditorId
    //    without a composite index per pair).
    const ACTIVE_STATUSES: PostStatus[] = ['pending', 'under_review', 'changes_requested'];
    const loadMap: Record<string, number> = {};
    staffDocs.forEach((d) => { loadMap[d.id] = 0; });

    await Promise.all(
      ACTIVE_STATUSES.map(async (status) => {
        const postsSnap = await getDocs(
          query(collection(db, 'posts'), where('status', '==', status)),
        );
        postsSnap.docs.forEach((pd) => {
          const assignedId = pd.data().assignedEditorId as string | undefined;
          if (assignedId && assignedId in loadMap) {
            loadMap[assignedId] = (loadMap[assignedId] ?? 0) + 1;
          }
        });
      }),
    );

    const editors = staffDocs.map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        displayName: (data.displayName as string) || 'Editor',
        email: (data.email as string) || undefined,
        role: (data.role as string) || 'editor',
        editorialLoad: loadMap[d.id] ?? 0, // live count, not stale counter
        photoURL: (data.photoURL as string) || undefined,
      };
    });

    return { success: true, editors };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list editors.',
    };
  }
}


// ---------------------------------------------------------------
// "Notify Editor" — manual trigger by the author from WritePost.tsx
// Looks up the assigned editor's email from the post document and
// fires a resubmission notification email.
// ---------------------------------------------------------------
export async function notifyEditorByEmail(postId: string): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user) return { success: false, error: 'You must be logged in.' };

  try {
    const snap = await getDoc(doc(db, 'posts', postId));
    if (!snap.exists()) return { success: false, error: 'Post not found.' };
    const post = { id: snap.id, ...snap.data() } as Post;

    if (post.authorId !== user.uid) {
      return { success: false, error: 'You are not authorized to notify for this post.' };
    }

    if (!post.assignedEditorId) {
      return { success: false, error: 'No editor is currently assigned to this article.' };
    }

    // Resolve editor email: prefer the denormalized field, fall back to user doc lookup
    let editorEmail = post.assignedEditorEmail;
    let editorName = post.assignedEditorName || 'Editor';

    if (!editorEmail) {
      const editorDoc = await getDoc(doc(db, 'users', post.assignedEditorId));
      if (editorDoc.exists()) {
        const data = editorDoc.data();
        editorEmail = (data.email as string) || undefined;
        editorName = (data.displayName as string) || editorName;
      }
    }

    if (!editorEmail) {
      return { success: false, error: 'Could not resolve editor email. Please contact the editorial team directly.' };
    }

    const authorName = user.displayName || user.email?.split('@')[0] || 'Author';

    const res = await queueResubmissionEmail({
      to: editorEmail,
      editorName,
      authorName,
      postTitle: post.title,
      postId,
    });

    return res;
  } catch (error: unknown) {
    console.error('notifyEditorByEmail error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to notify editor.',
    };
  }
}
