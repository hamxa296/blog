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
// Design system — mirrors the website exactly
//   Background : #09090b   (near-black, same as site body)
//   Card       : #111113   (slightly lighter surface)
//   Border     : #27272a   (zinc-800)
//   Text       : #fafafa   (site --color-foreground)
//   Muted      : #a1a1aa   (zinc-400)
//   Faint      : #52525b   (zinc-600)
//   Font       : Inter (Google Fonts)
// ---------------------------------------------------------------

/** Shared shell that wraps every email */
function buildEmailHtml(opts: {
  accentColor: string;       // e.g. '#22c55e'
  accentLabel: string;       // e.g. 'APPROVED'
  body: string;
}): string {
  const { accentColor, accentLabel, body } = opts;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <title>GIKI Chronicles</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:'Inter',ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111113;border:1px solid #27272a;border-radius:12px;overflow:hidden;">

          <!-- Header bar -->
          <tr>
            <td style="padding:32px 40px 28px;border-bottom:1px solid #27272a;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#52525b;font-weight:500;">GIKI Chronicles</p>
                    <p style="margin:0;font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#fafafa;">Editorial Board</p>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display:inline-block;padding:4px 12px;background:transparent;border:1px solid ${accentColor};border-radius:999px;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${accentColor};font-weight:600;">${accentLabel}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #1c1c1e;">
              <p style="margin:0;font-size:11px;color:#3f3f46;line-height:1.6;">
                This is an automated notification from the GIKI Chronicles Editorial System. Please do not reply directly to this email.
                If you need assistance, contact us at
                <a href="mailto:giki.chronicles@gmail.com" style="color:#52525b;text-decoration:underline;">giki.chronicles@gmail.com</a>.
              </p>
            </td>
          </tr>

        </table>

        <!-- Bottom wordmark -->
        <p style="margin:24px 0 0;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#3f3f46;text-align:center;">
          GIKI CHRONICLES &nbsp;&middot;&nbsp; Every Story Deserves to Be Told
        </p>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ---------------------------------------------------------------
// Shared prose helpers (inline styles for email clients)
// ---------------------------------------------------------------
const P  = `margin:0 0 16px;font-size:15px;line-height:1.7;color:#a1a1aa;`;
const H2 = `margin:0 0 24px;font-size:20px;font-weight:700;letter-spacing:-0.01em;color:#fafafa;`;

function calloutBlock(content: string, accentColor: string): string {
  return `<div style="background:#18181b;border:1px solid #27272a;border-left:3px solid ${accentColor};border-radius:8px;padding:20px 24px;margin:24px 0;">${content}</div>`;
}

function ctaButton(href: string, label: string, accentColor: string): string {
  const isDark = accentColor === '#27272a';
  const textColor = isDark ? '#a1a1aa' : '#09090b';
  return `<table cellpadding="0" cellspacing="0" style="margin:28px 0 8px;"><tr><td style="border-radius:8px;background:${accentColor};"><a href="${href}" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:${textColor};text-decoration:none;letter-spacing:0.01em;">${label}</a></td></tr></table><p style="margin:8px 0 0;font-size:12px;color:#3f3f46;">Or copy: <span style="color:#52525b;">${href}</span></p>`;
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

  const ACCENT = '#22c55e'; // green-500
  const articleUrl = `${SITE_ORIGIN}/posts/${postId}`;

  const body = `
    <h2 style="${H2}">Your article is live.</h2>
    <p style="${P}">Hi ${authorName},</p>
    <p style="${P}">Congratulations — your submission has passed editorial review and is now published on GIKI Chronicles.</p>
    ${calloutBlock(`
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#52525b;font-weight:600;">Published Article</p>
      <p style="margin:0;font-size:16px;font-weight:600;color:#fafafa;">&ldquo;${postTitle}&rdquo;</p>
    `, ACCENT)}
    <p style="${P}">Share it with your fellow GIKIans. Thank you for contributing to the community.</p>
    ${ctaButton(articleUrl, 'Read Your Article &rarr;', ACCENT)}
  `;

  return sendEmail({
    to,
    subject: `Published: "${postTitle}" — GIKI Chronicles`,
    bodyHtml: buildEmailHtml({ accentColor: ACCENT, accentLabel: 'APPROVED', body }),
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

  const ACCENT = '#f59e0b'; // amber-400
  const editorUrl = `${SITE_ORIGIN}/write?edit=${postId}`;

  const body = `
    <h2 style="${H2}">Revisions requested.</h2>
    <p style="${P}">Hi ${authorName},</p>
    <p style="${P}">Your editor <strong style="color:#fafafa;font-weight:600;">${editorName}</strong> has reviewed <strong style="color:#fafafa;font-weight:600;">&ldquo;${postTitle}&rdquo;</strong> and is requesting changes before it can be published.</p>
    ${calloutBlock(`
      <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#52525b;font-weight:600;">Editor's Notes</p>
      <p style="margin:0;font-size:14px;line-height:1.75;color:#d4d4d8;white-space:pre-wrap;">${feedbackText}</p>
    `, ACCENT)}
    <p style="${P}">Address the feedback above, then resubmit your article from the editor.</p>
    ${ctaButton(editorUrl, 'Open Your Draft &rarr;', ACCENT)}
  `;

  return sendEmail({
    to,
    subject: `Revisions Requested: "${postTitle}" — GIKI Chronicles`,
    bodyHtml: buildEmailHtml({ accentColor: ACCENT, accentLabel: 'CHANGES REQUESTED', body }),
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

  const ACCENT = '#fafafa'; // white — clean, neutral, editorial
  const reviewUrl = `${SITE_ORIGIN}/editor/review/${postId}`;

  const body = `
    <h2 style="${H2}">New article in your queue.</h2>
    <p style="${P}">Hi ${editorName},</p>
    <p style="${P}"><strong style="color:#fafafa;font-weight:600;">${authorName}</strong> has submitted an article for your review.</p>
    ${calloutBlock(`
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#52525b;font-weight:600;">Submitted Article</p>
      <p style="margin:0;font-size:16px;font-weight:600;color:#fafafa;">&ldquo;${postTitle}&rdquo;</p>
    `, '#3f3f46')}
    <p style="${P}">Open your editor workspace to begin the review.</p>
    ${ctaButton(reviewUrl, 'Open Review &rarr;', ACCENT)}
  `;

  return sendEmail({
    to,
    subject: `Review Request: "${postTitle}" — GIKI Chronicles`,
    bodyHtml: buildEmailHtml({ accentColor: ACCENT, accentLabel: 'PENDING REVIEW', body }),
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

  const ACCENT = '#ef4444'; // red-500
  const browseUrl = `${SITE_ORIGIN}/browse`;

  const body = `
    <h2 style="${H2}">Submission not accepted.</h2>
    <p style="${P}">Hi ${authorName},</p>
    <p style="${P}">Thank you for submitting to GIKI Chronicles. After careful review, the editorial board has decided not to publish <strong style="color:#fafafa;font-weight:600;">&ldquo;${postTitle}&rdquo;</strong> at this time.</p>
    ${calloutBlock(`
      <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#52525b;font-weight:600;">Reason</p>
      <p style="margin:0;font-size:14px;line-height:1.75;color:#d4d4d8;white-space:pre-wrap;">${rejectionReason}</p>
    `, ACCENT)}
    <p style="${P}">We encourage you to keep writing. Every great author refines their craft over time — we hope to see your future work on GIKI Chronicles.</p>
    ${ctaButton(browseUrl, 'Read Other Articles &rarr;', '#27272a')}
  `;

  return sendEmail({
    to,
    subject: `Submission Update: "${postTitle}" — GIKI Chronicles`,
    bodyHtml: buildEmailHtml({ accentColor: ACCENT, accentLabel: 'NOT ACCEPTED', body }),
  });
}

