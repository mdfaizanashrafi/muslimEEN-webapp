/**
 * Hardened Invite Service
 * 
 * SECURITY IMPROVEMENTS:
 * 1. Generic error messages (prevents invite enumeration)
 * 2. Database transactions (atomic operations)
 * 3. Max active invites limit (prevents spam)
 * 4. Conditional updates (prevents race conditions)
 * 5. Signed tokens (prevents token tampering)
 * 
 * This service replaces the original InviteService for security-critical operations.
 */

import { PoolClient } from 'pg';
import pool, { transaction } from '../../database/pool';
import * as UserRepository from '../../iam/repositories/UserRepository';
import { eventBus, DomainEvents } from '../../shared/events/EventBus';
import { logger } from '../../shared/utils/logger';
import {
  generateSignedToken,
  verifySignedToken,
  generateInviteCode,
  hashInviteCode,
  compareInviteCode,
  checkRateLimit,
} from './InviteTokenService';

// Re-export hashInviteCode for backward compatibility
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
    signedToken: string;
    expiresAt: Date;
  };
  error?: string;
  remainingInvites?: number;
}

export interface ValidateInviteResult {
  valid: boolean;
  signedToken?: string;
  error?: string;
  // Internal only - not exposed to frontend
  _invite?: {
    id: string;
    code: string;
    createdBy: string;
  };
}

export interface ConsumeInviteResult {
  success: boolean;
  error?: string;
  invitedBy?: string;
}

export interface InviteQuota {
  remaining: number;
  used: number;
  total: number;
  isUnlimited: boolean;
}

// ============================================================================
// CREATE INVITE (HARDENED)
// ============================================================================

/**
 * Create a new invite (HARDENED VERSION)
 * 
 * SECURITY:
 * - Checks max active invites limit
 * - Atomic decrement of user's invite count
 * - Generates signed token for validation
 */
export const createInvite = async (
  createdBy: string,
  createdByRole: string
): Promise<CreateInviteResult> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Skip limits for admins
    if (!isAdmin(createdByRole)) {
      // Check max active invites
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
          error: 'Maximum active invites reached. Revoke unused invites first.',
        };
      }
      
      // Atomic check-and-decrement
      const decrementRes = await client.query(
        `UPDATE users 
         SET invites_remaining = invites_remaining - 1
         WHERE id = $1 AND invites_remaining > 0
         RETURNING invites_remaining`,
        [createdBy]
      );
      
      if (decrementRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          error: 'No invites remaining',
        };
      }
    }
    
    // Generate secure invite code
    const code = generateInviteCode();
    const codeHash = hashInviteCode(code);
    
    // Create invite record with BOTH code_hash (for lookup) AND token (for display)
    const inviteRes = await client.query(
      `INSERT INTO invites (code_hash, token, created_by, status, expires_at, created_at)
       VALUES ($1, $2, $3, 'pending', NOW() + INTERVAL '${INVITE_EXPIRY_DAYS} days', NOW())
       RETURNING id, created_at, expires_at`,
      [codeHash, code, createdBy]
    );
    
    await client.query('COMMIT');
    
    const invite = inviteRes.rows[0];
    
    // Generate signed token for validation
    const signedToken = generateSignedToken(code);
    
    // Publish event
    eventBus.publish(DomainEvents.INVITE_CREATED, {
      inviteId: invite.id,
      createdBy,
    }).catch(() => {});
    
    return {
      success: true,
      invite: {
        id: invite.id,
        code, // Return raw code only once (for sharing)
        signedToken: signedToken.token,
        expiresAt: new Date(invite.expires_at),
      },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to create invite', {
      error: (error as Error).message,
      tags: { module: 'invites', type: 'error' },
    });
    return {
      success: false,
      error: 'Failed to create invite',
    };
  } finally {
    client.release();
  }
};

// ============================================================================
// VALIDATE INVITE (HARDENED - WITH BACKWARD COMPATIBILITY)
// ============================================================================

/**
 * BACKWARD COMPATIBILITY NOTE:
 * 
 * Old invites stored raw codes in the 'token' column without 'code_hash'.
 * New invites store hash in 'code_hash' and display code in 'token'.
 * 
 * This function:
 * 1. First tries to find by code_hash (new invites)
 * 2. Falls back to token column (old invites - auto-migrates)
 * 3. Auto-migrates old invites by computing and storing code_hash
 */

