/**
 * Business Verification Service
 * Handles business verification workflows
 */

import User from '../models/user';
import * as TrustScoreService from './TrustScoreService';
import * as NotificationService from './NotificationService';
import { VerificationError } from './VerificationError';

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
