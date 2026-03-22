/**
 * Invite Service - ELITE PRODUCTION GRADE
 * 
 * FEATURES:
 * - Atomic invite consumption (no race conditions)
 * - Full observability (metrics + structured logs)
 * - Safe failure handling (idempotent)
 * - Rate limiting (prevents brute force)
 * 
 * DATE: 2026-03-21
 */

import { PoolClient } from 'pg';
import pool from '../../database/pool';
import * as UserRepository from '../../iam/repositories/UserRepository';
import { logger } from '../../shared/utils/logger';
import { recordMetric, Metrics } from '../../shared/utils/metrics';
import {
  generateInviteJWT,
  verifyInviteJWT,
  generateInviteCode,
  hashInviteCode,
  checkRateLimit,
} from './InviteTokenService';

// Re-exports
export { hashInviteCode };

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_USER_INVITE_LIMIT = 3;
const MAX_ACTIVE_INVITES_PER_USER = 5;
const INVITE_EXPIRY_DAYS = 7;
const ADMIN_ROLES = ['admin', 'super_admin'];

// ============================================================================
// TYPES
// ============================================================================

export interface CreateInviteResult {
  success: boolean;
  invite?: {
    id: string;
    code: string;
    jwt: string;
    expiresAt: Date;
  };
  error?: string;
}

export interface ValidateInviteResult {
  valid: boolean;
  jwt?: string;
  error?: string;
}

export interface ConsumeInviteResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  invitedBy?: string;
  inviteId?: string;
}

export interface InviteQuota {
  remaining: number;
  used: number;
  total: number;
  isUnlimited: boolean;
}

// ============================================================================
// CREATE INVITE
// ============================================================================

export const createInvite = async (
  createdBy: string,
  createdByRole: string
): Promise<CreateInviteResult> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check limits for non-admins
    if (!isAdmin(createdByRole)) {
      const activeCountRes = await client.query(
        `SELECT COUNT(*) FROM invites 
         WHERE created_by = $1 
         AND status = 'pending' 
         AND expires_at > NOW()`,
        [createdBy]
      );
      const activeCount = parseInt(activeCountRes.rows[0].count);
      
      if (activeCount >= MAX_ACTIVE_INVITES_PER_USER) {
        await client.query('ROLLBACK');
        return {
          success: false,
          error: 'Maximum active invites reached',
        };
      }
      
      // Atomic decrement
      const decrementRes = await client.query(
        `UPDATE users 
         SET invites_remaining = invites_remaining - 1
         WHERE id = $1 AND invites_remaining > 0
         RETURNING invites_remaining`,
        [createdBy]
      );
      
      if (decrementRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return { success: false, error: 'No invites remaining' };
      }
    }
    
    // Generate invite
    const code = generateInviteCode();
    const codeHash = hashInviteCode(code);
    
    const inviteRes = await client.query(
      `INSERT INTO invites (code_hash, token, created_by, status, expires_at, created_at)
       VALUES ($1, $2, $3, 'pending', NOW() + INTERVAL '${INVITE_EXPIRY_DAYS} days', NOW())
       RETURNING id, created_at, expires_at`,
      [codeHash, code, createdBy]
    );
    
    await client.query('COMMIT');
    
    const invite = inviteRes.rows[0];
    const { token: jwt, expiresAt } = generateInviteJWT(code);
    
    logger.info('INVITE_CREATED', {
      inviteId: invite.id,
      createdBy,
      codeHash: `${codeHash.substring(0, 8)}...`,
    });
    
    await recordMetric(Metrics.INVITE_VALIDATION_SUCCESS);
    
    return {
      success: true,
      invite: {
        id: invite.id,
        code,
        jwt,
        expiresAt,
      },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('INVITE_CREATE_FAILED', { error: (error as Error).message, createdBy });
    return { success: false, error: 'Failed to create invite' };
  } finally {
    client.release();
  }
};

