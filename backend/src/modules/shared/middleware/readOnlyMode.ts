/**
 * Read-Only Mode Middleware
 * 
 * System Safety Feature: Allows the system to enter read-only mode during
 * critical operations, maintenance, or data consistency concerns.
 * 
 * When SYSTEM_READ_ONLY=true:
 * - GET and HEAD requests are allowed (read operations)
 * - POST, PUT, PATCH, DELETE are blocked (write operations)
 * - Returns 503 Service Unavailable with proper error message
 * 
 * When SYSTEM_READ_ONLY=false (default):
 * - All requests pass through normally
 * 
 * Usage:
 *   app.use(readOnlyMode);  // Add early in middleware chain
 * 
 * Environment:
 *   SYSTEM_READ_ONLY=true   # Enable read-only mode
 *   SYSTEM_READ_ONLY=false  # Normal operation (default)
 * 
 * DATE: 2026-03-20
 */

import { Request, Response, NextFunction } from 'express';
import { env } from '../../../config/env';
import { logger } from '../utils/logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * HTTP methods that are considered "read" operations
 * These are always allowed, even in read-only mode
 */
const READ_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * HTTP methods that are considered "write" operations
 * These are blocked when in read-only mode
 */
const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Paths that are always allowed, even in read-only mode
 * Used for health checks, status endpoints, etc.
 */
const EXEMPT_PATHS = [
  '/health',
  '/health/',
  '/api/health',
  '/api/health/',
  '/api/health/auth',
  '/api/health/auth/',
  '/status',
  '/api/status',
];

// ============================================================================
// READ-ONLY MODE CHECK
// ============================================================================

/**
 * Check if a request should be allowed in read-only mode
 */
const isRequestAllowed = (req: Request): boolean => {
  // Allow read methods
  if (READ_METHODS.includes(req.method)) {
    return true;
  }
  
  // Check exempt paths (exact match or prefix)
  const path = req.path;
  for (const exemptPath of EXEMPT_PATHS) {
    if (path === exemptPath || path.startsWith(exemptPath)) {
      return true;
    }
  }
  
  return false;
};

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Read-Only Mode Middleware
 * 
 * Blocks write operations when SYSTEM_READ_ONLY=true
 * Allows all operations when SYSTEM_READ_ONLY=false
 * 
 * @param req - Express request
 * @param res - Express response  
 * @param next - Express next function
 */
export const readOnlyMode = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check if read-only mode is enabled
  const isReadOnly = env.SYSTEM_READ_ONLY;
  
  // Normal operation - pass through
  if (!isReadOnly) {
    return next();
  }
  
  // Read-only mode active - check if request is allowed
  if (isRequestAllowed(req)) {
    // Add header to indicate read-only mode is active
    res.setHeader('X-Read-Only-Mode', 'active');
    return next();
  }
  
  // Write operation blocked
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  
  logger.warn('Write operation blocked - system in read-only mode', {
    method: req.method,
    path: req.path,
    ip: clientIp,
    userAgent: req.headers['user-agent']?.substring(0, 100),
  });
  
  // Return 503 Service Unavailable
  res.status(503).json({
    success: false,
    error: {
      code: 'SYSTEM_READ_ONLY',
      message: 'System is currently in read-only mode. Write operations are temporarily disabled.',
      details: {
        reason: 'System maintenance or data consistency protection',
        allowedMethods: READ_METHODS,
        retryAfter: 300, // Suggest retry after 5 minutes
      },
    },
    meta: {
      readOnlyMode: true,
      timestamp: new Date().toISOString(),
    },
  });
};

// ============================================================================
// CONDITIONAL MIDDLEWARE FACTORY
// ============================================================================

/**
 * Create conditional read-only middleware
 * 
 * Useful for applying read-only mode only to specific routes
 * 
 * @param enabled - Whether read-only mode is enabled for this route
 * @returns Express middleware
 * 
 * @example
 * ```typescript
 * // Apply to specific routes
 * router.use('/critical-data', conditionalReadOnlyMode(true));
 * ```
 */
export const conditionalReadOnlyMode = (enabled: boolean) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!enabled) {
      return next();
    }
    
    // Use the main middleware logic
    readOnlyMode(req, res, next);
  };
};

// ============================================================================
// STATUS ENDPOINT HELPER
// ============================================================================

/**
 * Get current read-only mode status
 * Useful for health checks and status endpoints
 */
export const getReadOnlyStatus = (): {
  enabled: boolean;
  allowedMethods: string[];
  blockedMethods: string[];
  exemptPaths: string[];
} => ({
  enabled: env.SYSTEM_READ_ONLY,
  allowedMethods: READ_METHODS,
  blockedMethods: WRITE_METHODS,
  exemptPaths: EXEMPT_PATHS,
});

// ============================================================================
// ADMIN CONTROL ENDPOINTS (Protected routes)
// ============================================================================

/**
 * Enable read-only mode endpoint handler
 * 
 * POST /admin/system/read-only/enable
 * Requires admin authentication
 */
export const enableReadOnlyMode = (req: Request, res: Response): void => {
  // Note: This is a placeholder - actual implementation would require
  // admin auth and dynamic env variable update or database flag
  
  logger.info('Read-only mode enable requested', {
    by: (req as any).user?.id || 'unknown',
    ip: req.ip,
  });
  
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Dynamic read-only mode toggle not implemented. Set SYSTEM_READ_ONLY=true in environment and restart.',
    },
  });
};

/**
 * Disable read-only mode endpoint handler
 * 
 * POST /admin/system/read-only/disable
 * Requires admin authentication
 */
export const disableReadOnlyMode = (req: Request, res: Response): void => {
  logger.info('Read-only mode disable requested', {
    by: (req as any).user?.id || 'unknown',
    ip: req.ip,
  });
  
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Dynamic read-only mode toggle not implemented. Set SYSTEM_READ_ONLY=false in environment and restart.',
    },
  });
};

/**
 * Get read-only mode status endpoint handler
 * 
 * GET /admin/system/read-only/status
 */
export const getReadOnlyModeStatus = (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: getReadOnlyStatus(),
  });
};

export default readOnlyMode;
