/**
 * Legacy Auth Detection Middleware
 * 
 * CRITICAL: This middleware detects and logs any legacy auth usage
 * to ensure all clients have migrated before cleanup.
 * 
 * PHASE: Pre-cleanup detection (run for 7-14 days)
 * DATE: 2026-03-20
 * 
 * MONITORING:
 * - Logs all JWT token usage attempts (SAMPLED - 10%)
 * - Logs CSRF header usage (SAMPLED - 10%)
 * - Logs legacy cookie usage (SAMPLED - 10%)
 * - Sends events to Sentry for alerting (ALL events)
 * 
 * OPTIMIZATIONS:
 * - Sampling: Only 10% of events are logged to reduce noise
 * - Throttling: Max 5 logs per minute per endpoint/IP
 * - Structured tags: module: auth, type: legacy-detection
 * 
 * DEPRECATION: Remove after 14 days of zero detections
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../../shared/utils/logger';
import * as Sentry from '@sentry/node';
import { recordAuthError } from '../controllers/AuthHealthController';
import { legacyAuthLog, criticalLog } from '../../shared/utils/logSampler';

// Detection statistics (in-memory, resets on deploy)
interface DetectionStats {
  jwtAttempts: number;
  csrfAttempts: number;
  legacyCookieAttempts: number;
  lastDetection: Date | null;
  uniqueEndpoints: Set<string>;
  uniqueIps: Set<string>;
}

const detectionStats: DetectionStats = {
  jwtAttempts: 0,
  csrfAttempts: 0,
  legacyCookieAttempts: 0,
  lastDetection: null,
  uniqueEndpoints: new Set<string>(),
  uniqueIps: new Set<string>(),
};

/**
 * Check if token is a legacy JWT (not Clerk)
 * Legacy JWTs have different structure/claims
 */
const isLegacyJWT = (token: string): boolean => {
  try {
    // Try to decode without verification
    const base64 = token.split('.')[1];
    if (!base64) return false;
    
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
    
    // Legacy JWTs have 'id' claim, Clerk has 'sub' starting with 'user_'
    const hasLegacyId = payload.id && !payload.sub?.startsWith('user_');
    
    // Legacy JWTs don't have Clerk-specific claims
    const lacksClerkClaims = !payload.clerk_metadata && 
                             !payload.iss?.includes('clerk');
    
    return hasLegacyId || lacksClerkClaims;
  } catch {
    return false;
  }
};

/**
 * Log detection event with sampling and structured tags
 */
const logDetection = (
  type: 'jwt' | 'csrf' | 'cookie',
  req: Request,
  details?: Record<string, any>
): void => {
  const endpoint = `${req.method} ${req.path}`;
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Update stats (always tracked, not sampled)
  detectionStats.uniqueEndpoints.add(endpoint);
  detectionStats.uniqueIps.add(clientIp);
  detectionStats.lastDetection = new Date();
  
  if (type === 'jwt') detectionStats.jwtAttempts++;
  if (type === 'csrf') detectionStats.csrfAttempts++;
  if (type === 'cookie') detectionStats.legacyCookieAttempts++;
  
  // Record for health monitoring (always tracked)
  recordAuthError(
    `Legacy ${type} auth detected on ${endpoint}`,
    `legacy_${type}_detected`
  );
  
  // Sampled logging with structured tags
  legacyAuthLog(type, {
    endpoint,
    clientIp,
    userAgent: userAgent.substring(0, 100),
    ...details,
  });
  
  // Sentry: Always send for alerting (not sampled - security critical)
  Sentry.captureMessage(`Legacy ${type} auth detected`, {
    level: 'warning',
    tags: {
      module: 'auth',
      type: 'legacy-detection',
      legacy_auth_type: type,
      endpoint: req.path,
    },
    extra: {
      endpoint,
      clientIp,
      userAgent,
      ...details,
    },
  });
  
  // Add breadcrumb for request context
  Sentry.addBreadcrumb({
    category: 'legacy_auth',
    message: `Legacy ${type} detected on ${endpoint}`,
    level: 'warning',
    data: {
      clientIp,
      userAgent: userAgent.substring(0, 100),
    },
  });
};

/**
 * Legacy Auth Detection Middleware
 * 
 * Install this BEFORE Clerk middleware to detect legacy tokens
 * Does NOT block requests - just logs for monitoring
 */
export const legacyAuthDetection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Check for legacy JWT in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    if (isLegacyJWT(token)) {
      logDetection('jwt', req, {
        tokenPreview: token.substring(0, 20) + '...',
      });
    }
  }
  
  // Check for CSRF headers (legacy system used these)
  const csrfHeader = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
  if (csrfHeader) {
    logDetection('csrf', req, {
      headerValue: typeof csrfHeader === 'string' ? csrfHeader.substring(0, 10) + '...' : 'present',
    });
  }
  
  // Check for legacy auth cookies
  const legacyCookies = ['access_token', 'refresh_token', 'auth_token'];
  for (const cookieName of legacyCookies) {
    if (req.cookies?.[cookieName]) {
      logDetection('cookie', req, {
        cookieName,
        cookiePreview: req.cookies[cookieName].substring(0, 20) + '...',
      });
    }
  }
  
  next();
};

/**
 * Get detection statistics
 * Useful for monitoring dashboards
 */
export const getDetectionStats = (): Record<string, any> => {
  return {
    ...detectionStats,
    uniqueEndpoints: Array.from(detectionStats.uniqueEndpoints),
    uniqueIps: Array.from(detectionStats.uniqueIps),
    uptime: process.uptime(),
  };
};

/**
 * Reset detection statistics
 * Call when starting a new monitoring period
 */
export const resetDetectionStats = (): void => {
  detectionStats.jwtAttempts = 0;
  detectionStats.csrfAttempts = 0;
  detectionStats.legacyCookieAttempts = 0;
  detectionStats.lastDetection = null;
  detectionStats.uniqueEndpoints.clear();
  detectionStats.uniqueIps.clear();
  
  logger.info('Legacy auth detection stats reset', {
    tags: { module: 'auth', type: 'system' }
  });
};

/**
 * Check if system is ready for cleanup
 * Returns true if no detections in the specified period
 */
export const isReadyForCleanup = (hoursWithoutDetection: number = 168): boolean => {
  // 168 hours = 7 days
  
  const totalAttempts = detectionStats.jwtAttempts + 
                        detectionStats.csrfAttempts + 
                        detectionStats.legacyCookieAttempts;
  
  if (totalAttempts === 0) {
    return true;
  }
  
  if (!detectionStats.lastDetection) {
    return true;
  }
  
  const hoursSinceLastDetection = 
    (Date.now() - detectionStats.lastDetection.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceLastDetection >= hoursWithoutDetection;
};

/**
 * Express endpoint to expose detection stats
 * Mount at /admin/legacy-auth-stats (protected route)
 */
export const legacyAuthStatsEndpoint = (req: Request, res: Response): void => {
  const stats = getDetectionStats();
  const ready = isReadyForCleanup();
  
  res.json({
    success: true,
    data: {
      stats,
      readyForCleanup: ready,
      message: ready 
        ? 'No legacy auth detected. Safe to proceed with cleanup.'
        : 'Legacy auth still in use. DO NOT proceed with cleanup.',
    },
  });
};

export default legacyAuthDetection;
