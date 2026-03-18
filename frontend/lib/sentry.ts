/**
 * Sentry Error Tracking - Frontend
 * Production error monitoring and performance tracking
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Initialize Sentry for the frontend
 * Call this in your app initialization
 */
export const initSentry = (): void => {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  
  if (!dsn) {
    console.debug('Sentry DSN not configured, skipping error tracking');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Replay sampling (for debugging user issues)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Before send to filter sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request) {
        delete event.request.headers?.cookie;
        delete event.request.headers?.authorization;
      }
      
      // Remove sensitive URL parameters
      if (event.request?.url) {
        try {
          const url = new URL(event.request.url);
          ['token', 'password', 'secret', 'code'].forEach(param => {
            if (url.searchParams.has(param)) {
              url.searchParams.set(param, '[REDACTED]');
            }
          });
          event.request.url = url.toString();
        } catch {
          // URL parsing failed, leave as-is
        }
      }
      
      return event;
    },
    
    // Ignore common non-actionable errors
    ignoreErrors: [
      // Browser extensions
      /^Non-Error promise rejection captured with value: Object Not Found Matching Id/,
      /^Non-Error promise rejection captured with value: Not Available$/,
      // Network errors
      'Failed to fetch',
      'NetworkError when attempting to fetch resource.',
      'Network request failed',
      // ResizeObserver errors (often from browser extensions)
      'ResizeObserver loop completed with undelivered notifications.',
      'ResizeObserver loop limit exceeded',
    ],
  });
};

/**
 * Set user context for Sentry
 * Call this after user login
 */
export const setUserContext = (user: { id: string; email: string; role?: string }): void => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
};

/**
 * Clear user context on logout
 */
export const clearUserContext = (): void => {
  Sentry.setUser(null);
};

/**
 * Capture an error with optional context
 */
export const captureError = (error: Error, context?: Record<string, unknown>): void => {
  if (context) {
    Sentry.withScope(scope => {
      scope.setExtras(context);
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
};

/**
 * Capture a message
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info'): void => {
  Sentry.captureMessage(message, level);
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (
  message: string,
  category?: string,
  level: Sentry.SeverityLevel = 'info'
): void => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now(),
  });
};

export default Sentry;
