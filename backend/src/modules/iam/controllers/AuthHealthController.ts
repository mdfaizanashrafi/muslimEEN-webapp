/**
 * Auth Health Controller - ENHANCED
 * 
 * Provides comprehensive health check endpoint for authentication system status.
 * Includes real-time checks for database, Clerk API, and webhook status.
 * 
 * DATE: 2026-03-20
 * UPDATED: 2026-03-20 (Enhanced with real checks)
 */

import { Request, Response } from 'express';
import { featureFlags } from '../../../config/featureFlags';
import { getDetectionStats, isReadyForCleanup } from '../middleware/legacyAuthDetection';
import { logger } from '../../shared/utils/logger';
import pool from '../../database/pool';
import { metricsTracker, failedEventQueue } from '../services/WebhookRetryService';

// ============================================================================
// ERROR TRACKING (for error rate calculation)
// ============================================================================

interface ErrorRecord {
  timestamp: Date;
  error: string;
  context: string;
}

const recentErrors: ErrorRecord[] = [];
const MAX_ERROR_HISTORY = 1000;
const ERROR_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Record an error for health monitoring
 */
export const recordAuthError = (error: string, context: string): void => {
  recentErrors.push({
    timestamp: new Date(),
    error,
    context,
  });
  
  // Trim old errors
  if (recentErrors.length > MAX_ERROR_HISTORY) {
    recentErrors.shift();
  }
  
  // Remove errors older than window
  const cutoff = new Date(Date.now() - ERROR_WINDOW_MS);
  while (recentErrors.length > 0 && recentErrors[0].timestamp < cutoff) {
    recentErrors.shift();
  }
};

/**
 * Calculate error rate for last N minutes
 */
const calculateErrorRate = (minutes: number = 5): { count: number; rate: number } => {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  const recentCount = recentErrors.filter(e => e.timestamp >= cutoff).length;
  
  // Rate is errors per minute (normalized)
  const rate = recentCount / minutes;
  
  return { count: recentCount, rate: parseFloat(rate.toFixed(2)) };
};

// ============================================================================
// HEALTH CHECK FUNCTIONS
// ============================================================================

/**
 * Check database connectivity
 */
const checkDatabase = async (): Promise<{ healthy: boolean; responseTimeMs: number; error?: string }> => {
  const start = Date.now();
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1 as health_check');
      return {
        healthy: true,
        responseTimeMs: Date.now() - start,
      };
    } finally {
      client.release();
    }
  } catch (error: any) {
    logger.error('Database health check failed', { error: error.message });
    recordAuthError(error.message, 'database_ping');
    return {
      healthy: false,
      responseTimeMs: Date.now() - start,
      error: error.message,
    };
  }
};

/**
 * Check Clerk API reachability
 */
const checkClerkAPI = async (): Promise<{ healthy: boolean; responseTimeMs: number; error?: string }> => {
  const start = Date.now();
  try {
    const { clerkClient } = await import('@clerk/clerk-sdk-node');
    
    // Make a lightweight API call (get user list with limit 1)
    await clerkClient.users.getUserList({ limit: 1 });
    
    return {
      healthy: true,
      responseTimeMs: Date.now() - start,
    };
  } catch (error: any) {
    logger.error('Clerk API health check failed', { error: error.message });
    recordAuthError(error.message, 'clerk_api');
    return {
      healthy: false,
      responseTimeMs: Date.now() - start,
      error: error.message,
    };
  }
};

/**
 * Get webhook status
 */
const getWebhookStatus = () => {
  const metrics = metricsTracker.getMetrics();
  
  return {
    lastReceived: metrics.lastSuccessTimestamp?.toISOString() || null,
    lastFailure: metrics.lastFailureTimestamp?.toISOString() || null,
    totalReceived: metrics.totalReceived,
    totalProcessed: metrics.totalProcessed,
    totalFailed: metrics.totalFailed,
    failedQueueSize: metrics.currentQueueSize,
    health: metricsTracker.getHealthStatus(),
  };
};

// ============================================================================
// MAIN HEALTH ENDPOINT (ENHANCED)
// ============================================================================

/**
 * GET /health/auth
 * 
 * Returns comprehensive authentication system health status.
 * Performs real checks on database, Clerk API, and tracks errors.
 */
