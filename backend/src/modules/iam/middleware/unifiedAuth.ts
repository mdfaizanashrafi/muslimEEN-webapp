/**
 * Unified Authentication Middleware
 * 
 * SIMPLIFIED: Clerk is now the only authentication method.
 * All legacy JWT authentication has been removed.
 * 
 * DATE: 2026-03-20
 */

import { Request, Response, NextFunction } from 'express';
import { clerkAuthenticate } from './clerkAuth';

/**
 * Unified authentication middleware
 * Now uses Clerk exclusively - all legacy auth removed
 */
export const unifiedAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Use Clerk authentication exclusively
  return clerkAuthenticate(req, res, next);
};

/**
 * Optional authentication - doesn't fail if no token
 * Used for endpoints that work for both authenticated and anonymous users
 */
export const unifiedOptionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Try Clerk optional auth
  const { clerkOptionalAuth } = await import('./clerkAuth');
  return clerkOptionalAuth(req, res, next);
};

/**
 * Require admin role with Clerk auth
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  await clerkAuthenticate(req, res, (err?: any) => {
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
