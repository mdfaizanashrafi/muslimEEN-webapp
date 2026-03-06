/**
 * Profile Service
 * Business logic for user profile management
 * Responsibilities: Validate business rules, orchestrate repositories, publish events
 */

import { ProfileRepository } from './profileRepository';
import { ProfileError, ProfileUpdateInput, UserProfile } from './profileTypes';
import { eventBus, DomainEvents } from '../shared/events/eventBus';

// Allowed profile fields for update
const ALLOWED_PROFILE_FIELDS: (keyof ProfileUpdateInput)[] = [
  'firstName',
  'lastName',
  'bio',
  'location',
  'industry',
  'skills',
];

/**
 * Get full profile by user ID
 */
export const getProfileByUserId = async (userId: string): Promise<UserProfile> => {
  const profile = await ProfileRepository.findByUserId(userId);
  
  if (!profile) {
    throw new ProfileError('PROFILE_NOT_FOUND', 'Profile not found', 404);
  }
  
  return profile;
};

/**
 * Get public profile (limited fields for other users)
 */
export const getPublicProfile = async (userId: string): Promise<Partial<UserProfile> | null> => {
  const profile = await ProfileRepository.findByUserId(userId);
  
  if (!profile) {
    return null;
  }
  
  // Exclude sensitive fields from public view
  const { email, ...publicProfile } = profile;
  return publicProfile;
};

/**
 * Update user profile with validation
 */
export const updateProfile = async (
  userId: string,
  updates: ProfileUpdateInput
): Promise<UserProfile> => {
  // Validate: Filter to allowed fields only
  const sanitizedUpdates = sanitizeProfileUpdates(updates);
  
  // Validate: Check if there are any valid updates
  if (Object.keys(sanitizedUpdates).length === 0) {
    throw new ProfileError('NO_VALID_UPDATES', 'No valid fields to update', 400);
  }
  
  // Validate: Check profile exists
  const existingProfile = await ProfileRepository.findByUserId(userId);
  if (!existingProfile) {
    throw new ProfileError('PROFILE_NOT_FOUND', 'Profile not found', 404);
  }
  
  // Business rule: Validate skills limit
  if (sanitizedUpdates.skills && sanitizedUpdates.skills.length > 50) {
    throw new ProfileError('SKILLS_LIMIT_EXCEEDED', 'Maximum 50 skills allowed', 400);
  }
  
  // Business rule: Validate bio length
  if (sanitizedUpdates.bio && sanitizedUpdates.bio.length > 500) {
    throw new ProfileError('BIO_TOO_LONG', 'Bio must be less than 500 characters', 400);
  }
  
  // Perform update
  const updatedProfile = await ProfileRepository.update(userId, sanitizedUpdates);
  
  if (!updatedProfile) {
    throw new ProfileError('UPDATE_FAILED', 'Failed to update profile', 500);
  }
  
  // Publish domain event for other modules
  await eventBus.publish(DomainEvents.PROFILE_UPDATED, {
    userId,
    updatedFields: Object.keys(sanitizedUpdates),
    timestamp: new Date(),
  });
  
  return updatedProfile;
};

/**
 * Add skill endorsement
 */
export const addEndorsement = async (
  userId: string,
  skill: string,
  endorserId: string
): Promise<void> => {
  // Business rule: Cannot endorse yourself
  if (userId === endorserId) {
    throw new ProfileError('SELF_ENDORSEMENT', 'Cannot endorse yourself', 400);
  }
  
  // Business rule: Skill must exist on user's profile
  const profile = await ProfileRepository.findByUserId(userId);
  if (!profile || !profile.skills.includes(skill)) {
    throw new ProfileError('SKILL_NOT_FOUND', 'Skill not found on user profile', 400);
  }
  
  // Business rule: Check if already endorsed
  const hasEndorsed = await ProfileRepository.hasEndorsed(userId, skill, endorserId);
  if (hasEndorsed) {
    throw new ProfileError('ALREADY_ENDORSED', 'You have already endorsed this skill', 409);
  }
  
  await ProfileRepository.addEndorsement(userId, skill, endorserId);
  
  await eventBus.publish(DomainEvents.SKILL_ENDORSED, {
    userId,
    skill,
    endorserId,
    timestamp: new Date(),
  });
};

// ============================================================================
// PRIVATE HELPERS
// ============================================================================

/**
 * Filter updates to only allowed fields
 */
const sanitizeProfileUpdates = (updates: ProfileUpdateInput): Partial<ProfileUpdateInput> => {
  const sanitized: Partial<ProfileUpdateInput> = {};
  
  for (const field of ALLOWED_PROFILE_FIELDS) {
    if (field in updates) {
      (sanitized as any)[field] = (updates as any)[field];
    }
  }
  
  return sanitized;
};
