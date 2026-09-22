/**
 * emailService.ts
 *
 * Sends transactional emails via EmailJS (https://www.emailjs.com).
 * Works entirely client-side — no Cloud Functions or Blaze plan required.
 *
 * SETUP (one-time, ~5 minutes):
 *  1. Sign up at https://www.emailjs.com (free — 200 emails/month)
 *  2. Add a service: Email Services → Add Service → Gmail (connect your account)
 *  3. Create ONE template called "giki_editorial":
 *       To:      {{to_email}}
 *       Subject: {{subject}}
 *       Body:    (switch to HTML mode) {{{message_html}}}
 *       Note: use triple braces {{{ }}} so HTML is NOT escaped.
 *  4. Go to Account → API Keys → copy your Public Key
 *  5. Add these to your .env file:
 *       VITE_EMAILJS_PUBLIC_KEY=your_public_key
 *       VITE_EMAILJS_SERVICE_ID=your_service_id      (e.g. "service_abc123")
 *       VITE_EMAILJS_TEMPLATE_ID=your_template_id    (e.g. "template_xyz789")
 */

import emailjs from '@emailjs/browser';

// ---------------------------------------------------------------
// Config — pulled from environment variables
// ---------------------------------------------------------------
const PUBLIC_KEY   = import.meta.env.VITE_EMAILJS_PUBLIC_KEY   as string | undefined;
const SERVICE_ID   = import.meta.env.VITE_EMAILJS_SERVICE_ID   as string | undefined;
const TEMPLATE_ID  = import.meta.env.VITE_EMAILJS_TEMPLATE_ID  as string | undefined;
// Optional: where replies go (e.g. editorial@gikichronicles.com)
const REPLY_TO     = import.meta.env.VITE_EMAILJS_REPLY_TO     as string | undefined;

const SITE_ORIGIN =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://gikichronicles.web.app';

// Lazy-initialise once
let _initialised = false;
function ensureInit() {
  if (_initialised || !PUBLIC_KEY) return;
  emailjs.init({ publicKey: PUBLIC_KEY });
  _initialised = true;
}

// ---------------------------------------------------------------
// Shared HTML wrapper — same branded design as before
// ---------------------------------------------------------------
function buildEmailHtml(bodyContent: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111; background: #fff; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0A1931, #1A3D63); padding: 28px 32px;">
        <p style="margin:0; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,0.6);">GIKI Chronicles</p>
        <h1 style="margin: 8px 0 0; color: #fff; font-size: 20px; font-weight: 600;">Editorial Board</h1>
      </div>
      <div style="padding: 32px;">
        ${bodyContent}
        <hr style="border: none; border-top: 1px solid #eee; margin: 28px 0;" />
        <p style="font-size: 12px; color: #888; margin: 0;">GIKI Chronicles Editorial Board — This is an automated notification, please do not reply directly to this email.</p>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------
// Core send helper
// ---------------------------------------------------------------
async function sendEmail(params: {
  to: string;
  subject: string;
  bodyHtml: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!PUBLIC_KEY || !SERVICE_ID || !TEMPLATE_ID) {
    const msg =
      'EmailJS is not configured. Set VITE_EMAILJS_PUBLIC_KEY, VITE_EMAILJS_SERVICE_ID, and VITE_EMAILJS_TEMPLATE_ID in your .env file.';
    console.warn('[emailService]', msg);
    // Return success:false but don't throw — caller handles gracefully
    return { success: false, error: msg };
  }

  ensureInit();

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
      to_email:     params.to.trim(),
      subject:      params.subject,
      message_html: params.bodyHtml,
      reply_to:     REPLY_TO || '',
    });
    return { success: true };
  } catch (error: unknown) {
    // EmailJS throws plain objects like { status: 400, text: "The recipients address is empty" }
    // not Error instances, so we need to extract manually.
    let msg: string;
    if (error instanceof Error) {
      msg = error.message;
    } else if (typeof error === 'object' && error !== null) {
      const ejsErr = error as { text?: string; status?: number };
      msg = ejsErr.text
        ? `[${ejsErr.status ?? '?'}] ${ejsErr.text}`
        : JSON.stringify(error);
    } else {
      msg = String(error);
    }
    console.error('[emailService] Send failed:', msg);
    return { success: false, error: msg };
  }
}

