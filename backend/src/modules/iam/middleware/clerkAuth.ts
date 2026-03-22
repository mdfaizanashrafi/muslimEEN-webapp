/**
 * Clerk Authentication Middleware - ELITE PRODUCTION GRADE
 * 
 * ENFORCEMENT RULES:
 * 1. Verify Clerk JWT signature
 * 2. Check internal DB user exists (clerk_id lookup)
 * 3. Check user is NOT blocked
 * 4. Reject with specific error codes
 * 
 * DATE: 2026-03-21
 */

import { Request, Response, NextFunction } from 'express';
import { requireAuth } from '@clerk/express';
import * as UserRepository from '../repositories/UserRepository';
import * as UserService from '../services/UserService';
import { User, UserRole } from '../../shared/types';
import { logger } from '../../shared/utils/logger';
import { recordMetric, Metrics } from '../../shared/utils/metrics';
import { setUserContext, clearUserContext } from '../../../config/sentry';

// ============================================================================
// USER MAPPER
// ============================================================================

const mapToRequestUser = (userIdentity: UserRepository.UserIdentity): User => ({
  id: userIdentity.id,
  email: userIdentity.email,
  firstName: userIdentity.firstName,
  lastName: userIdentity.lastName,
  fullName: userIdentity.fullName,
  role: userIdentity.role,
  verificationTier: userIdentity.verificationTier,
  trustScore: userIdentity.trustScore,
  isActive: userIdentity.isActive,
  invitesRemaining: userIdentity.invitesRemaining,
  createdAt: userIdentity.createdAt,
  lastLogin: userIdentity.lastLogin,
  // Optional fields
  bio: undefined,
  location: undefined,
  industry: undefined,
  skills: undefined,
  badges: undefined,
  endorsements: undefined,
  connections: undefined,
  profileViews: undefined,
  passwordHash: userIdentity.passwordHash,
});

// ============================================================================
// MAIN AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * clerkAuthenticate - ELITE VERSION
 * 
 * ENFORCEMENT:
 * 1. Verifies Clerk JWT
 * 2. Requires DB user record (invite-only enforcement)
 * 3. Checks user not blocked
 * 4. Logs all rejections for security monitoring
 */