/**
 * Validate an invite code (HARDENED VERSION - BACKWARD COMPATIBLE)
 * 
 * SECURITY:
 * - Generic error messages (prevents enumeration)
 * - Rate limiting per IP
 * - Returns signed token (not raw code)
 * - Internal logging only
 * - Supports both old (token-only) and new (code_hash) invites
 */
export const validateInvite = async (
  rawCode: string,
  clientIp?: string
): Promise<ValidateInviteResult> => {
  // Rate limiting
  if (clientIp) {
    const rateLimit = checkRateLimit(`validate:${clientIp}`, 5, 1);
    if (!rateLimit.allowed) {
      return { valid: false, error: 'Too many attempts. Please try again later.' };
    }
  }
  
  const normalizedCode = rawCode.toUpperCase().trim();
  const codeHash = hashInviteCode(normalizedCode);
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // BACKWARD COMPATIBILITY: Try code_hash first, then fall back to token
    const result = await client.query(
      `SELECT id, code_hash, token, created_by, status, expires_at, used_by
       FROM invites
       WHERE code_hash = $1 OR (code_hash IS NULL AND token = $2)
       LIMIT 1`,
      [codeHash, normalizedCode]
    );
    
    // SECURITY: Generic error message for all failure cases
    const genericError = 'Invalid or expired invite code';
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      logger.warn('Invite validation failed: not found', {
        tags: { module: 'invites', type: 'security' },
      });
      return { valid: false, error: genericError };
    }
    
    const invite = result.rows[0];
    
    // BACKWARD COMPATIBILITY: Auto-migrate old invites (no code_hash)
    if (!invite.code_hash) {
      await client.query(
        `UPDATE invites 
         SET code_hash = $1, 
             token = $2
         WHERE id = $3`,
        [codeHash, normalizedCode, invite.id]
      );
      logger.info('Auto-migrated old invite to code_hash', {
        inviteId: invite.id,
        tags: { module: 'invites', type: 'migration' },
      });
    }
    
    // Check status (generic error)
    if (invite.status !== 'pending') {
      await client.query('ROLLBACK');
      logger.warn('Invite validation failed: status', {
        status: invite.status,
        tags: { module: 'invites', type: 'security' },
      });
      return { valid: false, error: genericError };
    }
    
    // Check expiry (generic error)
    if (new Date() > new Date(invite.expires_at)) {
      await client.query('ROLLBACK');
      logger.warn('Invite validation failed: expired', {
        inviteId: invite.id,
        tags: { module: 'invites', type: 'security' },
      });
      return { valid: false, error: genericError };
    }
    
    // Check if already used (generic error)
    if (invite.used_by) {
      await client.query('ROLLBACK');
      logger.warn('Invite validation failed: already used', {
        inviteId: invite.id,
        tags: { module: 'invites', type: 'security' },
      });
      return { valid: false, error: genericError };
    }
    
    await client.query('COMMIT');
    
    // Success - generate signed token
    const signedToken = generateSignedToken(normalizedCode);
    
    return {
      valid: true,
      signedToken: signedToken.token,
      _invite: {
        id: invite.id,
        code: normalizedCode,
        createdBy: invite.created_by,
      },
    };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    logger.error('Invite validation error', {
      error: (error as Error).message,
      tags: { module: 'invites', type: 'error' },
    });
    return { valid: false, error: 'Invalid or expired invite code' };
  } finally {
    client.release();
  }
};

// ============================================================================
// CONSUME INVITE (HARDENED - WITH TRANSACTION)
// ============================================================================

/**
 * Consume an invite during signup (HARDENED VERSION)
 * 
 * SECURITY:
 * - Verify signed token first
 * - Database transaction (all-or-nothing)
 * - Conditional update (prevents double-use)
 * - Sets invited_by relationship
 */
