/**
 * Invite Repository
 * 
 * Data access layer for invite tokens.
 * All database operations for invites are centralized here.
 */

import pool from '../../database/pool';
import { Invite, InviteWithInviter, InviteStatus } from '../types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const INVITE_TOKEN_BYTES = 32;
const DEFAULT_INVITE_EXPIRY_DAYS = 7;

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generate a cryptographically secure invite token
 * Format: base64url encoded 32-byte random string
 */
const generateSecureToken = (): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(INVITE_TOKEN_BYTES).toString('base64url');
};

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a new invite token
 */
export const create = async (
  createdBy: string,
  expiresInDays: number = DEFAULT_INVITE_EXPIRY_DAYS
): Promise<Invite> => {
  const token = generateSecureToken();
  
  const result = await pool.query(
    `INSERT INTO invites (token, created_by, status, expires_at, created_at)
     VALUES ($1, $2, 'pending', NOW() + INTERVAL '${expiresInDays} days', NOW())
     RETURNING *`,
    [token, createdBy]
  );
  
  return mapToInvite(result.rows[0]);
};

/**
 * Create an admin invite (with optional email and custom expiry)
 */
export const createAdminInvite = async (
  createdBy: string,
  inviteeEmail: string | null,
  expiresInDays: number = DEFAULT_INVITE_EXPIRY_DAYS
): Promise<Invite> => {
  const token = generateSecureToken();
  
  const result = await pool.query(
    `INSERT INTO invites (token, created_by, invitee_email, status, expires_at, created_at)
     VALUES ($1, $2, $3, 'pending', NOW() + INTERVAL '${expiresInDays} days', NOW())
     RETURNING *`,
    [token, createdBy, inviteeEmail]
  );
  
  return mapToInvite(result.rows[0]);
};

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Find invite by ID
 */
export const findById = async (id: string): Promise<Invite | null> => {
  const result = await pool.query(
    'SELECT * FROM invites WHERE id = $1',
    [id]
  );
  
  return result.rows.length > 0 ? mapToInvite(result.rows[0]) : null;
};

/**
 * Find invite by token
 */
export const findByToken = async (token: string): Promise<Invite | null> => {
  const result = await pool.query(
    'SELECT * FROM invites WHERE token = $1',
    [token]
  );
  
  return result.rows.length > 0 ? mapToInvite(result.rows[0]) : null;
};

/**
 * Find invite by token with inviter details
 */
export const findByTokenWithInviter = async (token: string): Promise<InviteWithInviter | null> => {
  const result = await pool.query(
    `SELECT i.*, u.email as inviter_email, u.first_name || ' ' || u.last_name as inviter_name
     FROM invites i
     JOIN users u ON i.created_by = u.id
     WHERE i.token = $1`,
    [token]
  );
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    ...mapToInvite(row),
    inviterEmail: row.inviter_email,
    inviterName: row.inviter_name,
  };
};

/**
 * Get all invites created by a user
 */
export const findByCreator = async (createdBy: string): Promise<Invite[]> => {
  const result = await pool.query(
    `SELECT * FROM invites 
     WHERE created_by = $1 
     ORDER BY created_at DESC`,
    [createdBy]
  );
  
  return result.rows.map(mapToInvite);
};

/**
 * Get pending invites count for a user
 */
export const countPendingByCreator = async (createdBy: string): Promise<number> => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM invites 
     WHERE created_by = $1 AND status = 'pending' AND expires_at > NOW()`,
    [createdBy]
  );
  
  return parseInt(result.rows[0].count, 10);
};

/**
 * Get used invites count for a user
 */
export const countUsedByCreator = async (createdBy: string): Promise<number> => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM invites 
     WHERE created_by = $1 AND status = 'used'`,
    [createdBy]
  );
  
  return parseInt(result.rows[0].count, 10);
};

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Mark invite as used
 */
export const markAsUsed = async (token: string, userId: string): Promise<Invite | null> => {
  const result = await pool.query(
    `UPDATE invites 
     SET status = 'used', 
         used_by = $2, 
         used_at = NOW()
     WHERE token = $1 
     AND status = 'pending' 
     AND expires_at > NOW()
     RETURNING *`,
    [token, userId]
  );
  
  return result.rows.length > 0 ? mapToInvite(result.rows[0]) : null;
};

/**
 * Revoke an invite
 */
export const revoke = async (inviteId: string, createdBy: string): Promise<Invite | null> => {
  const result = await pool.query(
    `UPDATE invites 
     SET status = 'revoked'
     WHERE id = $1 
     AND created_by = $2 
     AND status = 'pending'
     RETURNING *`,
    [inviteId, createdBy]
  );
  
  return result.rows.length > 0 ? mapToInvite(result.rows[0]) : null;
};

/**
 * Revoke any invite (admin only)
 */
export const revokeAsAdmin = async (inviteId: string): Promise<Invite | null> => {
  const result = await pool.query(
    `UPDATE invites 
     SET status = 'revoked'
     WHERE id = $1 
     AND status = 'pending'
     RETURNING *`,
    [inviteId]
  );
  
  return result.rows.length > 0 ? mapToInvite(result.rows[0]) : null;
};

// ============================================================================
// CLEANUP OPERATIONS
// ============================================================================

/**
 * Mark expired invites as expired
 */
export const markExpired = async (): Promise<number> => {
  const result = await pool.query(
    `UPDATE invites 
     SET status = 'expired'
     WHERE status = 'pending' 
     AND expires_at <= NOW()`
  );
  
  return result.rowCount || 0;
};

// ============================================================================
// ANALYTICS OPERATIONS
// ============================================================================

/**
 * Get invite analytics
 */
export const getAnalytics = async (): Promise<{
  total: number;
  used: number;
  pending: number;
  expired: number;
  revoked: number;
}> => {
  const result = await pool.query(
    `SELECT 
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'used') as used,
       COUNT(*) FILTER (WHERE status = 'pending') as pending,
       COUNT(*) FILTER (WHERE status = 'expired') as expired,
       COUNT(*) FILTER (WHERE status = 'revoked') as revoked
     FROM invites`
  );
  
  return result.rows[0];
};

/**
 * Get user invite analytics (for admin)
 */
export const getUserAnalytics = async (): Promise<Array<{
  userId: string;
  userName: string;
  invitesSent: number;
  invitesAccepted: number;
}>> => {
  const result = await pool.query(
    `SELECT 
       u.id as user_id,
       u.first_name || ' ' || u.last_name as user_name,
       COUNT(i.id) as invites_sent,
       COUNT(i.id) FILTER (WHERE i.status = 'used') as invites_accepted
     FROM users u
     LEFT JOIN invites i ON i.created_by = u.id
     GROUP BY u.id, u.first_name, u.last_name
     ORDER BY invites_sent DESC`
  );
  
  return result.rows.map(row => ({
    userId: row.user_id,
    userName: row.user_name,
    invitesSent: parseInt(row.invites_sent, 10),
    invitesAccepted: parseInt(row.invites_accepted, 10),
  }));
};

// ============================================================================
// MAPPER
// ============================================================================

const mapToInvite = (row: any): Invite => ({
  id: row.id,
  token: row.token,
  createdBy: row.created_by,
  usedBy: row.used_by,
  status: row.status as InviteStatus,
  expiresAt: row.expires_at,
  createdAt: row.created_at,
  usedAt: row.used_at,
});
