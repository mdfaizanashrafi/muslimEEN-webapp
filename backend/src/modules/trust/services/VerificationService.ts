/**
 * Verification Service
 * Manages identity verification workflows
 * 
 * NOTE: Witness verification has been removed.
 * Only biometric and business verification remain.
 * MuslimEEN uses invitation-only onboarding.
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
    type: 'biometric',
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
  await VerificationRepository.completeVerification(userId, 'biometric');

  // Update user's verification tier
  await TrustScoreRepository.updateVerificationTier(userId, 'full');

  // Publish event
  await eventBus.publish(DomainEvents.VERIFICATION_COMPLETED, {
    userId,
    type: 'biometric',
    tier: 'full',
    timestamp: new Date(),
  });

  return { trustScoreChanged: true };
};

/**
 * Request business verification
 */
export const requestBusinessVerification = async (
  userId: string,
  businessData: {
    companyName: string;
    registrationNumber: string;
    documents?: string[];
  }
): Promise<void> => {
  await VerificationRepository.create({
    userId,
    type: 'business',
    status: 'pending',
    documents: businessData.documents,
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
  await TrustScoreRepository.updateVerificationTier(userId, 'business');

  await eventBus.publish(DomainEvents.VERIFICATION_COMPLETED, {
    userId,
    type: 'business',
    tier: 'business',
    approvedBy: adminId,
    timestamp: new Date(),
  });

  return { trustScoreChanged: true };
};

/**
 * Get verification status for user
 */
export const getVerificationStatus = async (userId: string): Promise<{
  biometric: 'pending' | 'verified' | 'not_started';
  business: 'pending' | 'verified' | 'not_started';
}> => {
  const status = await VerificationRepository.getVerificationStatus(userId);
  
  return {
    biometric: status?.biometric_status || 'not_started',
    business: status?.business_status || 'not_started',
  };
};

// ============================================================================
// HELPERS
// ============================================================================

function generateBiometricChallenge(userId: string): string {
  // Integration with biometric provider
  return `challenge_${userId}_${Date.now()}`;
}

async function verifyBiometricData(data: any): Promise<boolean> {
  // SECURITY: Biometric verification requires real implementation
  // This is a placeholder that should be replaced with actual WebAuthn/FIDO2 integration
  
  // Feature flag check - disable if not properly configured
  const BIOMETRIC_ENABLED = process.env.BIOMETRIC_VERIFICATION_ENABLED === 'true';
  
  if (!BIOMETRIC_ENABLED) {
    throw new VerificationError(
      'BIOMETRIC_NOT_CONFIGURED',
      'Biometric verification is not enabled. Please contact support.'
    );
  }
  
  // TODO: Implement real WebAuthn verification
  // This should:
  // 1. Verify the attestation object
  // 2. Check challenge matches what was generated
  // 3. Verify signature with public key
  // 4. Check for replay attacks
  
  throw new VerificationError(
    'NOT_IMPLEMENTED',
    'Biometric verification integration pending. This feature will be available soon.'
  );
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
