/**
 * Security Configuration
 * Helmet, cookie parser, and security middleware configuration
 */

import { Express } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { logger } from '../modules/shared/utils/logger';

const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Validate and get cookie secret
 */
const getCookieSecret = (): string => {
  const COOKIE_SECRET = process.env.COOKIE_SECRET;
  const DEFAULT_COOKIE_SECRET = 'default-secret-change-in-production';

  if (!COOKIE_SECRET || COOKIE_SECRET === DEFAULT_COOKIE_SECRET) {
    if (NODE_ENV === 'production') {
      throw new Error('CRITICAL: COOKIE_SECRET must be set and not be the default value in production');
    }
    logger.warn('WARNING: Using default COOKIE_SECRET. Set COOKIE_SECRET in production!');
  }

  return COOKIE_SECRET || DEFAULT_COOKIE_SECRET;
};

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
  if (NODE_ENV === 'production') {
    const trustedProxies = process.env.TRUSTED_PROXIES 
      ? process.env.TRUSTED_PROXIES.split(',').map(ip => ip.trim())
      : ['loopback', 'linklocal', 'uniquelocal'];
    
    app.set('trust proxy', trustedProxies);
    logger.info('Trust proxy configured for production', { trustedProxies });
  } else {
    app.set('trust proxy', 'loopback');
  }
};
