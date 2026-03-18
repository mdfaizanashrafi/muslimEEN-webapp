/**
 * Security Configuration
 * Helmet, cookie parser, and security middleware configuration
 */

import { Express } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './env';
import { logger } from '../modules/shared/utils/logger';

/**
 * Validate and get cookie secret
 */
// Cookie secret is validated in env.ts, just use it directly
const getCookieSecret = (): string => env.COOKIE_SECRET;

/**
 * Helmet configuration for security headers
 */
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"], // Prevent clickjacking
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  
  // HTTP Strict Transport Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  
  // Prevent MIME type sniffing
  noSniff: true,
  
  // X-Frame-Options
  frameguard: {
    action: 'deny',
  },
  
  // XSS Protection
  xssFilter: true,
  
  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
});

/**
 * Initialize cookie parser with secure secret
 */
export const initializeCookieParser = (app: Express): void => {
  const cookieSecret = getCookieSecret();
  app.use(cookieParser(cookieSecret));
};

/**
 * Trust proxy configuration
 */
export const configureTrustProxy = (app: Express): void => {
  if (env.NODE_ENV === 'production') {
    const trustedProxies = env.TRUSTED_PROXIES ?? ['loopback', 'linklocal', 'uniquelocal'];
    
    app.set('trust proxy', trustedProxies);
    logger.info('Trust proxy configured for production', { trustedProxies });
  } else {
    app.set('trust proxy', 'loopback');
  }
};
