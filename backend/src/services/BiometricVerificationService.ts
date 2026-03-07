/**
 * Biometric Verification Service
 * Handles biometric verification workflows
 */

import User from '../models/user';
import * as TrustScoreService from './TrustScoreService';
import * as NotificationService from './NotificationService';
import { generateBiometricChallenge } from '../utils/security';
import { VerificationError } from './VerificationError';

/**
 * Request biometric verification
 * Generates a WebAuthn challenge for the client
 * @param userId User requesting verification
 * @returns Challenge for client
 */
export const requestBiometricVerification = async (userId: string) => {
  // Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new VerificationError('USER_NOT_FOUND', 'User not found', 404);
  }

  // Generate challenge
  const challenge = generateBiometricChallenge();

  // Store challenge temporarily (could use Redis in production)
  // For now, we just return it to the client
  return { challenge };
};

/**
 * Complete biometric verification
 * @param userId User completing verification
 * @param verificationData Verification data from client
 * @returns Updated user
 */
export const completeBiometricVerification = async (
  userId: string,
  _verificationData?: any
): Promise<{ user: any; trustScoreChanged: boolean }> => {
  // Update user verification tier
  const user = await User.update(userId, { 
    verificationTier: 'full',
  });

  if (!user) {
    throw new VerificationError('UPDATE_FAILED', 'Failed to update user', 500);
  }

  // Recalculate trust score
  const trustResult = await TrustScoreService.recalculate(userId);

  // Send notification
  await NotificationService.notifyVerificationCompleted(userId, 'full');

  return {
    user,
    trustScoreChanged: trustResult.changed,
  };
};
