/**
 * Error Handler Middleware
 * Centralized error handling with Sentry integration
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { captureError } from '../config/sentry';

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * 404 Not Found handler
 */
export const notFound = (req: Request, res: Response, _next: NextFunction): void => {
  logger.warn(`Route not found: ${req.originalUrl}`, {
    method: req.method,
    path: req.originalUrl,
    correlationId: req.correlationId,
  });
  
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`
    }
  });
};

/**
 * Global error handler
 */
export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error with correlation ID
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    correlationId: req.correlationId,
  });
  
  // Capture error in Sentry with context
  captureError(error, {
    path: req.path,
    method: req.method,
    correlationId: req.correlationId,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  // Default error response
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let code = error.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  }

  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token expired';
  }

  if (error.code === '23505') { // PostgreSQL unique violation
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'Resource already exists';
  }
  
  if (error.code === 'ECONNREFUSED') {
    statusCode = 503;
    code = 'SERVICE_UNAVAILABLE';
    message = 'Service temporarily unavailable';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      correlationId: req.correlationId,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
