/**
 * Rate Limiting Middleware
 * 
 * SECURITY: Prevents brute force attacks and abuse.
 * Uses Redis (Upstash) in production, in-memory fallback for development.
 */

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { env } from '../../config/env';
import { logger } from '../utils/logger';

// ============================================================================
// REDIS CLIENT (Production)
// ============================================================================

let redis: Redis | null = null;

if (env.REDIS_URL) {
  try {
    redis = new Redis(env.REDIS_URL);
    logger.info('Redis connected for rate limiting');
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
  }
}

// ============================================================================
// IN-MEMORY FALLBACK (Development)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

// Cleanup expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.resetTime < now) {
      memoryStore.delete(key);
    }
  }
}, 60 * 1000);

// ============================================================================
// RATE LIMIT CHECK
// ============================================================================

interface RateLimitOptions {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyPrefix?: string;    // Key prefix for Redis
  keyGenerator?: (req: Request) => string; // Custom key generator
}

const checkRateLimit = async (
  identifier: string,
  options: RateLimitOptions
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> => {
  const { windowMs, maxRequests } = options;
  const now = Date.now();
  const resetAt = now + windowMs;
  
  // Try Redis first
  if (redis) {
    const key = `ratelimit:${options.keyPrefix || 'default'}:${identifier}`;
    
    const multi = redis.multi();
    multi.incr(key);
    multi.pexpire(key, windowMs);
    
    const results = await multi.exec();
    const count = results?.[0]?.[1] as number || 1;
    
    const allowed = count <= maxRequests;
    const remaining = Math.max(0, maxRequests - count);
    
    return { allowed, remaining, resetAt };
  }
  
  // Fallback to in-memory
  const key = `${options.keyPrefix || 'default'}:${identifier}`;
  const entry = memoryStore.get(key);
  
  if (!entry || entry.resetTime < now) {
    // New window
    memoryStore.set(key, { count: 1, resetTime: resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }
  
  // Existing window
  entry.count++;
  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);
  
  return { allowed, remaining, resetAt: entry.resetTime };
};

// ============================================================================
// MIDDLEWARE FACTORY
// ============================================================================

export const createRateLimiter = (options: RateLimitOptions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Get identifier (IP address or user ID)
    const identifier = options.keyGenerator 
      ? options.keyGenerator(req)
      : req.ip || req.socket.remoteAddress || 'unknown';
    
    try {
      const result = await checkRateLimit(identifier, options);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', options.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString());
      
      if (!result.allowed) {
        logger.warn('Rate limit exceeded', {
          identifier,
          path: req.path,
          tags: { module: 'security', type: 'rate_limit' },
        });
        
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
          },
        });
        return;
      }
      
      next();
    } catch (error) {
      logger.error('Rate limit check failed', { error });
      // Fail open (allow request) if rate limiting is broken
      next();
    }
  };
};

// ============================================================================
// PRE-CONFIGURED LIMITERS
// ============================================================================

/**
 * Strict limiter for invite validation (prevents brute force)
 * 5 attempts per minute per IP
 */
export const inviteValidationLimiter = createRateLimiter({
  windowMs: 60 * 1000,      // 1 minute
  maxRequests: 5,           // 5 attempts
  keyPrefix: 'invite_val',
});

/**
 * Standard limiter for invite creation
 * 10 invites per minute per user
 */
export const inviteCreationLimiter = createRateLimiter({
  windowMs: 60 * 1000,      // 1 minute
  maxRequests: 10,
  keyPrefix: 'invite_create',
  keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
});

/**
 * Auth limiter for authentication endpoints
 * 10 attempts per 5 minutes per IP
 */
export const authLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  maxRequests: 10,
  keyPrefix: 'auth',
});

/**
 * User limiter for general user actions
 * 100 requests per minute per user
 */
export const userLimiter = createRateLimiter({
  windowMs: 60 * 1000,      // 1 minute
  maxRequests: 100,
  keyPrefix: 'user',
  keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
});

/**
 * API limiter for general API usage
 * 1000 requests per minute per IP
 */
export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,      // 1 minute
  maxRequests: 1000,
  keyPrefix: 'api',
});

export default createRateLimiter;