export const getAuthHealth = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    // Get legacy detection stats
    const detectionStats = getDetectionStats();
    const readyForCleanup = isReadyForCleanup();
    
    // Perform real health checks (in parallel)
    const [dbStatus, clerkStatus] = await Promise.all([
      checkDatabase(),
      checkClerkAPI(),
    ]);
    
    // Calculate error rates
    const errorRate5m = calculateErrorRate(5);
    const errorRate1m = calculateErrorRate(1);
    
    // Get webhook status
    const webhookStatus = getWebhookStatus();
    
    // Determine overall health
    const isHealthy = dbStatus.healthy && clerkStatus.healthy && webhookStatus.health !== 'unhealthy';
    
    const health = {
      success: true,
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
      status: isHealthy ? 'healthy' : 'unhealthy',
      auth: {
        system: 'clerk',
        legacy_enabled: !featureFlags.isEnabled('DISABLE_LEGACY_AUTH'),
        detection_enabled: featureFlags.isEnabled('ENABLE_LEGACY_AUTH_DETECTION'),
      },
      checks: {
        database: {
          status: dbStatus.healthy ? 'healthy' : 'unhealthy',
          responseTimeMs: dbStatus.responseTimeMs,
          error: dbStatus.error,
        },
        clerk_api: {
          status: clerkStatus.healthy ? 'healthy' : 'unhealthy',
          responseTimeMs: clerkStatus.responseTimeMs,
          error: clerkStatus.error,
        },
        webhooks: webhookStatus,
      },
      errors: {
        last_1_minute: errorRate1m,
        last_5_minutes: errorRate5m,
        total_recent: recentErrors.length,
      },
      legacy: {
        detections_24h: {
          jwt: detectionStats.jwtAttempts,
          csrf: detectionStats.csrfAttempts,
          cookies: detectionStats.legacyCookieAttempts,
        },
        unique_endpoints: detectionStats.uniqueEndpoints.size,
        unique_ips: detectionStats.uniqueIps.size,
        last_detection: detectionStats.lastDetection?.toISOString() || null,
        ready_for_cleanup: readyForCleanup,
      },
      flags: {
        USE_CLERK_AUTH: featureFlags.isEnabled('USE_CLERK_AUTH'),
        DISABLE_LEGACY_AUTH: featureFlags.isEnabled('DISABLE_LEGACY_AUTH'),
        ENABLE_LEGACY_AUTH_DETECTION: featureFlags.isEnabled('ENABLE_LEGACY_AUTH_DETECTION'),
      },
    };
    
    // Log health check (only if degraded or unhealthy)
    if (!isHealthy) {
      logger.warn('Auth health check detected issues', {
        status: health.status,
        database: health.checks.database.status,
        clerk_api: health.checks.clerk_api.status,
        webhooks: health.checks.webhooks.health,
      });
    } else {
      logger.debug('Auth health check passed', {
        responseTimeMs: health.responseTimeMs,
      });
    }
    
    // Return appropriate status code
    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json(health);
    
  } catch (error: any) {
    logger.error('Auth health check failed with exception', { error: error.message });
    recordAuthError(error.message, 'health_check');
    
    res.status(503).json({
      success: false,
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: 'Health check failed to execute',
      details: error.message,
    });
  }
};

/**
 * GET /health/auth/ready
 * 
 * Simple check - returns 200 if ready for cleanup, 503 if not
 */
export const getAuthReadyStatus = async (req: Request, res: Response): Promise<void> => {
  const ready = isReadyForCleanup();
  
  // Also check database connectivity
  const dbStatus = await checkDatabase();
  
  if (ready && dbStatus.healthy) {
    res.json({
      ready: true,
      message: 'No legacy auth detected. Safe to proceed with cleanup.',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'healthy',
        legacy_auth: 'none detected',
      },
    });
  } else {
    res.status(503).json({
      ready: false,
      message: 'System not ready for cleanup.',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbStatus.healthy ? 'healthy' : 'unhealthy',
        legacy_auth: ready ? 'none detected' : 'still in use',
      },
      reason: !dbStatus.healthy ? 'Database connectivity issue' : 'Legacy auth still in use',
    });
  }
};

/**
 * GET /health/auth/simple
 * 
 * Minimal health check for load balancers (fast, no external calls)
 */
export const getAuthSimpleHealth = (req: Request, res: Response): void => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    auth: 'clerk',
  };
  
  res.json(health);
};

export default { getAuthHealth, getAuthReadyStatus, getAuthSimpleHealth, recordAuthError };
