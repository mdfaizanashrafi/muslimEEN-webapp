/**
 * Common TypeScript Types for MuslimEEN API
 */

import { Request } from 'express';

// User type for authenticated requests
export interface User {
  id: string;
  email: string;
  role: string;
  [key: string]: unknown;
}

// Standard API Response
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// Pagination information
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Paginated API Response
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationInfo;
}

// Error response structure
export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

// Error API Response
export interface ErrorApiResponse {
  success: false;
  error: ErrorResponse;
}

// Authenticated Request extending Express Request
export interface AuthenticatedRequest extends Request {
  user: User;
}

// Optional Authenticated Request (user may not be present)
export interface OptionalAuthenticatedRequest extends Request {
  user?: User;
}

// Validation Error structure
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

// Validation Errors Response
export interface ValidationErrorsResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details: {
      errors: ValidationError[];
    };
  };
}

// API Error with operational flag
export interface OperationalError {
  statusCode: number;
  code: string;
  message: string;
  isOperational: boolean;
  stack?: string;
}
