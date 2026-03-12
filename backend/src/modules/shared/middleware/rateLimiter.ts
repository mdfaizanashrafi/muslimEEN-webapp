/**
 * Rate Limiter Middleware
 * Express rate limiting configuration with security hardening
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

// ============================================================================
// SECURITY NOTE
// ============================================================================
// Previously, this middleware had a critical vulnerability where setting
// TRUST_PROXY=true would completely disable rate limiting. This has been
// removed. Rate limiting now always applies regardless of proxy configuration.
// ============================================================================

/**
 * Get client IP address
 * Respects X-Forwarded-For header when behind trusted proxy
 */
const getClientIp = (req: Request): string => {
  // Use Express's built-in IP detection (respects trust proxy settings)
  return req.ip || 
         (typeof req.headers['x-forwarded-for'] === 'string' 
           ? req.headers['x-forwarded-for'].split(',')[0].trim() 
           : null) || 
         req.socket.remoteAddress || 
         'unknown';
};

/**
 * Create a rate limiter with custom options
 */
const createLimiter = (
  windowMs: number,
  max: number,
  message: string,
  skipSuccessfulRequests: boolean = false
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
    
    // Key generator - uses client IP
    keyGenerator: (req: Request): string => {
      return getClientIp(req);
    },
    
    // Skip successful requests for certain endpoints if needed
    skipSuccessfulRequests,
    
    // Handler for when limit is exceeded
    handler: (req: Request, res: Response) => {
      const clientIp = getClientIp(req);
      logger.warn('Rate limit exceeded', {
        ip: clientIp,
        path: req.path,
        method: req.method,
      });
      
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter: Math.ceil(windowMs / 1000)
        }
      });
    },
    
    // Skip function - NEVER skip based on proxy settings
    // Only skip for health checks
    skip: (req: Request): boolean => {
      // Allow health checks without rate limiting
      if (req.path === '/health' || req.path.startsWith('/health/')) {
        return true;
      }
      return false;
    }
  });
};

// 15 minutes in milliseconds
const FIFTEEN_MINUTES = 15 * 60 * 1000;

/**
 * Auth rate limiter - strict limits for authentication endpoints
 * 5 requests per 15 minutes in production, 20 in development
 * 
 * SECURITY: This protects against brute force attacks on login/registration
 */
export const authLimiter = createLimiter(
  FIFTEEN_MINUTES,
  process.env.NODE_ENV === 'production' ? 5 : 20,
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

/**
 * Admin rate limiter - more permissive for admin operations
 * 200 requests per 15 minutes
 */
export const adminLimiter = createLimiter(
  FIFTEEN_MINUTES,
  200,
  'Admin API rate limit exceeded'
);

/**
 * Strict rate limiter for sensitive operations
 * 10 requests per hour
 */
export const strictLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  10,
  'Too many attempts. Please try again in an hour.'
);
