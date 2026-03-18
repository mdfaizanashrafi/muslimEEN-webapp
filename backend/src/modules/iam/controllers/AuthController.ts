/**
 * Authentication Controller
 * Handles HTTP requests for identity and access management
 * 
 * SECURITY: Uses httpOnly cookies for token storage (XSS protection)
 */

import { Request, Response, NextFunction } from 'express';
import { env } from '../../../config/env';
import * as AuthService from '../services/AuthService';
import { AuthError } from '../services/AuthService';
import logger from '../../shared/utils/logger';
import { 
  recordFailedLogin, 
  recordSuccessfulLogin,
  accountLockoutService,
} from '../services/AccountLockoutService';
import { rotateCsrfToken } from '../../shared/middleware/csrf';

// Cookie configuration constants
const COOKIE_CONFIG = {
  ACCESS_TOKEN: 'access_token',
  CSRF_TOKEN: 'csrf_token',
};

/**
 * Set authentication cookies securely
 */
const setAuthCookies = (res: Response, token: string, csrfToken: string): void => {
  const isProduction = env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  };

  // Set access token in httpOnly cookie
  res.cookie(COOKIE_CONFIG.ACCESS_TOKEN, token, cookieOptions);
  
  // CSRF token is set by csrfTokenSetter middleware
  // We just update the local value here
  res.locals.csrfToken = csrfToken;
};

/**
 * Clear authentication cookies on logout
 */
const clearAuthCookies = (res: Response): void => {
  res.clearCookie(COOKIE_CONFIG.ACCESS_TOKEN, { path: '/' });
  res.clearCookie(COOKIE_CONFIG.CSRF_TOKEN, { path: '/' });
};

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
 * SECURITY: Tokens stored in httpOnly cookies (XSS protection)
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

    // Set httpOnly cookies for authentication
    setAuthCookies(res, result.token, result.csrfToken);
    
    // Rotate CSRF token after login for additional security
    rotateCsrfToken(req, res);

    logger.info(`User logged in: ${result.user.email}`, {
      userId: result.user.id,
      ip: req.ip,
    });

    // Return success WITHOUT token in body (it's in the cookie)
    res.json({
      success: true,
      message: 'Login successful',
      user: result.user,
      csrfToken: res.locals.csrfToken, // Client needs this for subsequent requests
    });
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
 * SECURITY: Tokens stored in httpOnly cookies (XSS protection)
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

    // Set httpOnly cookies for authentication
    setAuthCookies(res, result.token, result.csrfToken);
    
    // Rotate CSRF token after registration for additional security
    rotateCsrfToken(req, res);

    logger.info(`User registered: ${result.user.email}`, {
      userId: result.user.id,
      ip: req.ip,
    });

    // Return success WITHOUT token in body (it's in the cookie)
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: result.user,
      csrfToken: res.locals.csrfToken, // Client needs this for subsequent requests
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
 * Logout user
 * SECURITY: Clears httpOnly cookies
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

    // Clear authentication cookies
    clearAuthCookies(res);

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
 * Refresh access token
 * Used when token is about to expire
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    // Generate new token
    const result = await AuthService.refreshSession(userId);
    
    // Set new cookies
    setAuthCookies(res, result.token, result.csrfToken);
    rotateCsrfToken(req, res);

    logger.info(`Token refreshed for user: ${result.user.email}`, {
      userId: result.user.id,
    });

    res.json({
      success: true,
      message: 'Token refreshed',
      user: result.user,
      csrfToken: res.locals.csrfToken,
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
