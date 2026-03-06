/**
 * User Service
 * Orchestrates user-related business logic
 * Coordinates between User repository and other services
 */

import User from '../models/User';
import { User as UserType, UserUpdateInput } from '../types';
import { ProfileResponse } from '../types/api';

// ============================================================================
// PROFILE MANAGEMENT
// ============================================================================

/**
 * Get user profile by ID
 * @param userId User ID
 * @returns User profile
 * @throws Error if user not found
 */
export const getProfile = async (userId: string): Promise<UserType> => {
  const user = await User.getFullProfile(userId);
  if (!user) {
    throw new UserServiceError('USER_NOT_FOUND', 'User not found', 404);
  }
  return user;
};

/**
 * Update user profile
 * Note: Does NOT trigger trust score recalculation
 * Trust score should be recalculated explicitly when needed
 * @param userId User ID
 * @param updates Profile updates
 * @returns Updated user
 */
export const updateProfile = async (
  userId: string, 
  updates: UserUpdateInput
): Promise<UserType> => {
  // Validate allowed fields
  const allowedFields = [
    'firstName', 'lastName', 'bio', 'location', 'industry', 'skills'
  ];

  const sanitizedUpdates: Partial<UserUpdateInput> = {};
  for (const key of allowedFields) {
    if (key in updates) {
      (sanitizedUpdates as Record<string, unknown>)[key] = (updates as Record<string, unknown>)[key];
    }
  }

  const user = await User.update(userId, sanitizedUpdates);
  if (!user) {
    throw new UserServiceError('UPDATE_FAILED', 'Failed to update profile', 500);
  }

  return user;
};

// ============================================================================
// USER STATUS MANAGEMENT
// ============================================================================

/**
 * Update user's last login timestamp
 * Fire-and-forget operation - failures are logged but not thrown
 * @param userId User ID
 */
export const updateLastLogin = async (userId: string): Promise<void> => {
  try {
    await User.update(userId, { lastLogin: new Date() });
  } catch (error) {
    // Log error but don't throw - this is non-critical
    console.error('Failed to update last login:', error);
  }
};

/**
 * Deactivate user account
 * @param userId User ID
 * @returns Updated user
 */
export const deactivateAccount = async (userId: string): Promise<UserType> => {
  const user = await User.update(userId, { isActive: false });
  if (!user) {
    throw new UserServiceError('UPDATE_FAILED', 'Failed to deactivate account', 500);
  }
  return user;
};

/**
 * Reactivate user account
 * @param userId User ID
 * @returns Updated user
 */
export const reactivateAccount = async (userId: string): Promise<UserType> => {
  const user = await User.update(userId, { isActive: true });
  if (!user) {
    throw new UserServiceError('UPDATE_FAILED', 'Failed to reactivate account', 500);
  }
  return user;
};

// ============================================================================
// USER STATS
// ============================================================================

/**
 * Get user statistics
 * @param userId User ID
 * @returns User stats
 */
export const getUserStats = async (userId: string): Promise<{
  connections: number;
  endorsements: number;
  profileViews: number;
}> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new UserServiceError('USER_NOT_FOUND', 'User not found', 404);
  }

  return {
    connections: user.connections || 0,
    endorsements: user.endorsements || 0,
    profileViews: user.profileViews || 0,
  };
};

// ============================================================================
// RESPONSE FORMATTERS
// ============================================================================

/**
 * Format user for profile response
 */
export const formatProfileResponse = (user: UserType): ProfileResponse => ({
  success: true,
  user,
});

// ============================================================================
// CUSTOM ERROR
// ============================================================================

export class UserServiceError extends Error {
  public code: string;
  public statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'UserServiceError';
  }
}
