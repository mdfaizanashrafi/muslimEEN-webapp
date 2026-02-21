/**
 * Middleware Index
 * Central export for all middleware modules
 */

// Authentication & Authorization
export {
  generateToken,
  verifyToken,
  authenticate,
  optionalAuth,
  authorize,
  type JWTPayload,
  type AuthenticatedRequest
} from './auth.middleware';

// Rate Limiting
export {
  authLimiter,
  userLimiter,
  marketplaceLimiter,
  messageLimiter,
  apiLimiter
} from './rateLimiter.middleware';

// Error Handling
export {
  AppError,
  errorHandler,
  notFound,
  type ErrorResponse
} from './error.middleware';

// Validation (re-export from centralized validation utilities)
export {
  validate,
  validateRequest,
  validationSchemas
} from './validation.middleware';
