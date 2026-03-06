/**
 * Profile Service
 * Manages user profile data and endorsements
 */

import * as ProfileRepository from '../repositories/ProfileRepository';
import { eventBus, DomainEvents } from '../../shared/events/EventBus';

export interface ProfileUpdateInput {
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  industry?: string;
  skills?: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  bio?: string;
  location?: string;
  industry?: string;
  skills: string[];
  endorsements: number;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Get full profile by user ID
 */
export const getProfile = async (userId: string): Promise<UserProfile> => {
  const profile = await ProfileRepository.findById(userId);
  if (!profile) {
    throw new ProfileError('PROFILE_NOT_FOUND', 'Profile not found', 404);
  }
  return profile;
};

/**
 * Get public profile (limited fields)
 */
export const getPublicProfile = async (userId: string): Promise<Partial<UserProfile> | null> => {
  const profile = await ProfileRepository.findById(userId);
  if (!profile) return null;

  // Return limited fields for public view
  const { email, ...publicProfile } = profile;
  return publicProfile;
};

/**
 * Update user profile
 */
export const updateProfile = async (
  userId: string,
  updates: ProfileUpdateInput
): Promise<UserProfile> => {
  // Validate allowed fields
  const allowedFields = ['firstName', 'lastName', 'bio', 'location', 'industry', 'skills'];

  const sanitizedUpdates: Partial<ProfileUpdateInput> = {};
  for (const key of allowedFields) {
    if (key in updates) {
      (sanitizedUpdates as any)[key] = (updates as any)[key];
    }
  }

  const profile = await ProfileRepository.update(userId, sanitizedUpdates);
  if (!profile) {
    throw new ProfileError('UPDATE_FAILED', 'Failed to update profile', 500);
  }

  // Publish event
  await eventBus.publish(DomainEvents.PROFILE_UPDATED, {
    userId,
    changes: Object.keys(sanitizedUpdates),
    timestamp: new Date(),
  });

  return profile;
};

/**
 * Add skill endorsement
 */
export const addEndorsement = async (
  userId: string,
  skill: string,
  endorserId: string
): Promise<void> => {
  await ProfileRepository.addEndorsement(userId, skill, endorserId);

  await eventBus.publish(DomainEvents.SKILL_ENDORSED, {
    userId,
    skill,
    endorserId,
    timestamp: new Date(),
  });
};

/**
 * Format profile for response
 */
export const formatProfileResponse = (profile: UserProfile): any => ({
  success: true,
  profile,
});

// ============================================================================
// CUSTOM ERROR
// ============================================================================

export class ProfileError extends Error {
  public code: string;
  public statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'ProfileError';
  }
}
