import { addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';

const SITE_ORIGIN =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://gikichronicles.web.app';

export async function queuePublicationEmail(params: {
  to: string;
  authorName: string;
  postTitle: string;
  postId: string;
}): Promise<{ success: boolean; error?: string }> {
  const { to, authorName, postTitle, postId } = params;

  if (!to?.trim()) {
    return { success: false, error: 'Author email is missing.' };
  }

  const articleUrl = `${SITE_ORIGIN}/posts/${postId}`;

  try {
    await addDoc(collection(db, 'mail'), {
      to: to.trim(),
      message: {
        subject: `Your article "${postTitle}" is now live on GIKI Chronicles!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
            <h2 style="color: #059669;">Congratulations, ${authorName}!</h2>
            <p>Your article <strong>"${postTitle}"</strong> has been reviewed, approved, and officially published on GIKI Chronicles.</p>
            <p>You can read and share your article using the link below:</p>
            <p>
              <a href="${articleUrl}"
                 style="display: inline-block; padding: 10px 20px; background-color: #059669; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Your Live Article
              </a>
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="font-size: 12px; color: #777;">GIKI Chronicles Editorial Board</p>
          </div>
        `,
      },
      metadata: {
        postId,
        notificationType: 'ARTICLE_PUBLISHED',
      },
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('queuePublicationEmail error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to queue email.',
    };
  }
}
