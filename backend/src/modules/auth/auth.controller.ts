/**
 * Authentication Controller
 * Handles login, logout, and invitation validation
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.types';
import * as authService from './auth.service';

// Import models and utilities (will be injected or imported from shared)
const User = require('../../models/User');
const Invitation = require('../../models/Invitation');
const TrustScore = require('../../models/TrustScore');
const { generateToken } = require('../../middleware/auth');
const logger = require('../../utils/logger');

/**
 * Validate invitation code
 * POST /api/auth/validate-invitation
 */
export const validateInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.validateInvitation(
      req.body,
      Invitation
    );

    res.json({
      success: result.valid,
      message: result.message,
      ...(result.invitation && { data: { invitation: result.invitation } })
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.login(
      req.body,
      User,
      generateToken,
      logger
    );

    if (!result) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
      return;
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Register user
 * POST /api/auth/register
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.register(
      req.body,
      User,
      Invitation,
      TrustScore,
      generateToken,
      logger
    );

    if ('error' in result) {
      if (result.error.code === 'INVALID_INVITATION' || result.error.code === 'EMAIL_MISMATCH') {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }
      if (result.error.code === 'USER_EXISTS') {
        res.status(409).json({
          success: false,
          error: result.error
        });
        return;
      }
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.logout(
      req.user?.email,
      logger
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.getCurrentUser(
      req.user!.id,
      User
    );

    if (!result) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      user: result.user
    });
  } catch (error) {
    next(error);
  }
};
