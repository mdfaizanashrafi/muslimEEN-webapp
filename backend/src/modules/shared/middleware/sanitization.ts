/**
 * Input Sanitization Middleware
 * Protects against XSS and NoSQL injection attacks
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// ============================================================================
// XSS PROTECTION
// ============================================================================

/**
 * Patterns that indicate XSS attempts
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // Event handlers like onclick, onerror, etc.
  /<\s*\/\s*script\s*>/gi,
  /\\x3cscript/gi,
  /\\x3c\\x73\\x63\\x72\\x69\\x70\\x74/gi,
];

/**
 * Sanitize a string value by removing XSS patterns
 */
const sanitizeString = (value: string): string => {
  let sanitized = value;
  XSS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  return sanitized;
};

/**
 * Recursively sanitize an object
 */
const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * XSS Sanitization middleware
 * Sanitizes request body, query, and params
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    logger.error('Sanitization error', { error: (error as Error).message });
    next(error);
  }
};

/**
 * XSS Protection header middleware
 * Sets X-XSS-Protection header (legacy browsers)
 */
export const xssProtection = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
};

// ============================================================================
// NOSQL INJECTION PROTECTION
// ============================================================================

/**
 * Patterns that indicate NoSQL injection attempts
 */
const NOSQL_INJECTION_PATTERNS = [
  /\$where\s*:/i,
  /\$ne\s*:/i,
  /\$gt\s*:/i,
  /\$lt\s*:/i,
  /\$gte\s*:/i,
  /\$lte\s*:/i,
  /\$regex\s*:/i,
  /\$options\s*:/i,
  /\$in\s*:/i,
  /\$nin\s*:/i,
  /\$exists\s*:/i,
  /\$type\s*:/i,
  /\$mod\s*:/i,
  /\$all\s*:/i,
  /\$size\s*:/i,
];

/**
 * Check if value contains NoSQL injection patterns
 */
const containsNoSqlInjection = (value: any): boolean => {
  if (typeof value === 'string') {
    return NOSQL_INJECTION_PATTERNS.some(pattern => pattern.test(value));
  }
  
  if (Array.isArray(value)) {
    return value.some(containsNoSqlInjection);
  }
  
  if (value && typeof value === 'object') {
    return Object.values(value).some(containsNoSqlInjection);
  }
  
  return false;
};

/**
 * NoSQL Injection prevention middleware
 * Blocks requests containing NoSQL operators
 */
export const preventNoSqlInjection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const suspiciousFields: string[] = [];
  
  const checkObject = (obj: any, path: string = ''): void => {
    if (typeof obj === 'string') {
      if (containsNoSqlInjection(obj)) {
        suspiciousFields.push(path);
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => checkObject(item, `${path}[${index}]`));
    } else if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        // Check the key itself for NoSQL operators
        if (key.startsWith('$')) {
          suspiciousFields.push(path ? `${path}.${key}` : key);
        }
        checkObject(value, path ? `${path}.${key}` : key);
      }
    }
  };
  
  // Check request body
  if (req.body) {
    checkObject(req.body, 'body');
  }
  
  // Check query parameters
  if (req.query) {
    checkObject(req.query, 'query');
  }
  
  if (suspiciousFields.length > 0) {
    logger.warn('Potential NoSQL injection attempt blocked', {
      ip: req.ip,
      path: req.path,
      fields: suspiciousFields,
    });
    
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Invalid characters in request',
      },
    });
    return;
  }
  
  next();
};

// ============================================================================
// SQL INJECTION PROTECTION
// ============================================================================

/**
 * SQL injection patterns to detect
 */
const SQL_INJECTION_PATTERNS = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
  /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
  /((\%27)|(\'))union/i,
  /exec(\s|\+)+(s|x)p\w+/i,
  /UNION\s+SELECT/i,
  /INSERT\s+INTO/i,
  /DELETE\s+FROM/i,
  /DROP\s+TABLE/i,
];

/**
 * SQL Injection detection middleware
 * Note: This is a secondary defense - parameterized queries are primary
 */
export const detectSqlInjection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const checkValue = (value: any): boolean => {
    if (typeof value !== 'string') return false;
    return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(value));
  };
  
  const checkObject = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return checkValue(obj);
    }
    if (Array.isArray(obj)) {
      return obj.some(checkObject);
    }
    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(checkObject);
    }
    return false;
  };
  
  if (checkObject(req.body) || checkObject(req.query)) {
    logger.warn('Potential SQL injection attempt detected', {
      ip: req.ip,
      path: req.path,
    });
    
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Invalid input detected',
      },
    });
    return;
  }
  
  next();
};
