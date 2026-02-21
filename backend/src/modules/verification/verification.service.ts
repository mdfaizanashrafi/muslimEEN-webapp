/**
 * Verification Service
 * Business logic for user verification (biometric, two-witness, business)
 */

import { randomBytes } from 'crypto';
import * as db from '../../config/database';
import User from '../../models/User';
import Notification from '../../models/Notification';
import TrustScore from '../../models/TrustScore';
import logger from '../../utils/logger';
import {
  BiometricChallengeResponse,
  BiometricCompleteResponse,
  WitnessVerificationResponse,
  WitnessApproveResponse,
  BusinessVerificationResponse,
  BusinessApproveResponse,
  VerificationStatusResponse,
  WitnessRow,
  ApprovedCountRow,
} from './verification.types';

/**
 * Generate a biometric challenge for WebAuthn
 */
export const generateBiometricChallenge = async (
  session: Record<string, any>
): Promise<BiometricChallengeResponse> => {
  // In a real implementation, this would:
  // 1. Generate WebAuthn challenge
  // 2. Store challenge in session/cache
  // 3. Return challenge to client

  const challenge = randomBytes(32).toString('base64');

  // Store challenge (in production, use Redis or similar)
  session.biometricChallenge = challenge;

  return {
    success: true,
    challenge,
    message: 'Biometric verification initiated',
  };
};

/**
 * Complete biometric verification and update user tier
 */
export const completeBiometricVerification = async (
  userId: string,
  credential: string,
  currentBadges: string[]
): Promise<BiometricCompleteResponse> => {
  // In a real implementation, this would:
  // 1. Verify the credential against stored challenge
  // 2. Verify WebAuthn signature
  // 3. Store public key for future authentication

  // For now, we'll simulate successful verification
  const badges = currentBadges || [];

  if (!badges.includes('biometric')) {
    badges.push('biometric');

    await User.update(userId, {
      badges: badges,
      verification_tier: 'full',
    });

    // Recalculate trust score
    await TrustScore.recalculate(userId);

    // Create notification
    await Notification.createVerificationCompleted(userId, 'full');

    logger.info(`Biometric verification completed for ${userId}`);
  }

  return {
    success: true,
    message: 'Biometric verification completed',
  };
};

/**
 * Request two-witness verification
 */
export const requestWitnessVerification = async (
  userId: string,
  userBadges: string[],
  userFullName: string,
  userTrustScore: number,
  witnessIds: string[]
): Promise<WitnessVerificationResponse> => {
  // Check if user already has two-witness verification
  if (userBadges.includes('two_witness')) {
    throw new Error('ALREADY_VERIFIED: Already has two-witness verification');
  }

  // Validate witnesses
  if (!witnessIds || witnessIds.length !== 2) {
    throw new Error('INVALID_WITNESSES: Exactly 2 witnesses required');
  }

  // Check witnesses are eligible (trust score >= 200, verified)
  const witnessQuery = `
    SELECT id, trust_score, verification_tier, is_witness_eligible
    FROM users
    WHERE id = ANY($1)
  `;
  const witnessResult = await db.query(witnessQuery, [witnessIds]);

  if (witnessResult.rows.length !== 2) {
    throw new Error('INVALID_WITNESSES: One or more witnesses not found');
  }

  for (const witness of witnessResult.rows as WitnessRow[]) {
    if (!witness.is_witness_eligible || witness.trust_score < 200) {
      throw new Error(
        `INELIGIBLE_WITNESS: Witness ${witness.id} is not eligible to witness`
      );
    }
  }

  // Create witness requests
  const witnessRequestQuery = `
    INSERT INTO verification_witnesses (user_id, witness_id, status)
    VALUES ($1, $2, 'pending'), ($1, $3, 'pending')
    ON CONFLICT (user_id, witness_id) DO UPDATE SET status = 'pending'
  `;
  await db.query(witnessRequestQuery, [userId, witnessIds[0], witnessIds[1]]);

  // Create notifications for witnesses
  for (const witnessId of witnessIds) {
    await Notification.create({
      userId: witnessId,
      type: Notification.TYPES.VERIFICATION_COMPLETED,
      title: 'Witness Request',
      message: `${userFullName} requested you as a witness`,
      actorId: userId,
      actorName: userFullName,
      actorTrustScore: userTrustScore,
      actionUrl: '/verification/witness',
    });
  }

  logger.info(
    `Witness verification requested by ${userId} from ${witnessIds.join(', ')}`
  );

  return {
    success: true,
    message: 'Witness verification requested',
  };
};

