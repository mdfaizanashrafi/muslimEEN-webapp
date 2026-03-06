/**
 * Verification Repository
 * Data access for verification records
 */

import pool from '../../database/pool';

export interface VerificationInput {
  userId: string;
  type: string;
  status: string;
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
    [input.userId, input.type, input.status, input.documents || []]
  );
  return result.rows[0];
};

/**
 * Complete verification
 */
export const completeVerification = async (
  userId: string,
  type: string,
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
 * Create witness verification requests
 */
export const createWitnessRequests = async (
  userId: string,
  witnessIds: string[]
): Promise<void> => {
  for (const witnessId of witnessIds) {
    await pool.query(
      `INSERT INTO witness_verifications (user_id, witness_id, status)
       VALUES ($1, $2, 'pending')
       ON CONFLICT (user_id, witness_id) DO NOTHING`,
      [userId, witnessId]
    );
  }
};

/**
 * Record witness approval
 */
export const recordWitnessApproval = async (
  userId: string,
  witnessId: string
): Promise<void> => {
  await pool.query(
    `UPDATE witness_verifications 
     SET status = 'approved', 
         approved_at = NOW()
     WHERE user_id = $1 AND witness_id = $2`,
    [userId, witnessId]
  );
};

/**
 * Get witness approval count
 */
export const getWitnessApprovalCount = async (userId: string): Promise<number> => {
  const result = await pool.query(
    `SELECT COUNT(*) as count 
     FROM witness_verifications 
     WHERE user_id = $1 AND status = 'approved'`,
    [userId]
  );
  return parseInt(result.rows[0].count);
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
