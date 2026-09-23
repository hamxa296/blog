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
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string | undefined;
const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  as string | undefined;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
const REPLY_TO    = import.meta.env.VITE_EMAILJS_REPLY_TO    as string | undefined;

const SITE_ORIGIN =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://gikichronicles.web.app';

let _initialised = false;
function ensureInit() {
  if (_initialised || !PUBLIC_KEY) return;
  emailjs.init({ publicKey: PUBLIC_KEY });
  _initialised = true;
}

// ---------------------------------------------------------------
// Brand design system — exactly as used on the site
//   #08080a   body background
//   #111113   card surface
//   #1c1c1e   inner panels / dividers
//   #27272a   border (zinc-800)
//   #fd4378   brand pink  ← site maps ALL pink-400/500/600 here
//   #fafafa   primary text
//   #a1a1aa   muted text
//   #52525b   faint labels
//   Inter     same Google font the site loads
// ---------------------------------------------------------------

function buildEmailHtml(opts: {
  statusLabel: string;
  statusColor: string;
  body: string;
}): string {
  const { statusLabel, statusColor, body } = opts;
  return (
    '<!DOCTYPE html>' +
    '<html lang="en">' +
    '<head>' +
    '<meta charset="UTF-8" />' +
    '<meta name="viewport" content="width=device-width,initial-scale=1.0" />' +
    '<link rel="preconnect" href="https://fonts.googleapis.com" />' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />' +
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />' +
    '<title>GIKI Chronicles</title>' +
    '</head>' +
    '<body style="margin:0;padding:0;background:#08080a;font-family:\'Inter\',ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased;">' +

    // outer table
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#08080a;padding:40px 16px;">' +
    '<tr><td align="center">' +

    // card
    '<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#111113;border:1px solid #27272a;border-radius:16px;overflow:hidden;">' +

    // ── pink glow bar ──
    '<tr><td style="height:3px;background:linear-gradient(90deg,#fd4378 0%,#ff6b9d 50%,#fd4378 100%);font-size:0;line-height:0;">&nbsp;</td></tr>' +

    // ── header ──
    '<tr><td style="padding:28px 36px 22px;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>' +
    // wordmark
    '<td valign="middle">' +
    '<span style="font-size:13px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:#fafafa;">GIKI</span>' +
    '<span style="font-size:13px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:#fd4378;"> CHRONICLES</span>' +
    '<p style="margin:5px 0 0;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#52525b;font-weight:500;">Editorial Board</p>' +
    '</td>' +
    // status pill
    '<td align="right" valign="middle">' +
    '<span style="display:inline-block;padding:5px 14px;border:1px solid ' + statusColor + ';border-radius:999px;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:' + statusColor + ';font-weight:700;">' + statusLabel + '</span>' +
    '</td>' +
    '</tr></table>' +
    '</td></tr>' +

    // divider
    '<tr><td style="height:1px;background:#1c1c1e;font-size:0;line-height:0;">&nbsp;</td></tr>' +

    // ── body ──
    '<tr><td style="padding:32px 36px;">' +
    body +
    '</td></tr>' +

    // divider
    '<tr><td style="height:1px;background:#1c1c1e;font-size:0;line-height:0;">&nbsp;</td></tr>' +

    // ── footer ──
    '<tr><td style="padding:18px 36px 24px;">' +
    '<p style="margin:0;font-size:11px;line-height:1.6;color:#3f3f46;">' +
    'Automated notification &mdash; do not reply to this email.<br />' +
    'Questions? <a href="mailto:giki.chronicles@gmail.com" style="color:#fd4378;text-decoration:none;">giki.chronicles@gmail.com</a>' +
    '</p>' +
    '</td></tr>' +

    '</table>' + // /card

    // bottom wordmark
    '<p style="margin:20px 0 0;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#3f3f46;text-align:center;">' +
    '<span style="color:#fafafa;">GIKI</span><span style="color:#fd4378;"> CHRONICLES</span>' +
    ' &nbsp;&middot;&nbsp; Every Story Deserves to Be Told' +
    '</p>' +

    '</td></tr></table>' + // /outer
    '</body></html>'
  );
}

// ── Inline body helpers ─────────────────────────────────────────

function heading(text: string): string {
  return '<h2 style="margin:0 0 18px;font-size:21px;font-weight:800;letter-spacing:-0.02em;color:#fafafa;line-height:1.25;">' + text + '</h2>';
}

function para(text: string): string {
  return '<p style="margin:0 0 14px;font-size:14px;line-height:1.75;color:#a1a1aa;">' + text + '</p>';
}

/** Dark callout card with a coloured left accent strip */
function callout(label: string, content: string, accent: string): string {
  return (
    '<div style="background:#0d0d0f;border:1px solid #27272a;border-left:3px solid ' + accent + ';border-radius:10px;padding:18px 22px;margin:20px 0;">' +
    '<p style="margin:0 0 8px;font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#52525b;font-weight:700;">' + label + '</p>' +
    content +
    '</div>'
  );
}