/**
 * Approve witness request
 */
export const approveWitness = async (
  witnessId: string,
  userId: string
): Promise<WitnessApproveResponse> => {
  // Update witness status
  const updateQuery = `
    UPDATE verification_witnesses
    SET status = 'approved', witnessed_at = NOW()
    WHERE user_id = $1 AND witness_id = $2
    RETURNING *
  `;
  const updateResult = await db.query(updateQuery, [userId, witnessId]);

  if (updateResult.rows.length === 0) {
    throw new Error('NOT_FOUND: Witness request not found');
  }

  // Check if both witnesses have approved
  const countQuery = `
    SELECT COUNT(*) as approved_count
    FROM verification_witnesses
    WHERE user_id = $1 AND status = 'approved'
  `;
  const countResult = await db.query(countQuery, [userId]);
  const approvedCount = parseInt(
    (countResult.rows[0] as ApprovedCountRow).approved_count
  );

  if (approvedCount >= 2) {
    // Grant two-witness badge
    const user = await User.findById(userId);
    const currentBadges = user.badges || [];

    if (!currentBadges.includes('two_witness')) {
      currentBadges.push('two_witness');

      await User.update(userId, {
        badges: currentBadges,
        verification_tier: 'full',
      });

      // Recalculate trust score
      await TrustScore.recalculate(userId);

      // Create notification
      await Notification.createVerificationCompleted(userId, 'full');

      logger.info(`Two-witness verification completed for ${userId}`);
    }
  }

  return {
    success: true,
    message: 'Witness approval recorded',
  };
};

/**
 * Request business verification
 */
export const requestBusinessVerification = async (
  userId: string,
  documents: string[]
): Promise<BusinessVerificationResponse> => {
  // In a real implementation, this would:
  // 1. Store uploaded documents
  // 2. Create admin review task
  // 3. Notify admins

  logger.info(`Business verification requested by ${userId}`);

  return {
    success: true,
    message: 'Business verification request submitted for review',
  };
};

/**
 * Approve business verification (admin only)
 */
export const approveBusinessVerification = async (
  userId: string
): Promise<BusinessApproveResponse> => {
  const user = await User.findById(userId);
  const currentBadges = user.badges || [];

  if (!currentBadges.includes('business')) {
    currentBadges.push('business');

    await User.update(userId, {
      badges: currentBadges,
      verification_tier: 'business',
    });

    // Recalculate trust score
    await TrustScore.recalculate(userId);

    // Create notification
    await Notification.createVerificationCompleted(userId, 'business');

    logger.info(`Business verification approved for ${userId}`);
  }

  return {
    success: true,
    message: 'Business verification approved',
  };
};

/**
 * Get verification status
 */
export const getVerificationStatus = async (
  userId: string
): Promise<VerificationStatusResponse> => {
  const user = await User.getFullProfile(userId);

  const verificationProgress = {
    emailVerified: true, // Assumed if logged in
    biometricVerified: user.badges.includes('biometric'),
    twoWitnessVerified: user.badges.includes('two_witness'),
    businessVerified: user.badges.includes('business'),
  };

  return {
    success: true,
    tier: user.verificationTier,
    badges: user.badges,
    progress: verificationProgress,
  };
};
