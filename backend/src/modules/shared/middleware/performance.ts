/**
 * Performance Monitoring Middleware
 * Tracks response times and memory usage
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface PerformanceMetrics {
  requestStartTime: number;
  memoryAtStart: NodeJS.MemoryUsage;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      performanceMetrics?: PerformanceMetrics;
    }
  }
}

/**
 * Performance monitoring middleware
 */
export const performanceMonitor = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Capture start metrics
  req.performanceMetrics = {
    requestStartTime: Date.now(),
    memoryAtStart: process.memoryUsage(),
  };

  // Log slow requests
  res.on('finish', () => {
    if (!req.performanceMetrics) return;

    const duration = Date.now() - req.performanceMetrics.requestStartTime;
    const memoryUsed = process.memoryUsage();
    const memoryDelta = {
      heapUsed: memoryUsed.heapUsed - req.performanceMetrics.memoryAtStart.heapUsed,
      external: memoryUsed.external - req.performanceMetrics.memoryAtStart.external,
    };

    // Log warning for slow requests (> 1 second)
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
        memoryDelta: `${Math.round(memoryDelta.heapUsed / 1024 / 1024)}MB`,
      });
    }
  });

  next();
};

/**
 * Get current memory usage in MB
 */
export const getMemoryUsage = (): { heapUsed: number; heapTotal: number; external: number } => {
  const usage = process.memoryUsage();
  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024),
  };
};
