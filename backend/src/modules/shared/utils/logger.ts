/**
 * Logger Utility
 * Winston logger configuration
 */

import winston, { Logger as WinstonLogger, format } from 'winston';
import path from 'path';

// Define log level type
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Logger interface definition
export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown> | Error): void;
}

// Logger configuration interface
interface LoggerConfig {
  level: LogLevel;
  format: winston.Logform.Format;
  defaultMeta: Record<string, string>;
  transports: winston.transport[];
}

// Define log format
const logFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json()
);

// Logger configuration
const loggerConfig: LoggerConfig = {
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
const logger: WinstonLogger = winston.createLogger(loggerConfig);

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

export default logger as Logger;
export { logger };
