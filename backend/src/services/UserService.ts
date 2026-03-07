/**
 * User Service
 * Orchestrates user-related business logic
 * Coordinates between User repository and other services
 */

import User from '../models/user';
import { User as UserType, UserUpdateInput } from '../types';
import { ProfileResponse } from '../types/api';

// ============================================================================
// PROFILE MANAGEMENT
// ============================================================================

/**
 * Retrieves a complete user profile by ID.
 *
 * Fetches the user's full profile including all fields from the users table
 * and related data. This is typically used for viewing one's own profile
 * or fetching profile details for dashboard display.
 *
 * @param userId - Unique identifier of the user (UUID v4 format)
 *
 * @returns Complete user profile with all fields
 * @returns {string} result.id - User's unique identifier
 * @returns {string} result.email - User's registered email address
 * @returns {string} result.firstName - User's first name
 * @returns {string} result.lastName - User's last name
 * @returns {string} result.role - User role (muslim_verified, muslim_unverified, non_muslim, etc.)
 * @returns {string} result.verificationTier - Verification level (basic, biometric, witness, etc.)
 * @returns {number} result.trustScore - Current trust score (0-1000)
 * @returns {boolean} result.isWitnessEligible - Whether user can serve as witness
 *
 * @throws {UserServiceError} USER_NOT_FOUND - No user exists with the provided ID
 *
 * @example
 * ```typescript
 * const profile = await getProfile('550e8400-e29b-41d4-a716-446655440000');
 *
 * console.log(profile.fullName); // "Ahmad Ibrahim"
 * console.log(profile.trustScore); // 450
 * console.log(profile.role); // "muslim_unverified"
 * ```
 *
 * @see {@link updateProfile} for modifying profile data
 * @see {@link UserServiceError} for error handling
 */
export const getProfile = async (userId: string): Promise<UserType> => {
  const user = await User.getFullProfile(userId);
  if (!user) {
    throw new UserServiceError('USER_NOT_FOUND', 'User not found', 404);
  }
  return user;
};

/**
 * Updates a user's profile with validated and sanitized data.
 *
 * Only specific fields can be updated through this function to maintain
 * data integrity. Protected fields (email, role, trustScore, verificationTier)
 * require separate processes or admin approval.
 *
 * Note: This function does NOT trigger automatic trust score recalculation.
 * Call {@link TrustScoreService.recalculate} explicitly if profile changes
 * should affect the user's trust score.
 *
 * Allowed update fields:
 * - firstName: User's first name
 * - lastName: User's last name
 * - bio: Personal biography/introduction
 * - location: Geographic location
 * - industry: Professional industry
 * - skills: Array of professional skills
 *
 * @param userId - Unique identifier of the user to update (UUID v4 format)
 * @param updates - Object containing profile fields to update
 * @param updates.firstName - (Optional) Updated first name
 * @param updates.lastName - (Optional) Updated last name
 * @param updates.bio - (Optional) Personal biography (max 1000 characters)
 * @param updates.location - (Optional) Geographic location string
 * @param updates.industry - (Optional) Professional industry
 * @param updates.skills - (Optional) Array of skill strings
 *
 * @returns Updated user profile with all fields
 * @returns {string} result.id - User's unique identifier
 * @returns {string} result.firstName - Updated first name (if changed)
 * @returns {string} result.lastName - Updated last name (if changed)
 * @returns {string} result.bio - Updated biography (if changed)
 * @returns {Date} result.updatedAt - Timestamp of profile update
 *
 * @throws {UserServiceError} UPDATE_FAILED - Database update operation failed
 *
 * @example
 * ```typescript
 * const updated = await updateProfile(
 *   '550e8400-e29b-41d4-a716-446655440000',
 *   {
 *     firstName: 'Muhammad',
 *     bio: 'Software engineer passionate about Islamic finance',
 *     location: 'Kuala Lumpur, Malaysia',
 *     industry: 'Technology',
 *     skills: ['TypeScript', 'Node.js', 'Islamic Finance']
 *   }
 * );
 *
 * console.log(updated.firstName); // "Muhammad"
 * console.log(updated.bio); // "Software engineer passionate about Islamic finance"
 * ```
 *
 * @see {@link getProfile} for retrieving profile data
 * @see {@link TrustScoreService.recalculate} for trust score updates after profile changes
 * @see {@link UserServiceError} for error handling
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
