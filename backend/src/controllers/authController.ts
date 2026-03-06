/**
 * Authentication Controller
 * Thin HTTP handler - delegates all logic to AuthService
 * Responsibilities: HTTP request/response only
 */

import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../services/AuthService';
import logger from '../utils/logger';
import { AuthError } from '../services/AuthService';

// ============================================================================
// VALIDATE INVITATION
// ============================================================================

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
      ...(result.invitation && { data: { invitation: result.invitation } }),
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// LOGIN
// ============================================================================

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await AuthService.login({ email, password });

    logger.info(`User logged in: ${result.user.email}`);

    res.json(AuthService.formatLoginResponse(result));
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

// ============================================================================
// REGISTER
// ============================================================================

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
      invitationCode,
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

// ============================================================================
// LOGOUT
// ============================================================================

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

// ============================================================================
// GET CURRENT USER
// ============================================================================

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