export const clerkAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Step 1: Verify Clerk JWT
    requireAuth()(req, res, async (err?: any) => {
      if (err) {
        logger.debug('AUTH_JWT_INVALID', { 
          error: err.message,
          path: req.path,
          ip: req.ip,
        });
        
        await recordMetric(Metrics.AUTH_MIDDLEWARE_REJECT, 1, { reason: 'jwt_invalid' });
        
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const clerkUserId = (req as any).auth?.userId;

      if (!clerkUserId) {
        logger.warn('AUTH_NO_USER_ID', { path: req.path });
        await recordMetric(Metrics.AUTH_MIDDLEWARE_REJECT, 1, { reason: 'no_user_id' });
        
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
        return;
      }

      // Step 2: Check if user is blocked in Clerk
      const blockInfo = await UserService.getUserBlockInfo(clerkUserId);
      
      if (blockInfo.blocked) {
        logger.warn('AUTH_USER_BLOCKED', {
          clerkUserId,
          reason: blockInfo.reason,
          path: req.path,
        });
        
        await recordMetric(Metrics.AUTH_MIDDLEWARE_REJECT, 1, { reason: 'user_blocked' });
        
        res.status(403).json({
          success: false,
          error: {
            code: 'ACCOUNT_BLOCKED',
            message: 'Account access denied. Contact support.',
            reason: blockInfo.reason,
          },
        });
        return;
      }

      // Step 3: Find user in our database
      let userIdentity = await UserRepository.findByClerkId(clerkUserId);

      // If not found by clerk_id, try email fallback (migration support)
      if (!userIdentity && (req as any).auth?.sessionClaims?.email) {
        const email = (req as any).auth.sessionClaims.email;
        userIdentity = await UserRepository.findByEmail(email);
        
        if (userIdentity) {
          // Update clerk_id for future lookups
          await UserRepository.updateClerkId(userIdentity.id, clerkUserId);
          logger.info('AUTH_MIGRATED_USER', {
            userId: userIdentity.id,
            clerkUserId,
          });
        }
      }

      // Step 4: ENFORCE invite-only policy
      if (!userIdentity) {
        // User exists in Clerk but NOT in our database
        // This means they bypassed invite validation
        logger.error('AUTH_INVITE_REQUIRED', {
          clerkUserId,
          path: req.path,
          ip: req.ip,
          tags: { module: 'auth', type: 'security' },
        });
        
        await recordMetric(Metrics.AUTH_MIDDLEWARE_REJECT, 1, { reason: 'no_db_record' });
        
        res.status(403).json({
          success: false,
          error: {
            code: 'INVITE_REQUIRED',
            message: 'Access denied. Valid invite required. If you just signed up, please wait a moment.',
          },
        });
        return;
      }

      // Step 5: Check account status
      if (!userIdentity.isActive) {
        logger.warn('AUTH_ACCOUNT_INACTIVE', {
          userId: userIdentity.id,
          clerkUserId,
        });
        
        await recordMetric(Metrics.AUTH_MIDDLEWARE_REJECT, 1, { reason: 'account_inactive' });
        
        res.status(403).json({
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'Account has been disabled',
          },
        });
        return;
      }

      // SUCCESS: Attach user to request
      const user = mapToRequestUser(userIdentity);
      (req as any).user = user;
      
      // Set Sentry context
      setUserContext({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      
      // Log successful auth (debug level - high volume)
      logger.debug('AUTH_SUCCESS', {
        userId: userIdentity.id,
        clerkId: clerkUserId,
        path: req.path,
        method: req.method,
      });
      
      next();
    });
  } catch (error) {
    logger.error('AUTH_MIDDLEWARE_ERROR', {
      error: (error as Error).message,
      path: req.path,
    });
    next(error);
  }
};

// ============================================================================
// OPTIONAL AUTHENTICATION
// ============================================================================

/**
 * clerkOptionalAuth - Doesn't fail if no token
 * Used for endpoints that work for both authenticated and anonymous users
 */
export const clerkOptionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    requireAuth()(req, res, async (err?: any) => {
      if (err || !(req as any).auth?.userId) {
        return next();
      }

      const clerkUserId = (req as any).auth.userId;
      
      // Check block status
      const blockInfo = await UserService.getUserBlockInfo(clerkUserId);
      if (blockInfo.blocked) {
        // Don't attach user if blocked, but don't fail request
        return next();
      }
      
      // Try to find user
      let userIdentity = await UserRepository.findByClerkId(clerkUserId);
      
      if (!userIdentity && (req as any).auth?.sessionClaims?.email) {
        const email = (req as any).auth.sessionClaims.email;
        userIdentity = await UserRepository.findByEmail(email);
        
        if (userIdentity) {
          await UserRepository.updateClerkId(userIdentity.id, clerkUserId);
        }
      }

      if (userIdentity && userIdentity.isActive) {
        (req as any).user = mapToRequestUser(userIdentity);
      }
      
      next();
    });
  } catch {
    next();
  }
};

// ============================================================================
// ROLE-BASED AUTHORIZATION
// ============================================================================

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    if (!roles.includes(user.role)) {
      logger.warn('AUTH_ROLE_REJECTED', {
        userId: user.id,
        requiredRoles: roles,
        userRole: user.role,
        path: req.path,
      });
      
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
      return;
    }

    next();
  };
};

// ============================================================================
// ADMIN AUTHORIZATION
// ============================================================================

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;
  
  if (!user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  if (user.role !== 'admin' && user.role !== 'super_admin') {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
    return;
  }

  next();
};

// ============================================================================
// EXPORTS
// ============================================================================

export const authenticate = clerkAuthenticate;
export { clerkOptionalAuth as optionalAuth };
export default clerkAuthenticate;
