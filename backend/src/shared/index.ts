/**
 * Shared Utilities Index
 * Export all shared modules
 */

// Logger
export { default as logger } from './logger';

// API Response Helpers
export {
  successResponse,
  errorResponse,
  paginatedResponse,
} from './apiResponse';

// Types
export type {
  User,
  ApiResponse,
  PaginationInfo,
  PaginatedResponse,
  ErrorResponse,
  ErrorApiResponse,
  AuthenticatedRequest,
  OptionalAuthenticatedRequest,
  ValidationError,
  ValidationErrorsResponse,
  OperationalError,
} from './types';

// Error Classes
export {
  AppError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
} from './errors';
