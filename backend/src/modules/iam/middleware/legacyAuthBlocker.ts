/**
 * Legacy Auth Blocker Middleware
 * 
 * CRITICAL: Blocks all legacy authentication attempts.
 * Only active when DISABLE_LEGACY_AUTH feature flag is true.
 * 
 * PHASE: Phase 2 - Safe Disable (after detection period)
 * DATE: 2026-03-20
 * 
 * SAFETY: This middleware should ONLY be enabled after:
 * 1. Full migration to Clerk confirmed
 * 2. 7-14 days of detection showing zero legacy usage
 * 3. Team approval
 * 
 * DO NOT ENABLE without explicit approval
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../../shared/utils/logger';
import * as Sentry from '@sentry/node';
import { criticalLog } from '../../shared/utils/logSampler';

/**
 * Check if token is a legacy JWT (not Clerk)
 */
const isLegacyJWT = (token: string): boolean => {
  try {
    const base64 = token.split('.')[1];
    if (!base64) return false;
    
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
    
    // Legacy JWTs have 'id' claim, Clerk has 'sub' starting with 'user_'
    const hasLegacyId = payload.id && !payload.sub?.startsWith('user_');
    const lacksClerkClaims = !payload.clerk_metadata && 
                             !payload.iss?.includes('clerk');
    
    return hasLegacyId || lacksClerkClaims;
  } catch {
    return false;
  }
};

/**
 * Legacy Auth Blocker Middleware
 * 
 * BLOCKS all legacy auth attempts with 401/403
 * Logs all blocked attempts for monitoring
 */
export const legacyAuthBlocker = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const endpoint = `${req.method} ${req.path}`;
  
  // Check for legacy JWT in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    if (isLegacyJWT(token)) {
      const logData = {
        type: 'LEGACY_JWT_BLOCKED',
        endpoint,
        clientIp,
        timestamp: new Date().toISOString(),
      };
      
      criticalLog('error', 'Legacy JWT blocked', 'legacy_auth_blocked', logData);
      
      Sentry.captureMessage('Legacy JWT blocked', {
        level: 'error',
        tags: { blocked_auth_type: 'jwt' },
        extra: logData,
      });
      
      res.status(401).json({
        success: false,
        error: {
          code: 'LEGACY_AUTH_DISABLED',
          message: 'Legacy authentication has been disabled. Please use Clerk authentication.',
          documentation: 'https://docs.muslimeen.org/auth/migration',
          support: 'support@muslimeen.org',
        },
      });
      return;
    }
  }
  
  // Check for CSRF headers (legacy system)
  const csrfHeader = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
  if (csrfHeader) {
    const logData = {
      type: 'LEGACY_CSRF_BLOCKED',
      endpoint,
      clientIp,
      timestamp: new Date().toISOString(),
    };
    
      criticalLog('error', 'Legacy CSRF header blocked', 'legacy_auth_blocked', logData);
    
    Sentry.captureMessage('Legacy CSRF blocked', {
      level: 'error',
      tags: { blocked_auth_type: 'csrf' },
      extra: logData,
    });
    
    res.status(403).json({
      success: false,
      error: {
        code: 'LEGACY_AUTH_DISABLED',
        message: 'CSRF tokens are no longer required. Clerk handles security automatically.',
        documentation: 'https://docs.muslimeen.org/auth/migration',
      },
    });
    return;
  }
  
  // Check for legacy auth cookies
  const legacyCookies = ['access_token', 'refresh_token', 'auth_token'];
  for (const cookieName of legacyCookies) {
    if (req.cookies?.[cookieName]) {
      const logData = {
        type: 'LEGACY_COOKIE_BLOCKED',
        endpoint,
        clientIp,
        cookieName,
        timestamp: new Date().toISOString(),
      };
      
      criticalLog('error', 'Legacy auth cookie blocked', 'legacy_auth_blocked', logData);
      
      Sentry.captureMessage('Legacy cookie blocked', {
        level: 'error',
        tags: { blocked_auth_type: 'cookie' },
        extra: logData,
      });
      
      // Clear the legacy cookie
      res.clearCookie(cookieName);
      
      res.status(401).json({
        success: false,
        error: {
          code: 'LEGACY_AUTH_DISABLED',
          message: 'Legacy session expired. Please login with Clerk.',
          documentation: 'https://docs.muslimeen.org/auth/migration',
        },
      });
      return;
    }
  }
  
  // All checks passed - continue
  next();
};

/**
 * Middleware factory that conditionally applies blocker based on feature flag
 */
export const conditionalLegacyAuthBlocker = (
  enabled: boolean
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!enabled) {
      return next();
    }
    legacyAuthBlocker(req, res, next).catch(next);
  };
};

export default legacyAuthBlocker;
