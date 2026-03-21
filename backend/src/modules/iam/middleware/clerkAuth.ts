/**
 * Clerk Authentication Middleware
 * 
 * Replaces JWT-based authentication with Clerk token verification.
 * 
 * MIGRATED: From custom JWT to Clerk JWT verification
 * DATE: 2026-03-20
 */

import { Request, Response, NextFunction } from 'express';
import { requireAuth } from '@clerk/express';
import * as UserRepository from '../repositories/UserRepository';
import { User, UserRole } from '../../shared/types';
import { logger } from '../../shared/utils/logger';
import { setUserContext, clearUserContext } from '../../../config/sentry';

/**
 * Map UserIdentity from repository to User type for request
 */
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

/**
 * Clerk Authentication Middleware
 * Verifies Clerk JWT and attaches user to request
 * 
 * Usage: app.use(clerkAuthenticate) or router.get('/path', clerkAuthenticate, handler)
 */
export const clerkAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Use Clerk's Express middleware to verify the token
    requireAuth()(req, res, async (err?: any) => {
      if (err) {
        // Token verification failed
        logger.debug('Clerk authentication failed', { 
          error: err.message,
          path: req.path 
        });
        
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      // Token is valid, get the Clerk user ID
      const clerkUserId = (req as any).auth?.userId;

      if (!clerkUserId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
        return;
      }

      // Find user in our database by clerk_id
      // NOTE: This requires adding a clerk_id column to users table
      // For now, we'll look up by email as a fallback
      let userIdentity = await UserRepository.findByClerkId(clerkUserId);

      // If not found by clerk_id, try to find by email from Clerk session
      // This handles the migration period where existing users may not have clerk_id set
      if (!userIdentity && (req as any).auth?.sessionClaims?.email) {
        const email = (req as any).auth.sessionClaims.email;
        userIdentity = await UserRepository.findByEmail(email);
        
        // If found by email, update the clerk_id for future lookups
        if (userIdentity) {
          await UserRepository.updateClerkId(userIdentity.id, clerkUserId);
          logger.info(`Updated clerk_id for user ${userIdentity.id}`, { clerkUserId });
        }
      }

      if (!userIdentity) {
        // User authenticated with Clerk but not in our database
        // This could be a new user that needs to be created
        logger.warn('Authenticated user not found in database', { clerkUserId });
        
        res.status(403).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User account not found. Please complete registration.',
          },
        });
        return;
      }

      if (!userIdentity.isActive) {
        res.status(403).json({
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'Account has been disabled',
          },
        });
        return;
      }

      // Map to request user and attach
      const user = mapToRequestUser(userIdentity);
      (req as any).user = user;
      
      // Set Sentry user context for error tracking
      setUserContext({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      
      // Log authentication for security monitoring
      logger.debug('User authenticated via Clerk', {
        userId: userIdentity.id,
        clerkId: clerkUserId,
        path: req.path,
        method: req.method,
      });
      
      next();
    });
  } catch (error) {
    logger.error('Clerk authentication error', {
      error: (error as Error).message,
      path: req.path,
    });
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Used for endpoints that work for both authenticated and anonymous users
 */
export const clerkOptionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Try to get the auth header
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      // No token, continue without user
      return next();
    }

    // Use Clerk's middleware
    requireAuth()(req, res, async (err?: any) => {
      if (err || !(req as any).auth?.userId) {
        // Invalid token, continue without user
        return next();
      }

      const clerkUserId = (req as any).auth.userId;
      
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
    // Continue without user on error
    next();
  }
};

/**
 * Role-based authorization middleware
 * Must be used AFTER clerkAuthenticate middleware
 * 
 * @param roles - Allowed roles for this route
 * @returns Middleware function
 * 
 * @example
 * router.post('/admin', clerkAuthenticate, requireRole('admin', 'super_admin'), handler);
 */
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
      logger.warn('Role authorization failed', {
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

/**
 * Admin authorization middleware
 * Convenience middleware for admin-only routes
 * 
 * @example
 * router.get('/admin/stats', clerkAuthenticate, requireAdmin, handler);
 */
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

/**
 * Staff authorization middleware
 * For routes that require staff or higher privileges
 * Includes: admin, super_admin
 * 
 * @example
 * router.post('/moderate', clerkAuthenticate, requireStaff, handler);
 */
export const requireStaff = (req: Request, res: Response, next: NextFunction): void => {
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

  const allowedRoles: UserRole[] = ['admin', 'super_admin'];
  
  if (!allowedRoles.includes(user.role)) {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Staff access required',
      },
    });
    return;
  }

  next();
};

// Export compatibility alias for old middleware name
export const authenticate = clerkAuthenticate;
export { clerkOptionalAuth as optionalAuth };

export default clerkAuthenticate;