/** Table-based CTA button (works in all email clients) */
function cta(href: string, label: string, bg: string, fg = '#08080a'): string {
  return (
    '<table cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0 6px;">' +
    '<tr><td style="border-radius:8px;background:' + bg + ';box-shadow:0 0 20px ' + bg + '55;">' +
    '<a href="' + href + '" style="display:inline-block;padding:12px 26px;font-size:13px;font-weight:700;color:' + fg + ';text-decoration:none;letter-spacing:0.02em;">' + label + ' &rarr;</a>' +
    '</td></tr></table>' +
    '<p style="margin:6px 0 0;font-size:11px;color:#3f3f46;">Or paste: <span style="color:#52525b;word-break:break-all;">' + href + '</span></p>'
  );
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
// 1. Article Approved → Author
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

  const body =
    heading('Your article is live.') +
    para('Hi <strong style="color:#fafafa;font-weight:600;">' + authorName + '</strong>,') +
    para('Congratulations &mdash; your submission passed editorial review and is now published on GIKI Chronicles.') +
    callout('Published Article',
      '<p style="margin:0;font-size:15px;font-weight:700;color:#fafafa;">&ldquo;' + postTitle + '&rdquo;</p>',
      '#fd4378') +
    para('Share it with your fellow GIKIans. Thank you for contributing to the community.') +
    cta(articleUrl, 'Read Your Article', '#fd4378');

  return sendEmail({
    to,
    subject: `Published: "${postTitle}" — GIKI Chronicles`,
    bodyHtml: buildEmailHtml({ statusLabel: 'APPROVED', statusColor: '#22c55e', body }),
  });
}

// ---------------------------------------------------------------
// 2. Changes Requested → Author
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

  const body =
    heading('Your editor left feedback.') +
    para('Hi <strong style="color:#fafafa;font-weight:600;">' + authorName + '</strong>,') +
    para('<strong style="color:#fafafa;font-weight:600;">' + editorName + '</strong> has reviewed your article and is requesting changes before it can go live.') +
    callout('Article',
      '<p style="margin:0;font-size:14px;font-weight:700;color:#fafafa;">&ldquo;' + postTitle + '&rdquo;</p>',
      '#fd4378') +
    callout("Editor's Notes",
      '<p style="margin:0;font-size:13px;line-height:1.8;color:#d4d4d8;white-space:pre-wrap;">' + feedbackText + '</p>',
      '#f59e0b') +
    para('Address the feedback, then resubmit your article from the editor.') +
    cta(editorUrl, 'Open Your Draft', '#fd4378');

  return sendEmail({
    to,
    subject: `Revisions Requested: "${postTitle}" — GIKI Chronicles`,
    bodyHtml: buildEmailHtml({ statusLabel: 'CHANGES REQUESTED', statusColor: '#f59e0b', body }),
  });
}

// ---------------------------------------------------------------
// 3. Review Request → Editor  (new allotment or resubmission)
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

  const body =
    heading('New article in your queue.') +
    para('Hi <strong style="color:#fafafa;font-weight:600;">' + editorName + '</strong>,') +
    para('<strong style="color:#fafafa;font-weight:600;">' + authorName + '</strong> has submitted an article for your review.') +
    callout('Submitted Article',
      '<p style="margin:0;font-size:15px;font-weight:700;color:#fafafa;">&ldquo;' + postTitle + '&rdquo;</p>',
      '#fd4378') +
    para('Open your workspace to begin the review.') +
    cta(reviewUrl, 'Open Review', '#fd4378');

  return sendEmail({
    to,
    subject: `Review Request: "${postTitle}" — GIKI Chronicles`,
    bodyHtml: buildEmailHtml({ statusLabel: 'PENDING REVIEW', statusColor: '#fd4378', body }),
  });
}

// ---------------------------------------------------------------
// 4. Rejection → Author
// ---------------------------------------------------------------
export async function queueRejectionEmail(params: {
  to: string;
  authorName: string;
  postTitle: string;
  rejectionReason: string;
}): Promise<{ success: boolean; error?: string }> {
  const { to, authorName, postTitle, rejectionReason } = params;
  if (!to?.trim()) return { success: false, error: 'Author email is missing.' };

  const browseUrl = `${SITE_ORIGIN}/browse`;

  const body =
    heading('Submission not accepted.') +
    para('Hi <strong style="color:#fafafa;font-weight:600;">' + authorName + '</strong>,') +
    para('Thank you for submitting to GIKI Chronicles. After careful review, the editorial board has decided not to publish <strong style="color:#fafafa;font-weight:600;">&ldquo;' + postTitle + '&rdquo;</strong> at this time.') +
    callout('Reason',
      '<p style="margin:0;font-size:13px;line-height:1.8;color:#d4d4d8;white-space:pre-wrap;">' + rejectionReason + '</p>',
      '#ef4444') +
    para('We encourage you to keep writing &mdash; every great author refines their craft over time. We hope to see your future work on GIKI Chronicles.') +
    cta(browseUrl, 'Browse Other Articles', '#27272a', '#a1a1aa');

  return sendEmail({
    to,
    subject: `Submission Update: "${postTitle}" — GIKI Chronicles`,
    bodyHtml: buildEmailHtml({ statusLabel: 'NOT ACCEPTED', statusColor: '#ef4444', body }),
  });
}