// ---------------------------------------------------------------
// 1. Publication email  (Article Approved → Author)
// ---------------------------------------------------------------
export async function queuePublicationEmail(params: {
  to: string;
  authorName: string;
  postTitle: string;
  postId: string;
}): Promise<{ success: boolean; error?: string }> {
  const { to, authorName, postTitle, postId } = params;
  if (!to?.trim()) return { success: false, error: 'Author email is missing.' };

  const articleUrl = `${SITE_ORIGIN}/posts/${postId}`;

  const body = `
    <h2 style="color: #059669; margin-top: 0;">Congratulations, ${authorName}! 🎉</h2>
    <p>Your article <strong>"${postTitle}"</strong> has been reviewed, approved, and is now officially live on GIKI Chronicles.</p>
    <p>Share it with your friends and fellow GIKIans:</p>
    <p style="margin: 24px 0;">
      <a href="${articleUrl}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">View Your Live Article</a>
    </p>
    <p style="font-size: 14px; color: #555;">Thank you for contributing to the GIKI Chronicles community. We look forward to your next piece!</p>
  `;

  return sendEmail({
    to,
    subject: `Your article "${postTitle}" is now live on GIKI Chronicles! 🎉`,
    bodyHtml: buildEmailHtml(body),
  });
}

// ---------------------------------------------------------------
// 2. Changes requested email  (Editor → Author)
// ---------------------------------------------------------------
export async function queueChangesRequestedEmail(params: {
  to: string;
  authorName: string;
  postTitle: string;
  postId: string;
  editorName: string;
  feedbackText: string;
}): Promise<{ success: boolean; error?: string }> {
  const { to, authorName, postTitle, postId, editorName, feedbackText } = params;
  if (!to?.trim()) return { success: false, error: 'Author email is missing.' };

  const editorUrl = `${SITE_ORIGIN}/write?edit=${postId}`;

  const body = `
    <h2 style="color: #d97706; margin-top: 0;">Revisions Requested for "${postTitle}"</h2>
    <p>Hi ${authorName},</p>
    <p>Your editor <strong>${editorName}</strong> has reviewed your article and has requested some changes before it can be published.</p>
    <div style="background: #fef3c7; border-left: 4px solid #d97706; padding: 16px 20px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #92400e;">Editor's Notes:</p>
      <p style="margin: 0; color: #111; white-space: pre-wrap;">${feedbackText}</p>
    </div>
    <p>Please make the requested changes and resubmit your article.</p>
    <p style="margin: 24px 0;">
      <a href="${editorUrl}" style="display: inline-block; padding: 12px 24px; background-color: #d97706; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Open Your Article</a>
    </p>
  `;

  return sendEmail({
    to,
    subject: `📝 Revisions Requested: "${postTitle}" on GIKI Chronicles`,
    bodyHtml: buildEmailHtml(body),
  });
}

// ---------------------------------------------------------------
// 3. Resubmission / allotment email  (Author → Editor)
// ---------------------------------------------------------------
export async function queueResubmissionEmail(params: {
  to: string;
  editorName: string;
  authorName: string;
  postTitle: string;
  postId: string;
}): Promise<{ success: boolean; error?: string }> {
  const { to, editorName, authorName, postTitle, postId } = params;
  if (!to?.trim()) return { success: false, error: 'Editor email is missing.' };

  const reviewUrl = `${SITE_ORIGIN}/editor/review/${postId}`;

  const body = `
    <h2 style="color: #3b82f6; margin-top: 0;">Article Ready for Review</h2>
    <p>Hi ${editorName},</p>
    <p><strong>${authorName}</strong> has submitted an article for your review:</p>
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; font-size: 16px; font-weight: 600;">"${postTitle}"</p>
    </div>
    <p style="margin: 24px 0;">
      <a href="${reviewUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Open Review</a>
    </p>
  `;

  return sendEmail({
    to,
    subject: `📬 Article Submitted for Review: "${postTitle}"`,
    bodyHtml: buildEmailHtml(body),
  });
}

// ---------------------------------------------------------------
// 4. Rejection email  (Editor → Author)
// ---------------------------------------------------------------
export async function queueRejectionEmail(params: {
  to: string;
  authorName: string;
  postTitle: string;
  rejectionReason: string;
}): Promise<{ success: boolean; error?: string }> {
  const { to, authorName, postTitle, rejectionReason } = params;
  if (!to?.trim()) return { success: false, error: 'Author email is missing.' };

  const body = `
    <h2 style="color: #dc2626; margin-top: 0;">Update on Your Submission</h2>
    <p>Hi ${authorName},</p>
    <p>After careful review, the editorial board has decided not to publish your article <strong>"${postTitle}"</strong> at this time.</p>
    <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px 20px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #991b1b;">Reason:</p>
      <p style="margin: 0; color: #111; white-space: pre-wrap;">${rejectionReason}</p>
    </div>
    <p style="font-size: 14px; color: #555;">We encourage you to keep writing and submit future pieces to GIKI Chronicles. Thank you for your contribution.</p>
  `;

  return sendEmail({
    to,
    subject: `Regarding Your Submission: "${postTitle}"`,
    bodyHtml: buildEmailHtml(body),
  });
}
