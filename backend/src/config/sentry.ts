/**
 * Sentry Error Tracking Configuration
 * Centralized error monitoring and performance tracking
 */

import * as Sentry from '@sentry/node';
import { Express } from 'express';
import { logger } from '../modules/shared/utils/logger';

/**
 * Initialize Sentry with Express integration
 */
export const initSentry = (app: Express): void => {
  if (!process.env.SENTRY_DSN) {
    logger.info('Sentry DSN not configured, skipping error tracking setup');
    return;
  }
  
  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.npm_package_version || '1.0.0',
      
      // Enable performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Enable profiling (requires @sentry/profiling-node)
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Attach stack traces to messages
      attachStacktrace: true,
      
      // Before send hook for filtering
      beforeSend(event) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers?.cookie;
          delete event.request.headers?.authorization;
        }
        return event;
      },
    });
    
    logger.info('Sentry initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Sentry', { error: (error as Error).message });
  }
};

/**
 * Setup Sentry request handlers for Express
 * Must be added BEFORE all routes
 */
export const setupSentryRequestHandlers = (app: Express): void => {
  if (!process.env.SENTRY_DSN) return;
  
  // The request handler must be the first middleware
  app.use(Sentry.Handlers.requestHandler());
  
  // Tracing handler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());
  
  logger.debug('Sentry request handlers configured');
};

/**
 * Setup Sentry error handler for Express
 * Must be added AFTER all routes and BEFORE other error handlers
 */
export const setupSentryErrorHandler = (app: Express): void => {
  if (!process.env.SENTRY_DSN) return;
  
  // The error handler must be before any other error middleware
  app.use(Sentry.Handlers.errorHandler());
  
  logger.debug('Sentry error handler configured');
};

/**
 * Capture an error with optional context
 */
export const captureError = (error: Error, context?: Record<string, unknown>): string | null => {
  if (!process.env.SENTRY_DSN) {
    logger.debug('Sentry not configured, error not sent to Sentry', { error: error.message });
    return null;
  }
  
  try {
    const scope = new Sentry.Scope();
    if (context) {
      scope.setExtras(context);
    }
    const eventId = Sentry.captureException(error, scope);
    
    logger.debug('Error captured in Sentry', { eventId, error: error.message });
    return eventId;
  } catch (sentryError) {
    logger.error('Failed to capture error in Sentry', { 
      error: (sentryError as Error).message,
      originalError: error.message 
    });
    return null;
  }
};

/**
 * Capture a message (for non-error events)
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, unknown>): string | null => {
  if (!process.env.SENTRY_DSN) {
    logger.debug('Sentry not configured, message not sent', { message });
    return null;
  }
  
  try {
    const eventId = Sentry.captureMessage(message, level);
    
    if (context) {
      Sentry.setExtras(context);
    }
    
    return eventId;
  } catch (error) {
    logger.error('Failed to capture message in Sentry', { error: (error as Error).message });
    return null;
  }
};

/**
 * Set user context for Sentry
 */
export const setUserContext = (user: { id: string; email: string; role?: string }): void => {
  if (!process.env.SENTRY_DSN) return;
  
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
};

/**
 * Clear user context (call on logout)
 */
export const clearUserContext = (): void => {
  if (!process.env.SENTRY_DSN) return;
  
  Sentry.setUser(null);
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (
  message: string, 
  category?: string, 
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, unknown>
): void => {
  if (!process.env.SENTRY_DSN) return;
  
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now(),
  });
};

/**
 * Create a child scope for isolated error tracking
 */
export const withScope = <T>(callback: (scope: Sentry.Scope) => T): T => {
  return Sentry.withScope(callback);
};

export default Sentry;
