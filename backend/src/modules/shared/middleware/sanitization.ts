/**
 * Input Sanitization Middleware
 * 
 * Protects against XSS, NoSQL injection, and other injection attacks
 */

import { Request, Response, NextFunction } from 'express';

// Characters that could be used for XSS
const XSS_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|<[^>]*on\w+\s*=|javascript:|data:text\/html/i;

// Characters that could be used for NoSQL injection
const NOSQL_PATTERN = /[$\{\}\[\]\\]/;

/**
 * Sanitize a string value
 * Removes potentially dangerous characters
 */
const sanitizeString = (str: string): string => {
  return str
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML tags
    .replace(/['"`]/g, '') // Remove quotes to prevent injection
    .trim();
};

/**
 * Recursively sanitize an object
 */
const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize the key as well
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  // Return primitive values as-is
  return obj;
};

/**
 * Check if string contains potential XSS patterns
 */
const containsXss = (str: string): boolean => {
  return XSS_PATTERN.test(str);
};

/**
 * Check if object contains potential NoSQL injection
 */
const containsNoSqlInjection = (obj: any): boolean => {
  if (typeof obj === 'string') {
    return NOSQL_PATTERN.test(obj);
  }
  
  if (obj && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      if (NOSQL_PATTERN.test(key)) return true;
      if (containsNoSqlInjection(value)) return true;
    }
  }
  
  return false;
};

/**
 * Middleware to sanitize all input
 * Removes XSS vectors and sanitizes strings
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Check for XSS in body
    if (req.body && typeof req.body === 'object') {
      const bodyString = JSON.stringify(req.body);
      if (containsXss(bodyString)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'XSS_DETECTED',
            message: 'Input contains potentially dangerous content',
          },
        });
        return;
      }
      
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    
    // Sanitize route parameters
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to prevent NoSQL injection
 * Blocks requests with prohibited characters
 */
export const preventNoSqlInjection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Check body
    if (req.body && containsNoSqlInjection(req.body)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Input contains prohibited characters',
        },
      });
      return;
    }
    
    // Check query
    if (req.query && containsNoSqlInjection(req.query)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Query parameters contain prohibited characters',
        },
      });
      return;
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * XSS Protection middleware
 * Legacy export for compatibility
 */
export const xssProtection = sanitizeInput;

/**
 * Combined security middleware
 * Applies all sanitization and protection
 */
export const securityMiddleware = [
  preventNoSqlInjection,
  sanitizeInput,
];
