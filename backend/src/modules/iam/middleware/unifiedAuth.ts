/**
 * Unified Authentication Middleware
 * 
 * Supports both legacy JWT and Clerk authentication during migration.
 * Uses feature flags for gradual rollout and safe rollback.
 * 
 * PRIORITY:
 * 1. If DUAL_AUTH_MODE: Try Clerk first, fall back to JWT
 * 2. If USE_CLERK_AUTH: Only Clerk
 * 3. Otherwise: Only JWT (legacy)
 * 
 * DATE: 2026-03-20
 */

import { Request, Response, NextFunction } from 'express';
import { clerkAuthenticate } from './clerkAuth';
import { authenticate as jwtAuthenticate } from './auth';
import { featureFlags, isDualAuthMode, isClerkAuthEnabled } from '../../../config/featureFlags';
import { logger } from '../../shared/utils/logger';

// ============================================================================
// UNIFIED AUTHENTICATION
// ============================================================================

/**
 * Unified authentication middleware
 * Supports both Clerk and JWT based on feature flags
 */
export const unifiedAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // If Clerk is fully enabled, use only Clerk
  if (isClerkAuthEnabled()) {
    logger.debug('Using Clerk authentication (full rollout)');
    return clerkAuthenticate(req, res, next);
  }

  // If dual auth mode, try Clerk first, then JWT
  if (isDualAuthMode()) {
    logger.debug('Using dual authentication mode');
    return tryClerkThenJwt(req, res, next);
  }

  // Otherwise, use legacy JWT only
  logger.debug('Using legacy JWT authentication');
  return jwtAuthenticate(req, res, next);
};

/**
 * Try Clerk authentication first, fall back to JWT
 */
const tryClerkThenJwt = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Check if request has Clerk token (Authorization: Bearer <token> with Clerk format)
  const authHeader = req.headers.authorization;
  const hasClerkToken = authHeader?.startsWith('Bearer ') && isLikelyClerkToken(authHeader);

  if (hasClerkToken) {
    // Try Clerk first
    let clerkSucceeded = false;
    
    await clerkAuthenticate(req, res, (err?: any) => {
      if (!err) {
        clerkSucceeded = true;
        logger.debug('Authenticated via Clerk');
      }
      next(err);
    });

    if (clerkSucceeded) {
      return;
    }

    // Clerk failed, try JWT
    logger.debug('Clerk auth failed, trying JWT fallback');
  }

  // Try JWT authentication
  jwtAuthenticate(req, res, next);
};

/**
 * Check if token is likely a Clerk token
 * Clerk JWTs have specific characteristics
 */
const isLikelyClerkToken = (authHeader: string): boolean => {
  const token = authHeader.replace('Bearer ', '');
  
  try {
    // Clerk tokens are JWTs with specific claims
    // Decode without verification to check structure
    const base64 = token.split('.')[1];
    if (!base64) return false;
    
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
    
    // Clerk tokens have 'sub' (subject) and specific issuers
    const clerkIssuers = ['clerk', 'clerk.dev', 'clerk.com'];
    const issuer = payload.iss || '';
    
    return clerkIssuers.some(i => issuer.includes(i)) || 
           payload.sub?.startsWith('user_');
  } catch {
    // If we can't decode, assume it's our legacy token
    return false;
  }
};

// ============================================================================
// OPTIONAL AUTH (FOR PUBLIC ROUTES THAT NEED USER CONTEXT)
// ============================================================================

/**
 * Unified optional authentication
 * Attaches user if available, but doesn't require auth
 */
export const unifiedOptionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Store original status
  const originalStatus = res.statusCode;

  // Try authentication but don't fail if it doesn't work
  await unifiedAuthenticate(req, res, (err?: any) => {
    // Reset status if auth failed
    if (err) {
      res.statusCode = originalStatus;
      (req as any).user = undefined;
    }
    next();
  });
};

// ============================================================================
// ADMIN AUTHENTICATION
// ============================================================================

/**
 * Require admin role with unified auth
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  await unifiedAuthenticate(req, res, (err?: any) => {
    if (err) return next(err);

    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const adminRoles = ['admin', 'super_admin'];
    if (!adminRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    next();
  });
};

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Check if user should be migrated to Clerk
 */
export const shouldMigrateToClerk = (userId: string): boolean => {
  return featureFlags.isClerkEnabledForUser(userId);
};

/**
 * Middleware to redirect migrated users to Clerk login
 */
export const redirectIfMigrated = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Only apply if dual auth mode is enabled
  if (!isDualAuthMode()) {
    return next();
  }

  // Check if this is a login request with email
  const { email } = req.body;
  if (!email) {
    return next();
  }

  // Check if user exists and has clerk_id
  try {
    const { findByEmail } = require('../repositories/UserRepository');
    const user = await findByEmail(email);

    if (user?.clerk_id) {
      // User has been migrated, suggest Clerk login
      logger.info('Redirecting migrated user to Clerk login', { email });
      res.status(409).json({
        error: 'User migrated to new auth system',
        code: 'MIGRATED_TO_CLERK',
        message: 'Please use the new login page',
        redirectUrl: '/login',
      });
      return;
    }

    next();
  } catch (error) {
    // If lookup fails, continue with legacy auth
    next();
  }
};
