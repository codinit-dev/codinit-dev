import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { db } from '~/IPC/db';
import { users } from '~/IPC/db/schema';
import { eq } from 'drizzle-orm';
import { createScopedLogger } from '~/utils/logger';
import { logStore } from '~/lib/stores/logs';
import { validateRegistrationForm } from '~/utils/validation';
import { Resend } from 'resend';
import { randomBytes } from 'crypto';
import { registrationRateLimiter, getClientIP, withRateLimit } from '~/utils/rateLimit';

const logger = createScopedLogger('RegistrationAPI');

// Email verification token expiry (24 hours)
const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000;

interface RegistrationRequest {
  fullName: string;
  email: string;
  emailOptIn: boolean;
  appVersion?: string;
  platform?: string;
}

async function registrationAction({ request }: ActionFunctionArgs) {
  logger.debug('Registration request received', {
    method: request.method,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlLength: process.env.DATABASE_URL?.length,
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 50),
    allEnvKeys: Object.keys(process.env).filter((key) => key.includes('DATABASE') || key.includes('SUPABASE')),
  });

  if (request.method !== 'POST') {
    return json({ success: false, error: 'Method not allowed' }, { status: 405 });
  }

  // Check for required environment variables
  if (!process.env.DATABASE_URL) {
    logger.error('DATABASE_URL environment variable is not set');

    return json(
      {
        success: false,
        error: 'Server configuration error: Database not configured. Please contact support.',
      },
      { status: 500 },
    );
  }

  if (!process.env.APP_URL) {
    logger.error('APP_URL environment variable is not set');

    return json(
      {
        success: false,
        error: 'Server configuration error: Application URL not configured. Please contact support.',
      },
      { status: 500 },
    );
  }

  try {
    const body: RegistrationRequest = await request.json();
    const { fullName, email, emailOptIn, appVersion, platform } = body;

    // Validate input
    const validation = validateRegistrationForm(fullName, email);

    if (!validation.isValid) {
      return json(
        {
          success: false,
          error: Object.values(validation.errors).join('. '),
        },
        { status: 400 },
      );
    }

    // Check if user already exists
    logger.debug('Checking for existing user', { email: email.toLowerCase() });

    let existingUser;

    try {
      // First try a simple query to test connection
      await db.execute('SELECT 1');
      logger.debug('Simple query successful');

      existingUser = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
      logger.debug('User lookup query completed', { resultCount: existingUser.length });
    } catch (queryError) {
      logger.error('Database query failed', {
        error: queryError,
        message: queryError instanceof Error ? queryError.message : 'Unknown error',
        stack: queryError instanceof Error ? queryError.stack : undefined,
      });

      // Provide more specific error messages based on the error type
      if (queryError instanceof Error) {
        if (queryError.message.includes('connect') || queryError.message.includes('ECONNREFUSED')) {
          return json(
            {
              success: false,
              error: 'Database connection failed. Please try again later.',
            },
            { status: 500 },
          );
        }

        if (queryError.message.includes('relation') || queryError.message.includes('does not exist')) {
          return json(
            {
              success: false,
              error: 'Database schema error. Please contact support.',
            },
            { status: 500 },
          );
        }
      }

      return json(
        {
          success: false,
          error: 'Database error occurred. Please try again later.',
        },
        { status: 500 },
      );
    }

    const userExists = existingUser.length > 0;
    const user = userExists ? existingUser[0] : null;

    if (userExists && user && user.emailVerified) {
      // Existing verified user - sign in
      logger.debug('Existing verified user signing in', { email: email.toLowerCase() });

      // Update last login
      await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));

      logStore.logSystem('User signed in via web', {
        userId: user.id,
        email: email.toLowerCase(),
      });

      return json({
        success: true,
        type: 'signin',
        message: 'Welcome back!',
        userId: user.id,
      });
    }

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);

    if (userExists && user && !user.emailVerified) {
      // Existing unverified user - resend verification
      logger.debug('Resending verification for existing unverified user', {
        email: email.toLowerCase(),
        userId: user.id,
      });

      await db
        .update(users)
        .set({
          verificationToken,
          verificationSentAt: new Date(),
          verificationExpiresAt,
          fullName, // Update name if changed
          emailOptIn,
          appVersion,
          platform,
          consentGivenAt: new Date(),
          consentVersion: '1.0',
        })
        .where(eq(users.id, user.id));

      // Send verification email
      await sendVerificationEmail(email.toLowerCase(), verificationToken, fullName);

      logStore.logSystem('Verification email resent', {
        userId: user.id,
        email: email.toLowerCase(),
      });

      return json({
        success: true,
        type: 'verification_resent',
        message: 'Verification email resent. Please check your email.',
        userId: user.id,
      });
    }

    // New user registration
    const userId = crypto.randomUUID();

    logger.debug('Creating new user registration', {
      userId,
      email: email.toLowerCase(),
    });

    await db.insert(users).values({
      id: userId,
      fullName,
      email: email.toLowerCase(),
      emailOptIn,
      appVersion,
      platform,
      verificationToken,
      emailVerified: false,
      verificationSentAt: new Date(),
      verificationExpiresAt,
      consentGivenAt: new Date(),
      consentVersion: '1.0',
    });

    // Send verification email
    await sendVerificationEmail(email.toLowerCase(), verificationToken, fullName);

    logStore.logSystem('New user registered', {
      userId,
      email: email.toLowerCase(),
    });

    return json({
      success: true,
      type: 'registration',
      message: 'Registration successful! Please check your email to verify your account.',
      userId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    logger.error('Registration API error', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return json(
      {
        success: false,
        error: `Registration failed: ${errorMessage}`,
      },
      { status: 500 },
    );
  }
}

async function sendVerificationEmail(email: string, token: string, fullName: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  if (!process.env.RESEND_API_KEY) {
    logger.warn('RESEND_API_KEY not configured, skipping email send');
    return;
  }

  const verificationUrl = `${process.env.APP_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: 'Codinit <noreply@codinit.dev>',
      to: email,
      subject: 'Verify your Codinit account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #333;">Welcome to Codinit, ${fullName}!</h1>
          </div>
          <p style="font-size: 16px; color: #555;">
            Thanks for signing up! Please verify your email address to complete your registration and start using Codinit.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background-color: #007bff; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="font-size: 14px; color: #555;">
            If the button above doesn't work, you can copy and paste this link into your browser:
          </p>
          <p style="word-break: break-all; color: #007bff; text-decoration: underline;">
            ${verificationUrl}
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
          <p style="color: #888; font-size: 12px; text-align: center;">
            This link will expire in 24 hours. If you didn't create an account with us, please disregard this email.
          </p>
        </div>
      `,
    });

    logger.debug('Verification email sent', { email });
  } catch (error) {
    logger.error('Failed to send verification email', { error, email });
    throw new Error('Failed to send verification email');
  }
}

// Export with rate limiting applied
export const action = withRateLimit(registrationAction, registrationRateLimiter, (request) => getClientIP(request));
