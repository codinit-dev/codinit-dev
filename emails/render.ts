import { render } from '@react-email/render';
import PromotionalEmail from './PromotionalEmail';

/**
 * Renders the promotional email as HTML
 * @param props - Email template props
 * @returns HTML string ready to send via email service
 */
export function renderPromotionalEmail(props?: { repositoryUrl?: string; repositoryStars?: string }) {
  return render(PromotionalEmail(props || {}), {
    pretty: true,
  });
}

/**
 * Renders the promotional email as plain text
 * @param props - Email template props
 * @returns Plain text version of the email
 */
export function renderPromotionalEmailText(props?: {
  userEmail?: string;
  repositoryUrl?: string;
  repositoryStars?: string;
}) {
  return render(PromotionalEmail(props || {}), {
    plainText: true,
  });
}

if (require.main === module) {
  const html = renderPromotionalEmail({
    repositoryUrl: 'https://github.com/Gerome-Elassaad/codinit-app',
    repositoryStars: '16+',
  });

  console.log('HTML Email rendered:');
  console.log(html);
}
