/**
 * Authentication Controller
 * Handles HTTP requests for identity and access management
 * 
 * SIMPLIFIED: Clerk handles authentication.
 * This controller now only provides:
 * - Invitation validation (public, pre-signup)
 * - Logout (for audit logging)
 * - Current user lookup
 * 
 * NOTE: Legacy login/register/refresh removed - using Clerk exclusively
 * DATE: 2026-03-20
 */

import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../services/AuthService';
import { AuthError } from '../services/AuthService';
import logger from '../../shared/utils/logger';

/**
 * Validate invitation code
 * PUBLIC ENDPOINT: Must remain accessible without authentication
 * This is called during signup flow BEFORE user is authenticated
 */
export const validateInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { invitationCode } = req.body;
    
    // Debug logging to help diagnose issues
    logger.debug('validateInvitation called', {
      path: req.path,
      hasAuthHeader: !!req.headers.authorization,
      invitationCode: invitationCode ? `${invitationCode.substring(0, 4)}...` : 'missing',
    });

    const result = await AuthService.validateInvitation(invitationCode);

    logger.debug('validateInvitation result', {
      valid: result.valid,
      hasJwt: !!result.jwt,
    });

    res.json({
      success: result.valid,
      error: result.error,
      ...(result.jwt && { jwt: result.jwt }),
    });
  } catch (error) {
    logger.error('validateInvitation error', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    next(error);
  }
};

/**
 * DEPRECATED: Login is handled by Clerk
 * Returns 501 to indicate client should use Clerk
 */
export const login = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  res.status(501).json({
    success: false,
    error: {
      code: 'AUTH_METHOD_DEPRECATED',
      message: 'Direct login is no longer supported. Use Clerk authentication.',
      documentation: 'https://clerk.com/docs',
    },
  });
};

/**
 * DEPRECATED: Registration is handled by Clerk
 * Returns 501 to indicate client should use Clerk
 */
export const register = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  res.status(501).json({
    success: false,
    error: {
      code: 'AUTH_METHOD_DEPRECATED',
      message: 'Direct registration is no longer supported. Use Clerk SignUp.',
      documentation: 'https://clerk.com/docs',
    },
  });
};

/**
 * Logout user
 * Note: Clerk handles actual token revocation; this is for audit logging
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (userId) {
      await AuthService.logout(userId);
      logger.info(`User logged out: ${req.user?.email || 'unknown'}`, {
        userId,
        ip: req.ip,
      });
    }

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const user = await AuthService.getCurrentUser(userId);

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }
    next(error);
  }
};

/**
 * DEPRECATED: Token refresh is handled by Clerk
 * Returns 501 to indicate Clerk handles this automatically
 */
export const refreshToken = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  res.status(501).json({
    success: false,
    error: {
      code: 'AUTH_METHOD_DEPRECATED',
      message: 'Token refresh is handled automatically by Clerk.',
      documentation: 'https://clerk.com/docs',
    },
  });
};
