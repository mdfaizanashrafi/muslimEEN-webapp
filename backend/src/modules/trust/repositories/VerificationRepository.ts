/**
 * Verification Repository
 * Data access for verification records (biometric & business only)
 * 
 * NOTE: Witness verification system has been removed.
 * MuslimEEN now uses invitation-only onboarding.
 * Only biometric and business verification remain.
 */

import pool from '../../database/pool';

export interface VerificationInput {
  userId: string;
  type: 'biometric' | 'business';
  status: 'pending' | 'verified' | 'rejected';
  documents?: string[];
}

/**
 * Create verification record
 */
export const create = async (input: VerificationInput): Promise<any> => {
  const result = await pool.query(
    `INSERT INTO verifications (user_id, type, status, documents)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.userId, input.type, input.status, JSON.stringify(input.documents || [])]
  );
  return result.rows[0];
};

/**
 * Complete verification
 */
export const completeVerification = async (
  userId: string,
  type: 'biometric' | 'business',
  reviewedBy?: string
): Promise<void> => {
  await pool.query(
    `UPDATE verifications 
     SET status = 'verified', 
         reviewed_by = $1,
         reviewed_at = NOW()
     WHERE user_id = $2 AND type = $3`,
    [reviewedBy, userId, type]
  );
};

/**
 * Get pending verifications for user
 */
export const getPendingForUser = async (userId: string): Promise<any[]> => {
  const result = await pool.query(
    `SELECT * FROM verifications 
     WHERE user_id = $1 AND status = 'pending'`,
    [userId]
  );
  return result.rows;
};

/**
 * Get verification status for user
 */
export const getVerificationStatus = async (userId: string): Promise<any> => {
  const result = await pool.query(
    `SELECT 
       MAX(CASE WHEN type = 'biometric' THEN status END) as biometric_status,
       MAX(CASE WHEN type = 'business' THEN status END) as business_status
     FROM verifications 
     WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0];
};

/**
 * Check if user has verified biometric
 */
export const hasBiometricVerification = async (userId: string): Promise<boolean> => {
  const result = await pool.query(
    `SELECT 1 FROM verifications 
     WHERE user_id = $1 AND type = 'biometric' AND status = 'verified'`,
    [userId]
  );
  return result.rows.length > 0;
};

/**
 * Check if user has verified business
 */
export const hasBusinessVerification = async (userId: string): Promise<boolean> => {
  const result = await pool.query(
    `SELECT 1 FROM verifications 
     WHERE user_id = $1 AND type = 'business' AND status = 'verified'`,
    [userId]
  );
  return result.rows.length > 0;
};
