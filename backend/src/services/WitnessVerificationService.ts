/**
 * Witness Verification Service
 * Handles witness verification workflows
 */

import User from '../models/user';
import * as TrustScoreService from './TrustScoreService';
import * as NotificationService from './NotificationService';
import { VerificationError } from './VerificationError';

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
