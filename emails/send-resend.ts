import { Resend } from 'resend';
import { renderPromotionalEmail } from './render';

/**
 * Initialize Resend client
 * Make sure to set RESEND_API_KEY in your environment variables
 */
const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendPromotionalEmailOptions {
  to: string | string[];
  repositoryUrl?: string;
  repositoryStars?: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send promotional email via Resend
 * @param options - Email sending options
 * @returns Resend response with email ID
 */
export async function sendPromotionalEmail(options: SendPromotionalEmailOptions) {
  const { to, repositoryUrl, repositoryStars, from = 'CodinIT <noreply@codinit.dev>', replyTo } = options;

  // Render the email HTML
  const html = await renderPromotionalEmail({
    repositoryUrl: repositoryUrl || 'https://github.com/Gerome-Elassaad/codinit-app',
    repositoryStars: repositoryStars || '16+',
  });

  // Send via Resend
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: 'Build Full-Stack Apps with AI - Support CodinIT! 🚀',
    html,
    replyTo,
    tags: [
      {
        name: 'category',
        value: 'promotional',
      },
      {
        name: 'campaign',
        value: 'github-stars',
      },
    ],
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

/**
 * Send promotional emails in batch via Resend
 * Resend supports batch sending to multiple recipients
 * @param recipients - Array of email addresses
 * @param options - Email options
 * @returns Array of Resend responses
 */
export async function sendPromotionalEmailBatch(
  recipients: string[],
  options: Omit<SendPromotionalEmailOptions, 'to'> = {},
) {
  const { repositoryUrl, repositoryStars, from = 'CodinIT <noreply@codinit.dev>', replyTo } = options;

  // Render the email HTML once (same for all recipients)
  const html = await renderPromotionalEmail({
    repositoryUrl: repositoryUrl || 'https://github.com/Gerome-Elassaad/codinit-app',
    repositoryStars: repositoryStars || '16+',
  });

  // Create batch send requests
  const emails = recipients.map((to) => ({
    from,
    to,
    subject: 'Build Full-Stack Apps with AI - Support CodinIT! 🚀',
    html,
    replyTo,
    tags: [
      {
        name: 'category',
        value: 'promotional',
      },
      {
        name: 'campaign',
        value: 'github-stars',
      },
    ],
  }));

  // Send batch (Resend allows up to 100 emails per batch)
  const { data, error } = await resend.batch.send(emails);

  if (error) {
    throw new Error(`Failed to send batch emails: ${error.message}`);
  }

  return data;
}

/**
 * Example: Send test email
 */
export async function sendTestEmail(to: string) {
  return sendPromotionalEmail({
    to,
    repositoryUrl: 'https://github.com/Gerome-Elassaad/codinit-app',
    repositoryStars: '16+',
  });
}
