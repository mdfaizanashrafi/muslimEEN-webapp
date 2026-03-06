/**
 * Profile Controller
 * Handles HTTP requests for user profile management
 */

import { Request, Response, NextFunction } from 'express';
import * as ProfileService from '../services/ProfileService';
import { ProfileError } from '../services/ProfileService';

/**
 * Get current user's profile
 */
export const getCurrentUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const profile = await ProfileService.getProfile(userId);

    res.json(ProfileService.formatProfileResponse(profile));
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user's profile
 */
export const updateCurrentUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const profileUpdates = req.body;

    const updatedProfile = await ProfileService.updateProfile(userId, profileUpdates);

    res.json({
      success: true,
      profile: updatedProfile,
      message: 'Profile updated',
    });
  } catch (error) {
    if (error instanceof ProfileError) {
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
 * Get user's public profile
 */
export const getPublicProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const profile = await ProfileService.getPublicProfile(userId);

    if (!profile) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Profile not found' },
      });
      return;
    }

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
};
