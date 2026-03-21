/**
 * Rate Limiting Middleware - PRODUCTION-HARDENED VERSION
 * 
 * CRITICAL FIXES:
 * 1. Redis retry strategy (prevents infinite retry loops)
 * 2. Safe error handling (doesn't crash app)
 * 3. Safe error logging (no circular refs)
 * 4. Connection event handling
 * 
 * SECURITY: Prevents brute force attacks and abuse.
 * Uses Redis (Upstash) in production, in-memory fallback for development.
 */

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { env } from '../../../config/env';
import { logger, safeError } from '../utils/logger';

// ============================================================================
// REDIS CLIENT (Production) - HARDENED
// ============================================================================

let redis: Redis | null = null;

if (env.REDIS_URL) {
  try {
    redis = new Redis(env.REDIS_URL, {
      // CRITICAL: Limit retries to prevent infinite loops
      maxRetriesPerRequest: 3,
      
      // Retry strategy with backoff
      retryStrategy(times) {
        if (times > 3) {
          logger.error('Redis max retries exceeded, stopping retry', { times });
          return null; // STOP retrying
        }
        return Math.min(times * 100, 2000);
      },
      
      // Only reconnect on specific errors
      reconnectOnError(err) {
        const shouldReconnect = err.message.includes('READONLY');
        if (!shouldReconnect) {
          logger.warn('Redis error, not reconnecting', { 
            message: err.message,
            code: (err as any).code,
          });
        }
        return shouldReconnect;
      },
      
      // Connection timeout
      connectTimeout: 10000,
      
      // Lazy connect - don't block startup
      lazyConnect: true,
    });
    
    // SAFE error event handler - NEVER throws
    redis.on('error', (err) => {
      // Use safeError to prevent circular reference issues
      logger.error('Redis error', safeError(err));
      // Don't crash - just log and continue with in-memory fallback
    });
    
    // Connection events (for monitoring)
    redis.on('connect', () => {
      logger.info('Redis connected for rate limiting');
    });
    
    redis.on('reconnecting', () => {
      logger.warn('Redis reconnecting');
    });
    
    redis.on('close', () => {
      logger.warn('Redis connection closed');
    });
    
    // Lazy connect - don't await, let it connect in background
    redis.connect().catch((err) => {
      logger.error('Redis initial connection failed', safeError(err));
      // Continue with in-memory fallback
    });
    
  } catch (error) {
    // SAFE logging - use safeError
    logger.error('Failed to initialize Redis', safeError(error));
    redis = null;
  }
}

// ============================================================================
// IN-MEMORY FALLBACK (Development / Redis failure)
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
    try {
      const key = `ratelimit:${options.keyPrefix || 'default'}:${identifier}`;
      
      const multi = redis.multi();
      multi.incr(key);
      multi.pexpire(key, windowMs);
      
      const results = await multi.exec();
      const count = results?.[0]?.[1] as number || 1;
      
      const allowed = count <= maxRequests;
      const remaining = Math.max(0, maxRequests - count);
      
      return { allowed, remaining, resetAt };
    } catch (error) {
      // Redis failed - log safely and fall back to in-memory
      logger.error('Redis rate limit check failed, using fallback', safeError(error));
      // Continue to in-memory fallback
    }
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
      // SAFE error logging
      logger.error('Rate limit check failed', safeError(error));
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

/**
 * Marketplace lister for marketplace endpoints
 * 100 requests per minute per IP
 */
export const marketplaceLimiter = createRateLimiter({
  windowMs: 60 * 1000,      // 1 minute
  maxRequests: 100,
  keyPrefix: 'marketplace',
});

export default createRateLimiter;
