/**
 * Profile Controller
 * Handles HTTP requests for user profile management
 */

import { Request, Response, NextFunction } from 'express';
import * as ProfileService from '../services/ProfileService';
import { ProfileError } from '../services/ProfileService';

// ============================================================================
// SECURITY: ALLOWED FIELDS FOR PROFILE UPDATES
// ============================================================================
// Whitelist approach - only these fields can be updated via the API
// This prevents mass assignment attacks where attackers try to set 
// sensitive fields like 'role', 'trustScore', 'isAdmin', etc.

const ALLOWED_PROFILE_FIELDS = [
  'firstName',
  'lastName',
  'bio',
  'location',
  'industry',
  'skills',
] as const;

type AllowedProfileField = typeof ALLOWED_PROFILE_FIELDS[number];

/**
 * Sanitize and validate profile updates
 * Only allows whitelisted fields
 * @param updates Raw updates from request body
 * @returns Sanitized updates object
 */
const sanitizeProfileUpdates = (updates: any): Partial<Record<AllowedProfileField, any>> => {
  const sanitized: Partial<Record<AllowedProfileField, any>> = {};
  
  for (const field of ALLOWED_PROFILE_FIELDS) {
    if (updates[field] !== undefined) {
      // Additional validation per field could be added here
      sanitized[field] = updates[field];
    }
  }
  
  return sanitized;
};

/**
 * Check if user is trying to update restricted fields
 * @param updates Raw updates from request body
 * @returns Array of restricted fields found
 */
const detectRestrictedFields = (updates: any): string[] => {
  const restrictedFields: string[] = [];
  const sensitivePatterns = [
    'role',
    'trustScore',
    'trust_score',
    'verificationTier',
    'verification_tier',
    'isAdmin',
    'is_admin',
    'isActive',
    'is_active',
    'password',
    'passwordHash',
    'password_hash',
    'email',
    'id',
    'invitesRemaining',
    'invites_remaining',
  ];
  
  for (const key of Object.keys(updates)) {
    if (!ALLOWED_PROFILE_FIELDS.includes(key as AllowedProfileField)) {
      restrictedFields.push(key);
    }
    if (sensitivePatterns.some(pattern => key.toLowerCase().includes(pattern.toLowerCase()))) {
      // Log attempted manipulation of sensitive fields
      console.warn(`Attempt to modify sensitive field detected: ${key}`);
    }
  }
  
  return restrictedFields;
};

// ============================================================================
// CONTROLLER FUNCTIONS
// ============================================================================

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
 * SECURITY: Uses whitelist approach to prevent mass assignment
 */
export const updateCurrentUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    // SECURITY: Check for attempts to update restricted fields
    const restrictedFields = detectRestrictedFields(req.body);
    if (restrictedFields.length > 0) {
      console.warn(`User ${userId} attempted to update restricted fields:`, restrictedFields);
      // Continue but only allow whitelisted fields
    }
    
    // SECURITY: Sanitize input - only allow whitelisted fields
    const profileUpdates = sanitizeProfileUpdates(req.body);
    
    // Validate at least one field is being updated
    if (Object.keys(profileUpdates).length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_VALID_FIELDS',
          message: 'No valid profile fields provided for update.',
        },
      });
      return;
    }

    const updatedProfile = await ProfileService.updateProfile(userId, profileUpdates);

    res.json({
      success: true,
      profile: updatedProfile,
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
 * Get user's public profile
 * SECURITY: Only returns public information, not sensitive data
 */
export const getPublicProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const targetUserId = req.params.userId;
    const requestingUserId = req.user?.id;
    
    // Validate userId format
    if (!targetUserId || typeof targetUserId !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_USER_ID', message: 'Invalid user ID format' },
      });
      return;
    }
    
    const profile = await ProfileService.getPublicProfile(targetUserId);

    if (!profile) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Profile not found' },
      });
      return;
    }
    
    // SECURITY: Log profile access for audit trail
    if (requestingUserId && requestingUserId !== targetUserId) {
      console.info(`User ${requestingUserId} accessed profile of ${targetUserId}`);
    }

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
};
