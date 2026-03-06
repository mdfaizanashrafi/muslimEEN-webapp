/**
 * Trust Score Repository
 * Data access for trust scores and history
 */

import pool from '../../database/pool';

/**
 * Get current trust score
 */
export const getCurrentScore = async (userId: string): Promise<number> => {
  const result = await pool.query(
    'SELECT trust_score FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0]?.trust_score || 0;
};

/**
 * Get latest factor breakdown
 */
export const getLatestFactors = async (userId: string): Promise<any | null> => {
  const result = await pool.query(
    `SELECT * FROM trust_score_history 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
};

/**
 * Get trust score history
 */
export const getHistory = async (userId: string): Promise<any[]> => {
  const result = await pool.query(
    `SELECT score, factors, created_at as date
     FROM trust_score_history 
     WHERE user_id = $1 
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

/**
 * Save new trust score
 */
export const saveScore = async (
  userId: string,
  score: number,
  factors: any
): Promise<void> => {
  // Update current score
  await pool.query(
    'UPDATE users SET trust_score = $1 WHERE id = $2',
    [score, userId]
  );

  // Add history entry
  await pool.query(
    `INSERT INTO trust_score_history (user_id, score, factors)
     VALUES ($1, $2, $3)`,
    [userId, score, JSON.stringify(factors)]
  );
};

/**
 * Get user metrics for calculation
 */
export const getUserMetrics = async (userId: string): Promise<any> => {
  const result = await pool.query(
    `SELECT 
       u.verification_tier,
       u.endorsements,
       (SELECT COUNT(*) FROM connections 
        WHERE (requester_id = u.id OR recipient_id = u.id) 
        AND status = 'accepted') as connection_count,
       (SELECT COUNT(*) FROM invitations 
        WHERE created_by = u.id AND status = 'used') as successful_invites,
       (SELECT COUNT(*) FROM invitations 
        WHERE created_by = u.id AND status = 'expired') as failed_invites,
       CASE 
         WHEN u.bio IS NOT NULL AND u.location IS NOT NULL 
              AND u.industry IS NOT NULL AND array_length(u.skills, 1) > 0
         THEN 100
         WHEN u.bio IS NOT NULL AND u.location IS NOT NULL
         THEN 50
         ELSE 25
       END as profile_completeness
     FROM users u
     WHERE u.id = $1`,
    [userId]
  );

  const row = result.rows[0];
  if (!row) return {};

  return {
    verificationTier: row.verification_tier,
    endorsements: parseInt(row.endorsements) || 0,
    connectionCount: parseInt(row.connection_count) || 0,
    successfulInvites: parseInt(row.successful_invites) || 0,
    failedInvites: parseInt(row.failed_invites) || 0,
    profileCompleteness: row.profile_completeness,
    connectionQuality: Math.min(50, (parseInt(row.connection_count) || 0) * 2),
    communityContributions: (parseInt(row.successful_invites) || 0) * 10,
  };
};

/**
 * Check if user is witness eligible
 */
export const isWitnessEligible = async (userId: string): Promise<boolean> => {
  const result = await pool.query(
    'SELECT is_witness_eligible FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0]?.is_witness_eligible || false;
};

/**
 * Update verification tier
 */
export const updateVerificationTier = async (
  userId: string,
  tier: string
): Promise<void> => {
  await pool.query(
    'UPDATE users SET verification_tier = $1 WHERE id = $2',
    [tier, userId]
  );
};
