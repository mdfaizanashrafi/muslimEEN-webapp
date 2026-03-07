/**
 * Profile Controller
 * HTTP request handling for user profile operations
 * Responsibilities: Extract HTTP data, delegate to UserService, format responses
 */

import { Request, Response, NextFunction } from 'express';
import * as UserService from '../services/UserService';
import logger from '../utils/logger';

// ============================================================================
// PROFILE
// ============================================================================

/**
 * Retrieve current user's complete profile
 * GET /user/profile
 */
export const retrieveCurrentUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authenticatedUserId = req.user!.id;
    const userProfile = await UserService.getProfile(authenticatedUserId);

    res.json(UserService.formatProfileResponse(userProfile));
  } catch (error) {
    next(error);
  }
};

/**
 * Modify current user's profile information
 * PUT /user/profile
 */
export const modifyCurrentUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authenticatedUserId = req.user!.id;
    const profileUpdateData = req.body;

    const updatedUserProfile = await UserService.updateProfile(authenticatedUserId, profileUpdateData);

    res.json({
      success: true,
      user: updatedUserProfile,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
