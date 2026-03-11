/**
 * Logger Utility
 * Winston logger configuration with security hardening
 * Automatically redacts sensitive information from logs
 */

import winston, { format } from 'winston';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

// Define log level type
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Logger interface definition
export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown> | Error): void;
}

// Generate correlation ID
export const generateCorrelationId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

// ============================================================================
// SECURITY: SENSITIVE DATA REDACTION
// ============================================================================

/**
 * Fields that should be redacted from logs
 */
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'password_hash',
  'token',
  'accessToken',
  'refreshToken',
  'csrfToken',
  'csrf_token',
  'secret',
  'apiKey',
  'api_key',
  'creditCard',
  'credit_card',
  'cvv',
  'ssn',
  'socialSecurity',
  'auth',
  'authorization',
  'cookie',
  'session',
];

/**
 * Patterns that indicate sensitive data
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /key/i,
  /auth/i,
  /credential/i,
  /session/i,
  /cookie/i,
];

/**
 * Redact sensitive values from an object
 * Recursively traverses objects and redacts sensitive fields
 */
const redactSensitiveData = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    // Check if string looks like a sensitive token/value
    if (obj.length > 20 && /^[a-zA-Z0-9_-]+$/.test(obj)) {
      return '[REDACTED]';
    }
    return obj;
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveData);
  }
  
  const redacted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Check if key indicates sensitive data
    const isSensitive = SENSITIVE_FIELDS.some(field => 
      key.toLowerCase().includes(field.toLowerCase())
    ) || SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
    
    if (isSensitive) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }
  
  return redacted;
};

/**
 * Sanitize URL to remove sensitive query parameters
 */
const sanitizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url, 'http://localhost');
    SENSITIVE_FIELDS.forEach(field => {
      if (urlObj.searchParams.has(field)) {
        urlObj.searchParams.set(field, '[REDACTED]');
      }
    });
    return urlObj.pathname + urlObj.search;
  } catch {
    return url;
  }
};

// ============================================================================
// LOGGER CONFIGURATION
// ============================================================================

const logFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json()
);

const loggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  format: logFormat,
  defaultMeta: { service: 'muslimeen-api' },
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../../../logs/error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../../../logs/combined.log')
    })
  ]
};

const winstonLogger = winston.createLogger(loggerConfig);

if (process.env.NODE_ENV !== 'production') {
  winstonLogger.add(new winston.transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

// ============================================================================
// REQUEST LOGGER WITH SECURITY
// ============================================================================

/**
 * Request logging middleware
 * Automatically redacts sensitive data from logs
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = req.headers['x-correlation-id'] as string || generateCorrelationId();
  
  res.setHeader('X-Correlation-Id', correlationId);
  
  // SECURITY: Sanitize request data before logging
  const sanitizedQuery = redactSensitiveData(req.query);
  const sanitizedBody = redactSensitiveData(req.body);
  const sanitizedUrl = sanitizeUrl(req.originalUrl || req.url);
  
  winstonLogger.info('Request started', {
    correlationId,
    method: req.method,
    path: sanitizedUrl,
    query: Object.keys(sanitizedQuery).length > 0 ? sanitizedQuery : undefined,
    // Only log body in development and exclude sensitive routes
    body: (process.env.NODE_ENV === 'development' && 
           !req.path.includes('auth') && 
           !req.path.includes('login')) 
      ? sanitizedBody 
      : undefined,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    
    winstonLogger.log(level, 'Request completed', {
      correlationId,
      method: req.method,
      path: sanitizedUrl,
      statusCode: res.statusCode,
      duration,
    });
  });
  
  next();
};

// ============================================================================
// SECURE LOGGER EXPORT
// ============================================================================

/**
 * Secure logger that automatically redacts sensitive data
 */
const secureLogger: Logger = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    winstonLogger.debug(message, redactSensitiveData(meta));
  },
  info: (message: string, meta?: Record<string, unknown>) => {
    winstonLogger.info(message, redactSensitiveData(meta));
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    winstonLogger.warn(message, redactSensitiveData(meta));
  },
  error: (message: string, meta?: Record<string, unknown> | Error) => {
    if (meta instanceof Error) {
      winstonLogger.error(message, { 
        error: meta.message,
        stack: meta.stack,
      });
    } else {
      winstonLogger.error(message, redactSensitiveData(meta));
    }
  },
};

export const logger = secureLogger;
export default secureLogger;

// Export utility functions for testing
export { redactSensitiveData, sanitizeUrl };