// ============================================================================
// VALIDATE INVITE (STEP 1: Frontend gets JWT)
// ============================================================================

export const validateInviteCode = async (
  rawCode: string,
  clientIp?: string
): Promise<ValidateInviteResult> => {
  await recordMetric(Metrics.INVITE_VALIDATION_ATTEMPT, 1, { ip: clientIp || 'unknown' });
  
  // Rate limiting
  if (clientIp) {
    const rateLimit = checkRateLimit(`validate:${clientIp}`, 5, 1);
    if (!rateLimit.allowed) {
      await recordMetric(Metrics.RATE_LIMIT_HIT, 1, { ip: clientIp });
      logger.warn('RATE_LIMIT_EXCEEDED', { clientIp, type: 'invite_validation' });
      return { valid: false, error: 'Too many attempts. Please try again later.' };
    }
  }
  
  const normalizedCode = rawCode.toUpperCase().trim();
  const codeHash = hashInviteCode(normalizedCode);
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      `SELECT id, status, expires_at, used_by_clerk_id
       FROM invites
       WHERE code_hash = $1
       LIMIT 1`,
      [codeHash]
    );
    
    const genericError = 'Invalid or expired invite code';
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      await recordMetric(Metrics.INVITE_VALIDATION_FAILURE, 1, { reason: 'not_found' });
      logger.info('INVITE_NOT_FOUND', { codeHash: `${codeHash.substring(0, 8)}...` });
      return { valid: false, error: genericError };
    }
    
    const invite = result.rows[0];
    
    if (invite.status !== 'pending') {
      await client.query('ROLLBACK');
      await recordMetric(Metrics.INVITE_VALIDATION_FAILURE, 1, { reason: 'status', status: invite.status });
      return { valid: false, error: genericError };
    }
    
    if (new Date() > new Date(invite.expires_at)) {
      await client.query('ROLLBACK');
      await recordMetric(Metrics.INVITE_VALIDATION_FAILURE, 1, { reason: 'expired' });
      return { valid: false, error: genericError };
    }
    
    if (invite.used_by_clerk_id) {
      await client.query('ROLLBACK');
      await recordMetric(Metrics.INVITE_VALIDATION_FAILURE, 1, { reason: 'already_used' });
      return { valid: false, error: genericError };
    }
    
    await client.query('COMMIT');
    
    const { token: jwt, expiresAt } = generateInviteJWT(normalizedCode);
    
    await recordMetric(Metrics.INVITE_VALIDATION_SUCCESS);
    logger.info('INVITE_VALIDATION_SUCCESS', {
      inviteId: invite.id,
      clientIp,
      jwtExpiry: expiresAt.toISOString(),
    });
    
    return { valid: true, jwt };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    logger.error('INVITE_VALIDATION_ERROR', { error: (error as Error).message, clientIp });
    return { valid: false, error: 'Invalid or expired invite code' };
  } finally {
    client.release();
  }
};

// ============================================================================
// CONSUME INVITE (STEP 2: Webhook atomic consumption)
// ============================================================================

