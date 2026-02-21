/**
 * Standardized API Response Helpers
 */

import { ApiResponse, PaginatedResponse, ErrorResponse, PaginationInfo } from './types';

/**
 * Creates a successful API response
 * @param data - Response data
 * @param message - Optional success message
 * @returns Standardized success response
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

/**
 * Creates an error API response object
 * @param message - Error message
 * @param code - Error code (default: 'INTERNAL_ERROR')
 * @param details - Additional error details
 * @returns Error response object
 */
export function errorResponse(
  message: string,
  code: string = 'INTERNAL_ERROR',
  details?: Record<string, unknown>
): { success: false; error: ErrorResponse } {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
}

/**
 * Creates a paginated API response
 * @param data - Array of items
 * @param pagination - Pagination information
 * @returns Paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: PaginationInfo
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination,
  };
}
