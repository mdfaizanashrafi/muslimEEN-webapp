/**
 * Logger Utility
 * Winston logger configuration
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

// Define log format
const logFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json()
);

// Logger configuration
const loggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  format: logFormat,
  defaultMeta: { service: 'muslimeen-api' },
  transports: [
    // Write error logs to file
    new winston.transports.File({
      filename: path.join(__dirname, '../../../../logs/error.log'),
      level: 'error'
    }),
    // Write all logs to file
    new winston.transports.File({
      filename: path.join(__dirname, '../../../../logs/combined.log')
    })
  ]
};

// Create logger
const winstonLogger = winston.createLogger(loggerConfig);

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  winstonLogger.add(new winston.transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = req.headers['x-correlation-id'] as string || generateCorrelationId();
  
  // Set correlation ID in response header
  res.setHeader('X-Correlation-Id', correlationId);
  
  winstonLogger.info('Request started', {
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
    
    winstonLogger.log(level, 'Request completed', {
      correlationId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    });
  });
  
  next();
};

export const logger: Logger = winstonLogger;
export default logger;
