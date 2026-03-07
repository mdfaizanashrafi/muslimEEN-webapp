/**
 * Performance Monitoring Middleware
 * Tracks request response times and logs slow requests
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types';

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  WARNING: 500,    // Log warning for requests > 500ms
  SLOW: 1000,      // Log slow request for > 1s
  CRITICAL: 5000,  // Log critical for > 5s
};

// Performance metrics storage (for in-memory aggregation)
interface RequestMetrics {
  count: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  slowRequests: number;
  errors: number;
}

const metricsMap = new Map<string, RequestMetrics>();

/**
 * Get or create metrics entry for a route
 */
const getMetrics = (route: string): RequestMetrics => {
  if (!metricsMap.has(route)) {
    metricsMap.set(route, {
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      slowRequests: 0,
      errors: 0,
    });
  }
  return metricsMap.get(route)!;
};

/**
 * Update metrics for a route
 */
const updateMetrics = (route: string, duration: number, statusCode: number): void => {
  const metrics = getMetrics(route);
  
  metrics.count++;
  metrics.totalDuration += duration;
  metrics.avgDuration = metrics.totalDuration / metrics.count;
  metrics.minDuration = Math.min(metrics.minDuration, duration);
  metrics.maxDuration = Math.max(metrics.maxDuration, duration);
  
  if (duration > PERFORMANCE_THRESHOLDS.SLOW) {
    metrics.slowRequests++;
  }
  
  if (statusCode >= 400) {
    metrics.errors++;
  }
};

/**
 * Performance monitoring middleware
 * Tracks request duration and logs slow requests
 */
export const performanceMonitor = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = process.hrtime();
  const route = `${req.method} ${req.route?.path || req.path}`;
  
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const duration = (diff[0] * 1e9 + diff[1]) / 1e6; // Convert to milliseconds
    
    // Update in-memory metrics
    updateMetrics(route, duration, res.statusCode);
    
    // Log slow requests
    if (duration > PERFORMANCE_THRESHOLDS.CRITICAL) {
      logger.error('CRITICAL: Very slow request detected', {
        method: req.method,
        path: req.path,
        route: req.route?.path,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
        userId: (req as AuthenticatedRequest).user?.id,
        correlationId: req.correlationId,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        bodySize: req.headers['content-length'],
      });
    } else if (duration > PERFORMANCE_THRESHOLDS.SLOW) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        route: req.route?.path,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
        userId: (req as AuthenticatedRequest).user?.id,
        correlationId: req.correlationId,
      });
    } else if (duration > PERFORMANCE_THRESHOLDS.WARNING) {
      logger.info('Request exceeded warning threshold', {
        method: req.method,
        path: req.path,
        duration: `${duration.toFixed(2)}ms`,
        threshold: PERFORMANCE_THRESHOLDS.WARNING,
      });
    }
    
    // Add performance header in development/staging
    if (process.env.NODE_ENV !== 'production') {
      res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
    }
  });
  
  next();
};

/**
 * Get aggregated performance metrics
 */
export const getPerformanceMetrics = (): Record<string, RequestMetrics> => {
  const metrics: Record<string, RequestMetrics> = {};
  metricsMap.forEach((value, key) => {
    metrics[key] = { ...value };
  });
  return metrics;
};

/**
 * Reset performance metrics
 */
export const resetPerformanceMetrics = (): void => {
  metricsMap.clear();
};

/**
 * Get performance summary
 */
export const getPerformanceSummary = () => {
  let totalRequests = 0;
  let totalSlowRequests = 0;
  let totalErrors = 0;
  
  metricsMap.forEach((metrics) => {
    totalRequests += metrics.count;
    totalSlowRequests += metrics.slowRequests;
    totalErrors += metrics.errors;
  });
  
  return {
    totalRequests,
    totalSlowRequests,
    totalErrors,
    slowRequestRate: totalRequests > 0 ? (totalSlowRequests / totalRequests) * 100 : 0,
    errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
    routeCount: metricsMap.size,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Middleware to track database query performance
 */
export const databasePerformanceTracker = (queryName: string, duration: number): void => {
  if (duration > PERFORMANCE_THRESHOLDS.SLOW) {
    logger.warn('Slow database query detected', {
      queryName,
      duration: `${duration.toFixed(2)}ms`,
    });
  }
};

export default performanceMonitor;
