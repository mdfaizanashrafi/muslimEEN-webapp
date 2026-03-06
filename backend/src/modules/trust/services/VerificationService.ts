/**
 * Verification Service
 * Manages identity verification workflows
 */

import * as VerificationRepository from '../repositories/VerificationRepository';
import * as TrustScoreRepository from '../repositories/TrustScoreRepository';
import { eventBus, DomainEvents } from '../../shared/events/EventBus';

/**
 * Request biometric verification
 */
export const requestBiometricVerification = async (userId: string): Promise<any> => {
  // Create verification record
  await VerificationRepository.create({
    userId,
    type: 'identity',
    status: 'pending',
  });

  // Generate challenge for biometric provider
  const challenge = generateBiometricChallenge(userId);

  return { challenge };
};

/**
 * Complete biometric verification
 */
export const completeBiometricVerification = async (
  userId: string,
  data: any
): Promise<{ trustScoreChanged: boolean }> => {
  // Verify biometric data with provider
  const verified = await verifyBiometricData(data);

  if (!verified) {
    throw new VerificationError('VERIFICATION_FAILED', 'Biometric verification failed');
  }

  // Update verification status
  await VerificationRepository.completeVerification(userId, 'identity');

  // Update user's verification tier
  await TrustScoreRepository.updateVerificationTier(userId, 'standard');

  // Publish event
  await eventBus.publish(DomainEvents.VERIFICATION_COMPLETED, {
    userId,
    type: 'identity',
    tier: 'standard',
    timestamp: new Date(),
  });

  return { trustScoreChanged: true };
};

/**
 * Request witness verification
 */
export const requestWitnessVerification = async (
  userId: string,
  witnessIds: string[]
): Promise<void> => {
  // Validate witnesses are eligible
  for (const witnessId of witnessIds) {
    const isEligible = await TrustScoreRepository.isWitnessEligible(witnessId);
    if (!isEligible) {
      throw new VerificationError('INVALID_WITNESS', `User ${witnessId} is not eligible to be a witness`);
    }
  }

  // Create witness verification requests
  await VerificationRepository.createWitnessRequests(userId, witnessIds);
};

/**
 * Approve as witness
 */
export const approveAsWitness = async (
  userId: string,
  witnessId: string
): Promise<{ trustScoreChanged: boolean }> => {
  // Record witness approval
  await VerificationRepository.recordWitnessApproval(userId, witnessId);

  // Check if we have enough approvals (2)
  const approvalCount = await VerificationRepository.getWitnessApprovalCount(userId);

  if (approvalCount >= 2) {
    // Complete verification
    await VerificationRepository.completeVerification(userId, 'identity');
    await TrustScoreRepository.updateVerificationTier(userId, 'standard');

    await eventBus.publish(DomainEvents.VERIFICATION_COMPLETED, {
      userId,
      type: 'witness',
      tier: 'standard',
      timestamp: new Date(),
    });

    return { trustScoreChanged: true };
  }

  return { trustScoreChanged: false };
};

/**
 * Request business verification
 */
export const requestBusinessVerification = async (userId: string): Promise<void> => {
  await VerificationRepository.create({
    userId,
    type: 'business',
    status: 'pending',
  });
};

/**
 * Approve business verification (admin)
 */
export const approveBusinessVerification = async (
  userId: string,
  adminId: string
): Promise<{ trustScoreChanged: boolean }> => {
  await VerificationRepository.completeVerification(userId, 'business', adminId);
  await TrustScoreRepository.updateVerificationTier(userId, 'advanced');

  await eventBus.publish(DomainEvents.VERIFICATION_COMPLETED, {
    userId,
    type: 'business',
    tier: 'advanced',
    approvedBy: adminId,
    timestamp: new Date(),
  });

  return { trustScoreChanged: true };
};

// ============================================================================
// HELPERS
// ============================================================================

function generateBiometricChallenge(userId: string): string {
  // Integration with biometric provider
  return `challenge_${userId}_${Date.now()}`;
}

async function verifyBiometricData(data: any): Promise<boolean> {
  // Integration with biometric provider
  return !!data?.verificationToken;
}

// ============================================================================
// ERROR
// ============================================================================

export class VerificationError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'VerificationError';
  }
}
