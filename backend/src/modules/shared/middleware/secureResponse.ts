/**
 * Secure Response Middleware
 * Ensures all API responses are sanitized and safe
 * SECURITY: Defense in depth - final output validation
 */

import { Request, Response, NextFunction } from 'express';
import { removeSensitiveFields } from '../utils/encoding';

// ============================================================================
// SECURITY HEADERS
// ============================================================================

/**
 * Middleware to add security headers to all responses
 */
export const securityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS Protection (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
  );
  
  // Cache control for sensitive endpoints
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  next();
};

// ============================================================================
// RESPONSE SANITIZATION
// ============================================================================

/**
 * Fields that should be removed from all responses
 */
const PROHIBITED_FIELDS = [
  'password',
  'passwordHash',
  'password_hash',
  'token',
  'refreshToken',
  'refresh_token',
  'csrfToken',
  'csrf_token',
  'secret',
  'apiKey',
  'api_key',
  'privateKey',
  'private_key',
  'sessionSecret',
  'session_secret',
];

/**
 * Check if key is sensitive
 */
const isSensitiveKey = (key: string): boolean => {
  const lowerKey = key.toLowerCase();
  return PROHIBITED_FIELDS.some(field => lowerKey.includes(field.toLowerCase()));
};

/**
 * Deep clean object by removing sensitive fields
 */
const deepClean = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return obj;
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClean(item));
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip sensitive keys
      if (isSensitiveKey(key)) {
        continue;
      }
      
      // Clean nested objects
      cleaned[key] = deepClean(value);
    }
    return cleaned;
  }
  
  return obj;
};

/**
 * Override res.json to automatically sanitize responses
 * This provides defense in depth - even if dev forgets to sanitize
 */
export const autoSanitizeJson = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json method
  res.json = function(body: any): Response {
    // Clean the response body
    const cleanedBody = deepClean(body);
    
    // Add security headers if not already set
    if (!res.getHeader('X-Content-Type-Options')) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
    
    // Call original json with cleaned body
    return originalJson(cleanedBody);
  };
  
  next();
};

// ============================================================================
// CONTENT TYPE VALIDATION
// ============================================================================

/**
 * Validate that response content type is safe
 * Prevents certain types of content injection
 */
export const validateContentType = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const originalSend = res.send.bind(res);
  
  res.send = function(body: any): Response {
    // If content-type is not set, default to application/json for API routes
    if (!res.getHeader('Content-Type') && req.path.startsWith('/api')) {
      res.setHeader('Content-Type', 'application/json');
    }
    
    return originalSend(body);
  };
  
  next();
};

// ============================================================================
// ERROR SANITIZATION
// ============================================================================

/**
 * Sanitize error messages to prevent information leakage
 */
export const sanitizeErrorMessage = (message: string): string => {
  // Patterns that might contain sensitive info
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /key/i,
    /credential/i,
    /database.*error/i,
    /sql/i,
    /query.*failed/i,
  ];
  
  // If message matches sensitive patterns, return generic message
  if (sensitivePatterns.some(pattern => pattern.test(message))) {
    return 'An error occurred while processing your request';
  }
  
  return message;
};

// ============================================================================
// REQUEST ID TRACKING
// ============================================================================

/**
 * Add request ID to all responses for debugging without exposing internals
 */
export const addRequestId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Use existing correlation ID or generate new one
  const requestId = req.headers['x-correlation-id'] || 
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Make it available to response
  res.locals.requestId = requestId;
  
  // Add to response headers
  res.setHeader('X-Request-Id', String(requestId));
  
  next();
};
