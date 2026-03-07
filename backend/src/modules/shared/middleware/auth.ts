/**
 * Authentication Middleware
 * JWT verification and authorization
 * Note: Token generation moved to JwtService
 */

import { Request, Response, NextFunction } from 'express';
import * as UserRepository from '../../iam/repositories/UserRepository';
import { User, UserRole } from '../../../types/index';
import { verifyToken } from '../../iam/services/JwtService';

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
  isWitnessEligible: userIdentity.isWitnessEligible,
  isActive: userIdentity.isActive,
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
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const token = authHeader.substring(7);
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

    req.user = mapToRequestUser(userIdentity);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
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
    next();
  }
};

/**
 * Authorization middleware - check user roles
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
