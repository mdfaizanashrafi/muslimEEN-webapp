/**
 * Error Handling Middleware
 * Centralized error handling
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { env } from '../config/env';

/**
 * Custom Application Error
 */
export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error response interface
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    stack?: string;
  };
}

/**
 * Global error handler
 */
export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = (err as AppError).statusCode || 500;
  const code = (err as AppError).code || 'INTERNAL_ERROR';

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error:', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
  } else {
    logger.warn('Client error:', {
      error: err.message,
      code: code,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
  }

  // Production: don't leak error details
  if (env.NODE_ENV === 'production' && !(err as AppError).isOperational) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    });
    return;
  }

  // Send error response
  const response: ErrorResponse = {
    success: false,
    error: {
      code: code,
      message: err.message
    }
  };

  // Include stack trace in development
  if (env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * 404 handler
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const err = new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
  next(err);
};
