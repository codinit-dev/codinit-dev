import { createCookie } from '@remix-run/cloudflare';
import { randomBytes } from 'crypto';

// CSRF cookie configuration
const csrfCookie = createCookie('csrf-token', {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60, // 1 hour
});

// Generate a random CSRF token
export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
}

// Get CSRF token from request
export async function getCSRFToken(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get('Cookie');

  if (!cookieHeader) {
    return null;
  }

  const cookie = await csrfCookie.parse(cookieHeader);

  return typeof cookie === 'string' ? cookie : null;
}

// Set CSRF token in response
export async function setCSRFToken(response: Response, token: string): Promise<Response> {
  const cookie = await csrfCookie.serialize(token);
  response.headers.set('Set-Cookie', cookie);

  return response;
}

// Validate CSRF token
export async function validateCSRFToken(request: Request): Promise<boolean> {
  const token = await getCSRFToken(request);

  if (!token) {
    return false;
  }

  // For POST requests, check the token in the body
  if (request.method === 'POST') {
    try {
      const body = (await request.clone().json()) as { csrfToken?: string };
      return body.csrfToken === token;
    } catch {
      return false;
    }
  }

  return true;
}

// Middleware to require CSRF validation
export function requireCSRF(action: (args: any) => Promise<Response>) {
  return async (args: any) => {
    const { request } = args;

    if (request.method === 'POST') {
      const isValid = await validateCSRFToken(request);

      if (!isValid) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid CSRF token',
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
    }

    return action(args);
  };
}
