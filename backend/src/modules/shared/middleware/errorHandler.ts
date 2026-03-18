/**
 * Error Handler Middleware
 * Centralized error handling with security hardening
 * Prevents sensitive information leakage in production
 */

import { env } from '../../../config/env';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  type?: string;
}

// ============================================================================
// SECURITY: ERROR MESSAGE SANITIZATION
// ============================================================================

/**
 * Patterns that might indicate sensitive data in error messages
 */
const SENSITIVE_ERROR_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /key\s*[:=]/i,
  /credential/i,
  /\b\d{16,}\b/, // Credit card numbers
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
];

/**
 * Sanitize error message to remove potential sensitive data
 */
const sanitizeErrorMessage = (message: string): string => {
  // If message matches sensitive patterns, return generic message
  if (SENSITIVE_ERROR_PATTERNS.some(pattern => pattern.test(message))) {
    return 'An error occurred while processing your request';
  }
  return message;
};

/**
 * Get safe error response for client
 * Never exposes internal details in production
 */
const getSafeErrorResponse = (
  error: CustomError,
  isDevelopment: boolean
): { statusCode: number; code: string; message: string; stack?: string } => {
  
  // Default error response
  let statusCode = error.statusCode || 500;
  let code = error.code || 'INTERNAL_ERROR';
  let message = error.message || 'Internal server error';
  
  // Handle specific error types with safe messages
  switch (error.name) {
    case 'ValidationError':
      statusCode = 400;
      code = 'VALIDATION_ERROR';
      message = sanitizeErrorMessage(message) || 'Invalid input data';
      break;
      
    case 'JsonWebTokenError':
      statusCode = 401;
      code = 'INVALID_TOKEN';
      message = 'Authentication token is invalid';
      break;
      
    case 'TokenExpiredError':
      statusCode = 401;
      code = 'TOKEN_EXPIRED';
      message = 'Authentication token has expired';
      break;
      
    case 'UnauthorizedError':
      statusCode = 401;
      code = 'UNAUTHORIZED';
      message = 'Authentication required';
      break;
      
    case 'ForbiddenError':
      statusCode = 403;
      code = 'FORBIDDEN';
      message = 'Access denied';
      break;
  }
  
  // Handle database errors
  if (error.code) {
    switch (error.code) {
      case '23505': // PostgreSQL unique violation
        statusCode = 409;
        code = 'DUPLICATE_ENTRY';
        message = 'Resource already exists';
        break;
        
      case '23503': // Foreign key violation
        statusCode = 400;
        code = 'INVALID_REFERENCE';
        message = 'Referenced resource does not exist';
        break;
        
      case '28P01': // Invalid password
        statusCode = 500;
        code = 'INTERNAL_ERROR';
        message = 'An internal error occurred'; // Don't expose DB auth issues
        break;
        
      case 'ECONNREFUSED':
      case 'ENOTFOUND':
        statusCode = 503;
        code = 'SERVICE_UNAVAILABLE';
        message = 'Service temporarily unavailable';
        break;
    }
  }
  
  // SECURITY: In production, never expose internal error details
  if (!isDevelopment) {
    // For 500 errors, always use generic message in production
    if (statusCode >= 500) {
      message = 'An internal server error occurred. Please try again later.';
    } else {
      // Sanitize any potentially sensitive data from client-facing messages
      message = sanitizeErrorMessage(message);
    }
  }
  
  const response: any = {
    statusCode,
    code,
    message,
  };
  
  // Only include stack trace in development
  if (isDevelopment && error.stack) {
    response.stack = error.stack;
  }
  
  return response;
};

// ============================================================================
// 404 HANDLER
// ============================================================================

/**
 * 404 Not Found handler
 */
export const notFound = (req: Request, res: Response, _next: NextFunction): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`
    }
  });
};

// ============================================================================
// GLOBAL ERROR HANDLER
// ============================================================================

/**
 * Global error handler
 * SECURITY: Never leaks stack traces or internal details in production
 */
export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isDevelopment = env.NODE_ENV === 'development';
  
  // Log full error details server-side (with sensitive data protection)
  logger.error('Error occurred', {
    error: error.message,
    code: error.code,
    name: error.name,
    type: error.type,
    path: req.path,
    method: req.method,
    // Only log stack in development
    ...(isDevelopment && { stack: error.stack }),
  });
  
  // Get safe error response for client
  const safeResponse = getSafeErrorResponse(error, isDevelopment);
  
  res.status(safeResponse.statusCode).json({
    success: false,
    error: {
      code: safeResponse.code,
      message: safeResponse.message,
      ...(isDevelopment && safeResponse.stack && { stack: safeResponse.stack }),
      // Include request ID for debugging
      requestId: req.headers['x-correlation-id'] || 'unknown',
    }
  });
};

// ============================================================================
// ASYNC ERROR WRAPPER
// ============================================================================

/**
 * Wrap async route handlers to catch errors automatically
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
