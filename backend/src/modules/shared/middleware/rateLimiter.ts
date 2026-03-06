/**
 * Rate Limiter Middleware
 * Express rate limiting configuration
 */

import rateLimit from 'express-rate-limit';

// Trust proxy setting for rate limiter
const trustProxy = process.env.TRUST_PROXY === 'true';

/**
 * Create a rate limiter with custom options
 */
const createLimiter = (
  windowMs: number,
  max: number,
  message: string
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => trustProxy
  });
};

// 15 minutes in milliseconds
const FIFTEEN_MINUTES = 15 * 60 * 1000;

/**
 * Auth rate limiter - strict limits for authentication endpoints
 * 5 requests per 15 minutes
 */
export const authLimiter = createLimiter(
  FIFTEEN_MINUTES,
  5,
  'Too many authentication attempts, please try again later'
);

/**
 * User rate limiter - for user profile and settings endpoints
 * 100 requests per 15 minutes
 */
export const userLimiter = createLimiter(
  FIFTEEN_MINUTES,
  100,
  'Too many requests, please slow down'
);

/**
 * Marketplace rate limiter - for marketplace endpoints
 * 50 requests per 15 minutes
 */
export const marketplaceLimiter = createLimiter(
  FIFTEEN_MINUTES,
  50,
  'Too many marketplace requests, please slow down'
);

/**
 * Message rate limiter - for messaging endpoints
 * 30 requests per 15 minutes
 */
export const messageLimiter = createLimiter(
  FIFTEEN_MINUTES,
  30,
  'Too many message requests, please slow down'
);

/**
 * General API rate limiter
 * 1000 requests per 15 minutes
 */
export const apiLimiter = createLimiter(
  FIFTEEN_MINUTES,
  1000,
  'API rate limit exceeded'
);
