/**
 * Rate Limiting Middleware
 * Following BACKEND_README.md rate limiting specification
 */

import rateLimit, { Options } from 'express-rate-limit';
import { Request, Response } from 'express';
import logger from '../utils/logger';

// Store for rate limit hits
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limit message interface
 */
interface RateLimitMessage {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

const defaultMessage: RateLimitMessage = {
  success: false,
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later'
  }
};

// Auth endpoints: 5 requests per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: defaultMessage,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip} on auth endpoint`);
    res.status(429).json(defaultMessage);
  }
});

// User endpoints: 100 requests per 15 minutes
export const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: defaultMessage,
  standardHeaders: true,
  legacyHeaders: false
});

// Marketplace endpoints: 50 requests per 15 minutes
export const marketplaceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: defaultMessage,
  standardHeaders: true,
  legacyHeaders: false
});

// Messages endpoints: 30 requests per 15 minutes
export const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: defaultMessage,
  standardHeaders: true,
  legacyHeaders: false
});

// General API limiter: 1000 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: defaultMessage,
  standardHeaders: true,
  legacyHeaders: false
});
