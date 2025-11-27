import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { db } from '~/IPC/db';
import { users } from '~/IPC/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { createScopedLogger } from '~/utils/logger';
import { logStore } from '~/lib/stores/logs';
import { verificationRateLimiter, getClientIP, withRateLimit } from '~/utils/rateLimit';

const logger = createScopedLogger('EmailVerificationAPI');

async function verificationAction({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ success: false, error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { token } = body as { token: string };

    if (!token || typeof token !== 'string') {
      return json(
        {
          success: false,
          error: 'Invalid verification token',
        },
        { status: 400 },
      );
    }

    // Find user with matching token that hasn't expired
    const userResult = await db
      .select()
      .from(users)
      .where(and(eq(users.verificationToken, token), gt(users.verificationExpiresAt, new Date())))
      .limit(1);

    if (userResult.length === 0) {
      logger.warn('Invalid or expired verification token', { token: token.substring(0, 8) + '...' });
      return json(
        {
          success: false,
          error: 'Invalid or expired verification link. Please request a new one.',
        },
        { status: 400 },
      );
    }

    const user = userResult[0];

    if (user.emailVerified) {
      logger.debug('User already verified', { userId: user.id });
      return json({
        success: true,
        message: 'Email already verified. You can now sign in.',
        userId: user.id,
      });
    }

    // Mark user as verified and clear verification token
    await db
      .update(users)
      .set({
        emailVerified: true,
        verificationToken: null,
        verificationSentAt: null,
        verificationExpiresAt: null,
        lastLogin: new Date(),
      })
      .where(eq(users.id, user.id));

    logStore.logSystem('User email verified', {
      userId: user.id,
      email: user.email,
    });

    logger.debug('User email verified successfully', { userId: user.id });

    return json({
      success: true,
      message: 'Email verified successfully! Welcome to Codinit.',
      userId: user.id,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    logger.error('Email verification API error', { error: errorMessage });

    return json(
      {
        success: false,
        error: 'An error occurred during verification. Please try again.',
      },
      { status: 500 },
    );
  }
}

// Export with rate limiting applied
export const action = withRateLimit(
  verificationAction,
  verificationRateLimiter,
  (request, body) => body?.email || getClientIP(request),
);
