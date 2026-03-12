/**
 * Authentication Controller
 * Handles HTTP requests for identity and access management
 */

import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../services/AuthService';
import { AuthError } from '../services/AuthService';
import logger from '../../shared/utils/logger';
import { 
  recordFailedLogin, 
  recordSuccessfulLogin,
  accountLockoutService,
} from '../services/AccountLockoutService';

/**
 * Validate invitation code
 */
export const validateInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { invitationCode } = req.body;
    const result = await AuthService.validateInvitation(invitationCode);

    res.json({
      success: result.valid,
      message: result.message,
      ...(result.invite && { data: { invitation: result.invite } }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticate user and issue tokens
 * SECURITY: Account lockout protects against brute force attacks
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, password } = req.body;

  try {
    // Check if account is locked BEFORE attempting authentication
    if (accountLockoutService.isLocked(email)) {
      const status = accountLockoutService.getLockoutStatus(email);
      
      if (status.lockedUntil) {
        const remainingMinutes = Math.ceil(
          (status.lockedUntil.getTime() - Date.now()) / 60000
        );
        
        res.status(423).json({
          success: false,
          error: {
            code: 'ACCOUNT_LOCKED',
            message: `Account is temporarily locked due to too many failed attempts. Please try again in ${remainingMinutes} minute(s).`,
            lockedUntil: status.lockedUntil.toISOString(),
            remainingMinutes,
          },
        });
        return;
      }
    }

    const result = await AuthService.login({ email, password });

    // Record successful login - clears failed attempts
    recordSuccessfulLogin(email);

    logger.info(`User logged in: ${result.user.email}`);

    res.json(AuthService.formatLoginResponse(result));
  } catch (error) {
    if (error instanceof AuthError) {
      // Record failed attempt for authentication errors
      if (error.code === 'INVALID_CREDENTIALS' || error.code === 'USER_NOT_FOUND') {
        const lockoutStatus = recordFailedLogin(email);
        
        // If account is now locked, return lockout response
        if (lockoutStatus.isLocked && lockoutStatus.lockedUntil) {
          const remainingMinutes = Math.ceil(
            (lockoutStatus.lockedUntil.getTime() - Date.now()) / 60000
          );
          
          res.status(423).json({
            success: false,
            error: {
              code: 'ACCOUNT_LOCKED',
              message: `Account is temporarily locked due to too many failed attempts. Please try again in ${remainingMinutes} minute(s).`,
              lockedUntil: lockoutStatus.lockedUntil.toISOString(),
              remainingMinutes,
            },
          });
          return;
        }
        
        // Include remaining attempts in error response
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            meta: {
              remainingAttempts: lockoutStatus.remainingAttempts,
            },
          },
        });
        return;
      }

      // Other auth errors (not brute-force related)
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
 * Register new user
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, firstName, lastName, invitationCode } = req.body;

    const result = await AuthService.register({
      email,
      password,
      firstName,
      lastName,
      inviteToken: invitationCode,
    });

    logger.info(`User registered: ${result.user.email}`);

    res.status(201).json(AuthService.formatRegisterResponse(result));
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
 * Logout user
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
      logger.info(`User logged out: ${req.user?.email || 'unknown'}`);
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
      user,
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
