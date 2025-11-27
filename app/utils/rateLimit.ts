interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private _store = new Map<string, RateLimitEntry>();
  private _cleanupInterval: NodeJS.Timeout;

  constructor(
    private _windowMs: number,
    private _maxRequests: number,
  ) {
    // Clean up expired entries every 5 minutes
    this._cleanupInterval = setInterval(
      () => {
        this._cleanup();
      },
      5 * 60 * 1000,
    );
  }

  isRateLimited(key: string): boolean {
    const entry = this._store.get(key);
    const now = Date.now();

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this._store.set(key, {
        count: 1,
        resetTime: now + this._windowMs,
      });
      return false;
    }

    if (entry.count >= this._maxRequests) {
      return true;
    }

    entry.count++;

    return false;
  }

  getRemainingRequests(key: string): number {
    const entry = this._store.get(key);

    if (!entry || Date.now() > entry.resetTime) {
      return this._maxRequests;
    }

    return Math.max(0, this._maxRequests - entry.count);
  }

  getResetTime(key: string): number {
    const entry = this._store.get(key);
    return entry?.resetTime || 0;
  }

  private _cleanup() {
    const now = Date.now();

    for (const [key, entry] of this._store.entries()) {
      if (now > entry.resetTime) {
        this._store.delete(key);
      }
    }
  }

  destroy() {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
    }

    this._store.clear();
  }
}

// Rate limiters for different endpoints
export const registrationRateLimiter = new RateLimiter(60 * 60 * 1000, 5); // 5 per hour per IP
export const verificationRateLimiter = new RateLimiter(60 * 60 * 1000, 3); // 3 per hour per email

// Helper function to get client IP from request
export function getClientIP(request: Request): string {
  // Try various headers for IP detection
  const forwarded = request.headers.get('x-forwarded-for');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');

  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to a default (not ideal for production)
  return 'unknown';
}

// Rate limiting middleware for Remix actions
export function withRateLimit(
  action: (args: any) => Promise<Response>,
  limiter: RateLimiter,
  keyFn: (request: Request, body?: any) => string,
) {
  return async (args: any) => {
    const { request } = args;
    const body =
      request.method === 'POST'
        ? await request
            .clone()
            .json()
            .catch(() => ({}))
        : {};
    const key = keyFn(request, body);

    if (limiter.isRateLimited(key)) {
      const resetTime = limiter.getResetTime(key);
      const remainingMs = resetTime - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

      return new Response(
        JSON.stringify({
          success: false,
          error: `Too many requests. Please try again in ${remainingMinutes} minutes.`,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': remainingMs.toString(),
          },
        },
      );
    }

    return action(args);
  };
}
