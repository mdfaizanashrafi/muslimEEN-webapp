/**
 * Profile Controller
 * HTTP request handling for user profiles
 * Responsibilities: Extract HTTP data, delegate to service, format response
 */

import { Request, Response, NextFunction } from 'express';
import { ProfileService } from './profileService';
import { ProfileError } from './profileTypes';

/**
 * Get current user's profile
 * GET /user/profile
 */
export const getCurrentUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    const profile = await ProfileService.getProfileByUserId(userId);
    
    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user's profile
 * PUT /user/profile
 */
export const updateCurrentUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const updates = req.body;
    
    const updatedProfile = await ProfileService.updateProfile(userId, updates);
    
    res.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully',
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
 * Get public profile for any user
 * GET /users/:userId/profile
 */
export const getPublicProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    
    const profile = await ProfileService.getPublicProfile(userId);
    
    if (!profile) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Profile not found',
        },
      });
      return;
    }
    
    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};
