/**
 * Response Standardization Utilities
 * 
 * Ensures all API responses follow a consistent format:
 * {
 *   success: boolean,
 *   data?: T,
 *   message?: string,
 *   error?: { code: string, message: string, details?: object }
 * }
 */

import { Response } from 'express';
import { ApiResponse, ApiError } from '../types';

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Send a successful response
 * @param res Express response object
 * @param data Response data
 * @param message Optional success message
 * @param statusCode HTTP status code (default: 200)
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  res.status(statusCode).json(response);
};

/**
 * Send a "created" response (201)
 * @param res Express response object
 * @param data Created resource data
 * @param message Optional success message
 */
export const sendCreated = <T>(
  res: Response,
  data: T,
  message = 'Resource created successfully'
): void => {
  sendSuccess(res, data, message, 201);
};

/**
 * Send a "no content" response (204)
 * @param res Express response object
 */
export const sendNoContent = (res: Response): void => {
  res.status(204).send();
};

/**
 * Send an error response
 * @param res Express response object
 * @param code Error code
 * @param message Error message
 * @param statusCode HTTP status code (default: 400)
 * @param details Optional error details
 */
export const sendError = (
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: string[]
): void => {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
  res.status(statusCode).json(response);
};

/**
 * Send a "not found" error (404)
 * @param res Express response object
 * @param resource Resource name (default: 'Resource')
 */
export const sendNotFound = (res: Response, resource = 'Resource'): void => {
  sendError(res, 'NOT_FOUND', `${resource} not found`, 404);
};

/**
 * Send an "unauthorized" error (401)
 * @param res Express response object
 * @param message Error message (default: 'Unauthorized')
 */
export const sendUnauthorized = (res: Response, message = 'Unauthorized'): void => {
  sendError(res, 'UNAUTHORIZED', message, 401);
};

/**
 * Send a "forbidden" error (403)
 * @param res Express response object
 * @param message Error message (default: 'Forbidden')
 */
export const sendForbidden = (res: Response, message = 'Forbidden'): void => {
  sendError(res, 'FORBIDDEN', message, 403);
};

/**
 * Send a "validation error" response (400)
 * @param res Express response object
 * @param details Validation error details
 */
export const sendValidationError = (
  res: Response,
  details: string[]
): void => {
  sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, details);
};

/**
 * Send a "conflict" error (409)
 * @param res Express response object
 * @param message Error message
 */
export const sendConflict = (res: Response, message: string): void => {
  sendError(res, 'CONFLICT', message, 409);
};

/**
 * Send a paginated response
 * @param res Express response object
 * @param items Array of items
 * @param total Total count
 * @param page Current page
 * @param limit Items per page
 */
export const sendPaginated = <T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  limit: number
): void => {
  const response: PaginatedResponse<T> = {
    success: true,
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
  res.json(response);
};

/**
 * Send a "too many requests" error (429)
 * @param res Express response object
 * @param retryAfter Seconds until retry
 */
export const sendRateLimitError = (res: Response, retryAfter: number): void => {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  };
  res.setHeader('Retry-After', retryAfter);
  res.status(429).json(response);
};