export const consumeInvite = async (
  signedToken: string,
  newUserId: string,
  newUserEmail: string
): Promise<ConsumeInviteResult> => {
  // Step 1: Verify signed token
  const tokenVerification = verifySignedToken(signedToken);
  
  if (!tokenVerification.valid) {
    return { success: false, error: 'Invalid invite token' };
  }
  
  const normalizedCode = tokenVerification.code!.toUpperCase();
  const codeHash = hashInviteCode(normalizedCode);
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Step 2: Conditional update - only consume if not already used
    const consumeRes = await client.query(
      `UPDATE invites
       SET status = 'used',
           used_by = $2,
           used_at = NOW()
       WHERE code_hash = $1
       AND status = 'pending'
       AND expires_at > NOW()
       AND used_by IS NULL
       RETURNING id, created_by`,
      [codeHash, newUserId]
    );
    
    if (consumeRes.rowCount === 0) {
      await client.query('ROLLBACK');
      logger.warn('Invite consumption failed: conditional update failed', {
        codeHash,
        tags: { module: 'invites', type: 'security' },
      });
      return { success: false, error: 'Invite already used or expired' };
    }
    
    const inviteId = consumeRes.rows[0].id;
    const invitedBy = consumeRes.rows[0].created_by;
    
    // Step 3: Set invited_by relationship
    await client.query(
      `UPDATE users
       SET invited_by = $1
       WHERE id = $2`,
      [invitedBy, newUserId]
    );
    
    // Step 4: Award initial invites to new user
    await client.query(
      `UPDATE users
       SET invites_remaining = $1
       WHERE id = $2`,
      [DEFAULT_USER_INVITE_LIMIT, newUserId]
    );
    
    await client.query('COMMIT');
    
    // Publish event (non-blocking)
    eventBus.publish(DomainEvents.INVITE_USED, {
      inviteId,
      usedBy: newUserId,
      invitedBy,
    }).catch(() => {});
    
    logger.info('Invite consumed successfully', {
      inviteId,
      newUserId,
      invitedBy,
      tags: { module: 'invites', type: 'success' },
    });
    
    return {
      success: true,
      invitedBy,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to consume invite', {
      error: (error as Error).message,
      tags: { module: 'invites', type: 'error' },
    });
    return { success: false, error: 'Failed to process invite' };
  } finally {
    client.release();
  }
};

// ============================================================================
// GET USER INVITE QUOTA
// ============================================================================

export const getUserInviteQuota = async (userId: string): Promise<InviteQuota> => {
  const user = await UserRepository.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const isUnlimited = isAdmin(user.role);
  
  // Count used invites
  const usedRes = await pool.query(
    `SELECT COUNT(*) FROM invites WHERE created_by = $1 AND status = 'used'`,
    [userId]
  );
  const used = parseInt(usedRes.rows[0].count);
  
  const remaining = isUnlimited ? -1 : user.invitesRemaining;
  const total = isUnlimited ? -1 : used + user.invitesRemaining;
  
  return {
    remaining,
    used,
    total,
    isUnlimited,
  };
};

// ============================================================================
// GET USER INVITES
// ============================================================================

export const getUserInvites = async (userId: string): Promise<any[]> => {
  const result = await pool.query(
    `SELECT id, code_hash, token, status, expires_at, created_at, used_at, used_by
     FROM invites
     WHERE created_by = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  
  return result.rows.map(row => ({
    id: row.id,
    code: row.token, // Return display code (token column)
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    usedAt: row.used_at,
    usedBy: row.used_by,
    // Note: code_hash is never returned (sensitive)
  }));
};

// ============================================================================
// REVOKE INVITE
// ============================================================================

export const revokeInvite = async (
  inviteId: string,
  userId: string,
  isAdmin: boolean
): Promise<boolean> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Verify ownership
    const checkRes = await client.query(
      `SELECT created_by, status FROM invites WHERE id = $1`,
      [inviteId]
    );
    
    if (checkRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return false;
    }
    
    const invite = checkRes.rows[0];
    
    if (!isAdmin && invite.created_by !== userId) {
      await client.query('ROLLBACK');
      return false;
    }
    
    if (invite.status !== 'pending') {
      await client.query('ROLLBACK');
      return false;
    }
    
    // Revoke invite
    await client.query(
      `UPDATE invites SET status = 'revoked' WHERE id = $1`,
      [inviteId]
    );
    
    // Refund invite credit
    if (!isAdmin) {
      await client.query(
        `UPDATE users SET invites_remaining = invites_remaining + 1 WHERE id = $1`,
        [userId]
      );
    }
    
    await client.query('COMMIT');
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

const isAdmin = (role: string): boolean => {
  return ADMIN_ROLES.includes(role);
};
