/**
 * Trust Score Repository
 * Database access for trust scores and history
 */

import pool from '../database/pool';
import { TrustScoreFactors } from './trustScoreTypes';

/**
 * Check if user exists
 */
export const userExists = async (userId: string): Promise<boolean> => {
  const result = await pool.query(
    'SELECT 1 FROM users WHERE id = $1',
    [userId]
  );
  return result.rows.length > 0;
};

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
export const getLatestFactors = async (userId: string): Promise<TrustScoreFactors | null> => {
  const result = await pool.query(
    `SELECT factors 
     FROM trust_score_history 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [userId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return typeof result.rows[0].factors === 'string' 
    ? JSON.parse(result.rows[0].factors)
    : result.rows[0].factors;
};

/**
 * Save new trust score
 */
export const saveScore = async (
  userId: string,
  score: number,
  factors: TrustScoreFactors
): Promise<void> => {
  // Update current score on users table
  await pool.query(
    `UPDATE users 
     SET trust_score = $1, 
         is_witness_eligible = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [score, score >= 200, userId]
  );
  
  // Add history entry
  await pool.query(
    `INSERT INTO trust_score_history (user_id, score, factors, created_at)
     VALUES ($1, $2, $3, NOW())`,
    [userId, score, JSON.stringify(factors)]
  );
};

/**
 * Get trust score history
 */
export const getHistory = async (userId: string): Promise<any[]> => {
  const result = await pool.query(
    `SELECT score, factors, created_at
     FROM trust_score_history 
     WHERE user_id = $1 
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

/**
 * Get user metrics for trust score calculation
 */
export const getUserMetrics = async (userId: string): Promise<any> => {
  const result = await pool.query(
    `SELECT 
       u.verification_tier,
       u.endorsements,
       u.bio,
       u.location,
       u.industry,
       u.skills,
       (SELECT COUNT(*) 
        FROM connections 
        WHERE (requester_id = u.id OR recipient_id = u.id) 
          AND status = 'accepted') as connection_count,
       (SELECT COUNT(*) 
        FROM invitations 
        WHERE created_by = u.id AND status = 'used') as successful_invites,
       (SELECT COUNT(*) 
        FROM invitations 
        WHERE created_by = u.id AND status = 'expired') as failed_invites
     FROM users u
     WHERE u.id = $1`,
    [userId]
  );
  
  const row = result.rows[0];
  if (!row) {
    return {};
  }
  
  return {
    verificationTier: row.verification_tier,
    endorsements: parseInt(row.endorsements) || 0,
    connectionCount: parseInt(row.connection_count) || 0,
    successfulInvites: parseInt(row.successful_invites) || 0,
    failedInvites: parseInt(row.failed_invites) || 0,
    profileCompleteness: calculateProfileCompleteness(row),
    connectionQuality: Math.min(50, (parseInt(row.connection_count) || 0) * 2),
    communityContributions: (parseInt(row.successful_invites) || 0) * 10,
  };
};

// ============================================================================
// PRIVATE HELPERS
// ============================================================================

const calculateProfileCompleteness = (row: any): number => {
  let score = 0;
  if (row.bio) score += 25;
  if (row.location) score += 25;
  if (row.industry) score += 25;
  if (row.skills && row.skills.length > 0) score += 25;
  return score;
};
