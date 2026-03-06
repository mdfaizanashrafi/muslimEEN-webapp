/**
 * Verification Service
 * Orchestrates user verification workflows
 * Coordinates biometric, witness, and business verification
 */

import User from '../models/User';
import * as TrustScoreService from './TrustScoreService';
import * as NotificationService from './NotificationService';
import { generateBiometricChallenge } from '../utils/security';

// ============================================================================
// BIOMETRIC VERIFICATION
// ============================================================================

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

// ============================================================================
// WITNESS VERIFICATION
// ============================================================================

/**
 * Request witness verification
 * Creates pending witness requests
 * @param userId User requesting verification
 * @param witnessIds Array of witness user IDs
 */
export const requestWitnessVerification = async (
  userId: string,
  witnessIds: string[]
): Promise<void> => {
  // Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new VerificationError('USER_NOT_FOUND', 'User not found', 404);
  }

  // Verify all witnesses exist and are eligible
  const witnesses = await Promise.all(
    witnessIds.map(id => User.findById(id))
  );

  const ineligibleWitnesses = witnesses
    .map((w, index) => ({ user: w, index }))
    .filter(({ user }) => !user || !user.isWitnessEligible);

  if (ineligibleWitnesses.length > 0) {
    throw new VerificationError(
      'INELIGIBLE_WITNESSES',
      'Some witnesses are not eligible',
      400
    );
  }

  // Create witness requests (implementation depends on witness model)
  // This would create records in verification_witnesses table
  // For now, this is a placeholder
};

/**
 * Approve witness verification
 * @param userId User being verified
 * @param witnessId Witness approving
 * @returns Updated user
 */
export const approveWitnessVerification = async (
  userId: string,
  witnessId: string
): Promise<{ user: any; trustScoreChanged: boolean }> => {
  // Verify witness is eligible
  const witness = await User.findById(witnessId);
  if (!witness || !witness.isWitnessEligible) {
    throw new VerificationError('WITNESS_NOT_ELIGIBLE', 'Witness is not eligible', 403);
  }

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

// ============================================================================
// BUSINESS VERIFICATION
// ============================================================================

/**
 * Request business verification
 * @param userId User requesting verification
 */
export const requestBusinessVerification = async (userId: string): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new VerificationError('USER_NOT_FOUND', 'User not found', 404);
  }

  // Create business verification request
  // This would create a record for admin review
  // Placeholder for actual implementation
};

/**
 * Approve business verification (Admin only)
 * @param userId User being verified
 * @param adminId Admin approving
 * @returns Updated user
 */
export const approveBusinessVerification = async (
  userId: string,
  adminId: string
): Promise<{ user: any; trustScoreChanged: boolean }> => {
  // Verify admin exists and has admin role
  const admin = await User.findById(adminId);
  if (!admin) {
    throw new VerificationError('ADMIN_NOT_FOUND', 'Admin not found', 404);
  }
  // Note: Role check should be done in controller/middleware

  // Update user to business role and tier
  const user = await User.update(userId, { 
    verificationTier: 'business',
    role: 'business_provider',
  });

  if (!user) {
    throw new VerificationError('UPDATE_FAILED', 'Failed to update user', 500);
  }

  // Recalculate trust score
  const trustResult = await TrustScoreService.recalculate(userId);

  // Send notification
  await NotificationService.notifyVerificationCompleted(userId, 'business');

  return {
    user,
    trustScoreChanged: trustResult.changed,
  };
};

// ============================================================================
// CUSTOM ERROR
// ============================================================================

export class VerificationError extends Error {
  public code: string;
  public statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'VerificationError';
  }
}
