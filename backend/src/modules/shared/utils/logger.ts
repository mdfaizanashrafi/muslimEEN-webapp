/**
 * Logger Utility - PRODUCTION-HARDENED VERSION
 * 
 * CRITICAL FIXES:
 * 1. Handles circular references (WeakSet tracking)
 * 2. Depth limiting (prevents deep recursion)
 * 3. Skips massive/complex objects (socket, client, req, res)
 * 4. Safe error serialization
 * 5. Never crashes the app
 * 
 * Security: Automatically redacts sensitive information from logs
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
// SECURITY: SENSITIVE DATA REDACTION - HARDENED
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
 * Keys to skip entirely (massive objects that cause issues)
 */
const SKIP_KEYS = [
  'socket',
  'client',
  'req',
  'res',
  'connection',
  'server',
  'redis',
  'pool',
  'app',
  '_events',
  '_maxListeners',
  'domain',
];

/**
 * Maximum depth for object traversal
 */
const MAX_DEPTH = 5;

/**
 * Safe error serialization
 * Extracts only safe, serializable properties
 */
const safeError = (err: any): Record<string, unknown> => {
  if (!err) return { message: 'Unknown error' };
  
  if (typeof err === 'string') {
    return { message: err };
  }
  
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      // Include standard error codes if present
      code: (err as any).code,
      errno: (err as any).errno,
      syscall: (err as any).syscall,
    };
  }
  
  // For non-error objects, return a safe representation
  return {
    message: String(err),
    type: typeof err,
  };
};

/**
 * Redact sensitive values from an object - HARDENED VERSION
 * 
 * PROTECTIONS:
 * - Circular reference detection (WeakSet)
 * - Depth limiting (MAX_DEPTH)
 * - Skips massive/complex objects (SKIP_KEYS)
 * - Never throws, never recurses infinitely
 */
const redactSensitiveData = (obj: any, seen = new WeakSet(), depth = 0): any => {
  try {
    // Handle primitives
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    // Handle strings (check for tokens)
    if (typeof obj === 'string') {
      if (obj.length > 20 && /^[a-zA-Z0-9_-]+$/.test(obj)) {
        return '[REDACTED]';
      }
      return obj;
    }
    
    // Handle non-objects
    if (typeof obj !== 'object') {
      return obj;
    }
    
    // CIRCULAR REFERENCE PROTECTION
    if (seen.has(obj)) {
      return '[CIRCULAR]';
    }
    seen.add(obj);
    
    // DEPTH LIMITING
    if (depth > MAX_DEPTH) {
      return '[MAX_DEPTH]';
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => redactSensitiveData(item, seen, depth + 1));
    }
    
    // Handle objects
    const redacted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // SKIP massive/problematic objects
      if (SKIP_KEYS.includes(key)) {
        redacted[key] = '[SKIPPED]';
        continue;
      }
      
      // Check if key indicates sensitive data
      const isSensitive = SENSITIVE_FIELDS.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      ) || SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
      
      if (isSensitive) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        redacted[key] = redactSensitiveData(value, seen, depth + 1);
      } else {
        redacted[key] = value;
      }
    }
    
    return redacted;
  } catch (e) {
    // FAIL-SAFE: If anything goes wrong, return a safe placeholder
    return '[REDACTION_ERROR]';
  }
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
  
  try {
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
  } catch (e) {
    // FAIL-SAFE: If logging fails, don't crash the app
    console.error('Request logging failed', e);
  }
  
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    
    try {
      winstonLogger.log(level, 'Request completed', {
        correlationId,
        method: req.method,
        path: sanitizedUrl,
        statusCode: res.statusCode,
        duration,
      });
    } catch (e) {
      console.error('Response logging failed', e);
    }
  });
  
  next();
};

// ============================================================================
// SECURE LOGGER EXPORT - HARDENED
// ============================================================================

/**
 * Safe wrapper that catches any logging errors
 */
const safeLog = (level: LogLevel, message: string, meta?: any) => {
  try {
    if (meta instanceof Error) {
      // Convert Error to safe object
      winstonLogger.log(level, message, safeError(meta));
    } else if (meta && typeof meta === 'object') {
      // Redact sensitive data
      winstonLogger.log(level, message, redactSensitiveData(meta));
    } else {
      winstonLogger.log(level, message, meta);
    }
  } catch (e) {
    // FAIL-SAFE: Log to console if winston fails
    console.error(`[${level.toUpperCase()}] ${message}`, meta);
    console.error('Logger error:', e);
  }
};

/**
 * Secure logger that automatically redacts sensitive data
 * NEVER crashes the app
 */
const secureLogger: Logger = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    safeLog('debug', message, meta);
  },
  info: (message: string, meta?: Record<string, unknown>) => {
    safeLog('info', message, meta);
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    safeLog('warn', message, meta);
  },
  error: (message: string, meta?: Record<string, unknown> | Error) => {
    safeLog('error', message, meta);
  },
};

export const logger = secureLogger;
export default secureLogger;

// Export utility functions for testing
export { redactSensitiveData, sanitizeUrl, safeError };
