import { type ActionFunctionArgs, json } from '@remix-run/cloudflare';
import { sendPromotionalEmail } from '../../emails/send-resend';

/**
 * API Route: Send promotional email
 * POST /api/send-promotional-email
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "repositoryUrl": "https://github.com/Gerome-Elassaad/codinit-app",
 *   "repositoryStars": "16+"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "emailId": "xxxxx"
 * }
 */
export async function action({ request }: ActionFunctionArgs) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Parse request body
    const body = await request.json();
    const { email, repositoryUrl, repositoryStars } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return json({ error: 'Valid email address is required' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ error: 'Invalid email address format' }, { status: 400 });
    }

    // Send the email
    const result = await sendPromotionalEmail({
      to: email,
      repositoryUrl: repositoryUrl || 'https://github.com/Gerome-Elassaad/codinit-app',
      repositoryStars: repositoryStars || '16+',
    });

    return json({
      success: true,
      emailId: result?.id,
      message: 'Promotional email sent successfully',
    });
  } catch (error) {
    console.error('Error sending promotional email:', error);

    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      },
      { status: 500 },
    );
  }
}

/**
 * GET request returns usage information
 */
export async function loader() {
  return json({
    endpoint: '/api/send-promotional-email',
    method: 'POST',
    description: 'Send promotional email to encourage GitHub stars',
    requiredFields: {
      email: 'string (required)',
    },
    optionalFields: {
      repositoryUrl: 'string (defaults to CodinIT repo)',
      repositoryStars: 'string (defaults to current star count)',
    },
    example: {
      email: 'developer@example.com',
      repositoryUrl: 'https://github.com/Gerome-Elassaad/codinit-app',
      repositoryStars: '16+',
    },
  });
}
