/**
 * CSRF Protection Middleware
 * Implements Double Submit Cookie pattern for CSRF protection
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../../../config/env';
import { logger } from '../utils/logger';

// CSRF Token cookie name
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

// Routes that are exempt from CSRF protection
const CSRF_EXEMPT_ROUTES = [
  { method: 'POST', path: '/api/auth/login' },
  { method: 'POST', path: '/api/auth/register' },
  { method: 'POST', path: '/api/auth/validate-invitation' },
  { method: 'GET', path: '/api/health' },
  { method: 'GET', path: '/api/invites/validate/' }, // Public invite validation
];

/**
 * Generate a cryptographically secure CSRF token
 */
export const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Check if route is exempt from CSRF protection
 */
const isExemptRoute = (req: Request): boolean => {
  return CSRF_EXEMPT_ROUTES.some(route => 
    req.method === route.method && 
    (req.path === route.path || req.path.startsWith(route.path))
  );
};

/**
 * Middleware to set CSRF token cookie
 * Should be applied to all routes that need CSRF protection
 */
export const csrfTokenSetter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check if CSRF token already exists in cookie
  let csrfToken = req.cookies?.[CSRF_COOKIE_NAME];
  
  // Generate new token if not exists
  if (!csrfToken) {
    csrfToken = generateCsrfToken();
    
    // Set cookie with security options
    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: true, // JavaScript cannot read this
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });
  }
  
  // Make token available to response locals for non-HTTPOnly access
  res.locals.csrfToken = csrfToken;
  
  next();
};

/**
 * Middleware to validate CSRF token
 * Must be applied after csrfTokenSetter
 */
export const csrfValidator = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip exempt routes
  if (isExemptRoute(req)) {
    return next();
  }
  
  // Get token from cookie
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  
  // Get token from header
  const headerToken = req.headers[CSRF_HEADER_NAME] || req.headers['X-CSRF-Token'];
  
  // Validate tokens exist
  if (!cookieToken || !headerToken) {
    logger.warn('CSRF token missing', {
      ip: req.ip,
      path: req.path,
      hasCookie: !!cookieToken,
      hasHeader: !!headerToken,
    });
    
    res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_MISSING',
        message: 'CSRF token is required. Please refresh the page and try again.',
      },
    });
    return;
  }
  
  // Validate tokens match
  if (cookieToken !== headerToken) {
    logger.warn('CSRF token mismatch', {
      ip: req.ip,
      path: req.path,
    });
    
    res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_INVALID',
        message: 'Invalid CSRF token. Please refresh the page and try again.',
      },
    });
    return;
  }
  
  // Token is valid
  next();
};

/**
 * Combined CSRF protection middleware
 * Sets token and validates in one call
 */
export const csrfProtection = [
  csrfTokenSetter,
  csrfValidator,
];

/**
 * Get CSRF token for the current request
 * Use this to send token to client
 */
export const getCsrfToken = (req: Request, res: Response): string | null => {
  return req.cookies?.[CSRF_COOKIE_NAME] || res.locals?.csrfToken || null;
};

/**
 * Rotate CSRF token (recommended after sensitive operations like login)
 */
export const rotateCsrfToken = (
  req: Request,
  res: Response
): string => {
  const newToken = generateCsrfToken();
  
  res.cookie(CSRF_COOKIE_NAME, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });
  
  res.locals.csrfToken = newToken;
  return newToken;
};