export const consumeInvite = async (
  inviteJWT: string,
  clerkUserId: string
): Promise<ConsumeInviteResult> => {
  // Step 1: Verify JWT
  const tokenVerification = verifyInviteJWT(inviteJWT);
  
  if (!tokenVerification.valid) {
    await recordMetric(Metrics.INVITE_CONSUMPTION_FAILED, 1, { 
      reason: tokenVerification.error,
      clerkUserId: clerkUserId.substring(0, 8) + '...'
    });
    logger.warn('INVITE_JWT_INVALID', {
      clerkUserId,
      error: tokenVerification.error,
    });
    return { 
      success: false, 
      error: tokenVerification.error || 'Invalid invite token',
      errorCode: 'INVALID_TOKEN'
    };
  }
  
  const normalizedCode = tokenVerification.code!.toUpperCase();
  const codeHash = hashInviteCode(normalizedCode);
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Step 2: Atomic consumption using database function
    const consumeRes = await client.query(
      `SELECT * FROM consume_invite_elite($1, $2)`,
      [codeHash, clerkUserId]
    );
    
    const { p_invite_id, p_created_by, p_success, p_error_code } = consumeRes.rows[0];
    
    if (!p_success) {
      await client.query('ROLLBACK');
      await recordMetric(Metrics.INVITE_CONSUMPTION_FAILED, 1, { 
        reason: p_error_code,
        clerkUserId: clerkUserId.substring(0, 8) + '...'
      });
      logger.warn('INVITE_CONSUMPTION_FAILED', {
        clerkUserId,
        errorCode: p_error_code,
        codeHash: `${codeHash.substring(0, 8)}...`,
      });
      return { 
        success: false, 
        error: 'Invite already used or expired',
        errorCode: p_error_code
      };
    }
    
    await client.query('COMMIT');
    
    await recordMetric(Metrics.INVITE_CONSUMED);
    logger.info('INVITE_CONSUMED', {
      inviteId: p_invite_id,
      clerkUserId,
      invitedBy: p_created_by,
    });
    
    return {
      success: true,
      invitedBy: p_created_by,
      inviteId: p_invite_id,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('INVITE_CONSUMPTION_ERROR', {
      error: (error as Error).message,
      clerkUserId,
    });
    return { 
      success: false, 
      error: 'Failed to process invite',
      errorCode: 'SYSTEM_ERROR'
    };
  } finally {
    client.release();
  }
};

// ============================================================================
// GET USER INVITES
// ============================================================================

export const getUserInvites = async (userId: string): Promise<any[]> => {
  const result = await pool.query(
    `SELECT id, token, status, expires_at, created_at, used_at, used_by_clerk_id
     FROM invites
     WHERE created_by = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  
  return result.rows.map(row => ({
    id: row.id,
    code: row.token,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    usedAt: row.used_at,
    usedBy: row.used_by_clerk_id,
  }));
};

// ============================================================================
// GET USER QUOTA
// ============================================================================

export const getUserInviteQuota = async (userId: string): Promise<InviteQuota> => {
  const user = await UserRepository.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const isUnlimited = isAdmin(user.role);
  
  const usedRes = await pool.query(
    `SELECT COUNT(*) FROM invites WHERE created_by = $1 AND status = 'used'`,
    [userId]
  );
  const used = parseInt(usedRes.rows[0].count);
  
  return {
    remaining: isUnlimited ? -1 : user.invitesRemaining,
    used,
    total: isUnlimited ? -1 : used + user.invitesRemaining,
    isUnlimited,
  };
};

// ============================================================================
// REVOKE INVITE
// ============================================================================

export const revokeInvite = async (
  inviteId: string,
  userId: string,
  isAdminUser: boolean
): Promise<boolean> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const checkRes = await client.query(
      `SELECT created_by, status FROM invites WHERE id = $1`,
      [inviteId]
    );
    
    if (checkRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return false;
    }
    
    const invite = checkRes.rows[0];
    
    if (!isAdminUser && invite.created_by !== userId) {
      await client.query('ROLLBACK');
      return false;
    }
    
    if (invite.status !== 'pending') {
      await client.query('ROLLBACK');
      return false;
    }
    
    await client.query(
      `UPDATE invites SET status = 'revoked' WHERE id = $1`,
      [inviteId]
    );
    
    if (!isAdminUser) {
      await client.query(
        `UPDATE users SET invites_remaining = invites_remaining + 1 WHERE id = $1`,
        [userId]
      );
    }
    
    await client.query('COMMIT');
    
    logger.info('INVITE_REVOKED', { inviteId, revokedBy: userId });
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// ============================================================================
// HELPERS
// ============================================================================

const isAdmin = (role: string): boolean => ADMIN_ROLES.includes(role);
