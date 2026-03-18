/**
 * Error Message Utilities
 * Converts technical errors to human-friendly messages
 */

import { ApiErrorType, type ApiError } from './api';

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  // Handle API errors
  if (error && typeof error === 'object' && 'userMessage' in error) {
    return (error as ApiError).userMessage;
  }

  // Handle standard errors
  if (error instanceof Error) {
    return error.message;
  }

  // Fallback
  return 'Something went wrong. Please try again.';
}

/**
 * Map error types to action messages
 */
export function getErrorAction(error: ApiError): string | null {
  const actions: Partial<Record<ApiErrorType, string>> = {
    [ApiErrorType.AUTH]: 'Please log in again to continue.',
    [ApiErrorType.CSRF]: 'Please refresh the page and try again.',
    [ApiErrorType.OFFLINE]: 'Please check your connection and try again.',
    [ApiErrorType.TIMEOUT]: 'Please wait a moment and try again.',
    [ApiErrorType.NETWORK]: 'Please check your internet connection.',
    [ApiErrorType.SYSTEM_UNAVAILABLE]: 'Please try again in a few minutes.',
  };

  return actions[error.type] || null;
}

/**
 * Form validation error messages
 */
export const validationMessages = {
  required: (field: string) => `${field} is required`,
  email: 'Please enter a valid email address',
  minLength: (field: string, min: number) => `${field} must be at least ${min} characters`,
  maxLength: (field: string, max: number) => `${field} must be less than ${max} characters`,
  passwordMatch: 'Passwords do not match',
  passwordStrength: 'Password must include uppercase, lowercase, and number',
  invalidCode: 'Invalid invitation code',
};

/**
 * Success messages for common actions
 */
export const successMessages = {
  login: (name?: string) => name ? `Welcome back, ${name}!` : 'Welcome back!',
  logout: 'You have been logged out successfully.',
  register: 'Account created successfully! Welcome to MuslimEEN.',
  profileUpdate: 'Profile updated successfully.',
  inviteSent: 'Invitation sent successfully.',
  connectionRequest: 'Connection request sent.',
  connectionAccepted: 'Connection accepted.',
  passwordChanged: 'Password changed successfully.',
  settingsSaved: 'Settings saved successfully.',
  dataLoaded: 'Data loaded successfully.',
  actionCompleted: 'Action completed successfully.',
};

/**
 * Loading messages for common actions
 */
export const loadingMessages = {
  login: 'Logging you in...',
  logout: 'Logging you out...',
  register: 'Creating your account...',
  profileUpdate: 'Saving your changes...',
  dataLoading: 'Loading your data...',
  dashboardLoading: 'Loading your dashboard...',
  inviteSending: 'Sending invitation...',
  connectionRequesting: 'Sending connection request...',
  formSubmitting: 'Submitting...',
  processing: 'Processing...',
};

/**
 * Technical to human error mapping
 * For backend errors that need translation
 */
export const technicalErrorMap: Record<string, string> = {
  // Auth errors
  'INVALID_CREDENTIALS': 'Invalid email or password. Please try again.',
  'USER_NOT_FOUND': 'No account found with this email.',
  'EMAIL_ALREADY_EXISTS': 'An account with this email already exists.',
  'ACCOUNT_LOCKED': 'Your account has been locked. Please contact support.',
  'ACCOUNT_INACTIVE': 'Your account is not active. Please contact support.',
  
  // CSRF errors
  'CSRF_TOKEN_MISSING': 'Your session needs refreshing. Please try again.',
  'CSRF_TOKEN_INVALID': 'Your session has expired. Please refresh the page.',
  
  // Validation errors
  'INVALID_EMAIL': 'Please enter a valid email address.',
  'WEAK_PASSWORD': 'Please choose a stronger password.',
  'INVALID_INVITE_CODE': 'This invitation code is invalid or has expired.',
  'INVITE_ALREADY_USED': 'This invitation has already been used.',
  
  // Rate limiting
  'RATE_LIMITED': 'Too many attempts. Please wait a moment and try again.',
  'TOO_MANY_REQUESTS': 'Too many requests. Please slow down.',
  
  // Server errors
  'INTERNAL_ERROR': 'Something went wrong on our end. Please try again.',
  'SERVICE_UNAVAILABLE': 'Service temporarily unavailable. Please try again later.',
  'DATABASE_ERROR': 'Unable to save data. Please try again.',
};

/**
 * Convert technical error code to human message
 */
export function translateErrorCode(code: string): string {
  return technicalErrorMap[code] || 'Something went wrong. Please try again.';
}

/**
 * Format error for display
 * Combines message and action
 */
export function formatErrorForDisplay(error: ApiError): { title: string; message: string; action: string | null } {
  const titles: Partial<Record<ApiErrorType, string>> = {
    [ApiErrorType.AUTH]: 'Session Expired',
    [ApiErrorType.CSRF]: 'Security Error',
    [ApiErrorType.OFFLINE]: 'You Are Offline',
    [ApiErrorType.NETWORK]: 'Connection Issue',
    [ApiErrorType.TIMEOUT]: 'Request Timed Out',
    [ApiErrorType.SERVER]: 'Server Error',
    [ApiErrorType.VALIDATION]: 'Invalid Input',
    [ApiErrorType.SYSTEM_UNAVAILABLE]: 'Service Unavailable',
  };

  return {
    title: titles[error.type] || 'Error',
    message: error.userMessage,
    action: getErrorAction(error),
  };
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: ApiError): boolean {
  return error.retryable || 
    error.type === ApiErrorType.TIMEOUT ||
    error.type === ApiErrorType.NETWORK;
}

export { ApiErrorType };
export default {
  getErrorMessage,
  getErrorAction,
  validationMessages,
  successMessages,
  loadingMessages,
  translateErrorCode,
  formatErrorForDisplay,
  isRetryableError,
};
