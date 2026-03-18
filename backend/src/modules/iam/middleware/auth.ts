/**
 * Authentication Middleware
 * JWT verification and authorization
 * 
 * MOVED FROM: modules/shared/middleware/auth.ts
 * REASON: Eliminate circular dependency (shared should not import from iam)
 * 
 * SECURITY: Supports both httpOnly cookies and Authorization header
 * Cookie-based auth is preferred (XSS protection)
 */

import { Request, Response, NextFunction } from 'express';
import * as UserRepository from '../repositories/UserRepository';
import { User, UserRole } from '../../shared/types';
import { verifyToken } from '../services/JwtService';
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
  // Optional fields not in UserIdentity
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
 * Extract token from request
 * Priority: 1. httpOnly cookie, 2. Authorization header
 * SECURITY: Cookie-based auth prevents XSS token theft
 */
const extractToken = (req: Request): string | null => {
  // First, try to get token from httpOnly cookie (preferred, XSS-safe)
  const cookieToken = req.cookies?.access_token;
  if (cookieToken) {
    return cookieToken;
  }

  // Fallback to Authorization header (for API clients, mobile apps)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
};

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 * 
 * SECURITY: Token can be in httpOnly cookie OR Authorization header
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
      return;
    }

    // Get fresh user data from repository
    const userIdentity = await UserRepository.findById(decoded.id);

    if (!userIdentity) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
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

    const user = mapToRequestUser(userIdentity);
    req.user = user;
    
    // Set Sentry user context for error tracking
    setUserContext({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    
    // Log authentication for security monitoring
    logger.debug('User authenticated', {
      userId: userIdentity.id,
      path: req.path,
      method: req.method,
      authMethod: req.cookies?.access_token ? 'cookie' : 'header',
    });
    
    next();
  } catch (error) {
    logger.error('Authentication error', {
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
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = verifyToken(token);

      if (decoded) {
        const userIdentity = await UserRepository.findById(decoded.id);
        if (userIdentity && userIdentity.isActive) {
          req.user = mapToRequestUser(userIdentity);
        }
      }
    }

    next();
  } catch {
    // Continue without user on error
    next();
  }
};

/**
 * Authorization middleware - check user roles
 * Must be used AFTER authenticate middleware
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
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
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
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
