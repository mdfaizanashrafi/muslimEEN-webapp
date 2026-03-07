/**
 * Structured Logging Utility
 * Winston logger with correlation IDs and request tracking
 */

import winston from 'winston';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

const { combine, timestamp, json, errors, printf, colorize } = winston.format;

// Define log level type
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Generate correlation ID for request tracing
 * Format: timestamp-randomString
 */
export const generateCorrelationId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Create logger with structured format for a specific service
 */
export const createLogger = (service: string) => {
  const transports: winston.transport[] = [
    // Write error logs to file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error'
    }),
    // Write all logs to file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log')
    })
  ];

  // Add console transport in development or if explicitly enabled
  if (process.env.NODE_ENV !== 'production' || process.env.LOG_TO_CONSOLE === 'true') {
    transports.push(
      new winston.transports.Console({
        format: combine(
          colorize(),
          printf(({ level, message, timestamp, service, correlationId, ...metadata }) => {
            let msg = `${timestamp} [${level}] [${service}]`;
            if (correlationId) msg += ` [${correlationId}]`;
            msg += `: ${message}`;
            if (Object.keys(metadata).length > 0) {
              msg += ` ${JSON.stringify(metadata)}`;
            }
            return msg;
          })
        )
      })
    );
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service },
    format: combine(
      timestamp(),
      errors({ stack: true }),
      json()
    ),
    transports,
  });
};

// Default logger instance
export const logger = createLogger('muslimeen-api');

/**
 * Extend Express Request to include correlationId
 */
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

/**
 * Request logging middleware
 * Tracks request lifecycle with correlation IDs
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = req.headers['x-correlation-id'] as string || generateCorrelationId();
  req.correlationId = correlationId;
  
  // Set correlation ID in response header
  res.setHeader('X-Correlation-Id', correlationId);
  
  logger.info('Request started', {
    correlationId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger.log(level, 'Request completed', {
      correlationId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    });
  });
  
  next();
};

/**
 * Logger interface for type safety
 */
export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown> | Error): void;
}

export default logger as Logger;
