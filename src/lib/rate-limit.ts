interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  private getKey(identifier: string, endpoint: string): string {
    return `${identifier}:${endpoint}`;
  }

  isRateLimited(identifier: string, endpoint: string, limit: number, windowMs: number): boolean {
    const key = this.getKey(identifier, endpoint);
    const now = Date.now();

    if (!this.store[key] || this.store[key].resetTime < now) {
      this.store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return false;
    }

    if (this.store[key].count >= limit) {
      return true;
    }

    this.store[key].count++;
    return false;
  }

  getRemaining(identifier: string, endpoint: string, limit: number): number {
    const key = this.getKey(identifier, endpoint);
    const entry = this.store[key];
    
    if (!entry) {
      return limit;
    }

    return Math.max(0, limit - entry.count);
  }

  getResetTime(identifier: string, endpoint: string): number {
    const key = this.getKey(identifier, endpoint);
    const entry = this.store[key];
    
    return entry ? entry.resetTime : Date.now();
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Create a singleton instance
const rateLimiter = new RateLimiter();

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export const RATE_LIMIT_CONFIGS = {
  auth: { limit: 5, windowMs: 60 * 1000 }, // 5 requests per minute
  admin: { limit: 50, windowMs: 60 * 1000 }, // 50 requests per minute
  default: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute
} as const;

export function getRateLimitConfig(pathname: string): RateLimitConfig {
  if (pathname.startsWith('/api/auth') || pathname.includes('sign-in') || pathname.includes('sign-up')) {
    return RATE_LIMIT_CONFIGS.auth;
  }
  
  if (pathname.startsWith('/api/admin')) {
    return RATE_LIMIT_CONFIGS.admin;
  }
  
  return RATE_LIMIT_CONFIGS.default;
}

export function checkRateLimit(identifier: string, pathname: string): {
  isLimited: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
} {
  const config = getRateLimitConfig(pathname);
  const isLimited = rateLimiter.isRateLimited(identifier, pathname, config.limit, config.windowMs);
  const remaining = rateLimiter.getRemaining(identifier, pathname, config.limit);
  const resetTime = rateLimiter.getResetTime(identifier, pathname);

  return {
    isLimited,
    remaining,
    resetTime,
    limit: config.limit,
  };
}

// Cleanup on process exit
process.on('exit', () => {
  rateLimiter.destroy();
});

process.on('SIGINT', () => {
  rateLimiter.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  rateLimiter.destroy();
  process.exit(0);
}); 