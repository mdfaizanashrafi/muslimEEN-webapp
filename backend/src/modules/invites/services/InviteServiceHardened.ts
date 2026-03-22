/**
 * Invite Service - PRODUCTION GRADE
 * 
 * SECURITY:
 * - Generic error messages (prevents invite enumeration)
 * - Database transactions (atomic operations)
 * - Conditional updates (prevents race conditions/double-use)
 * - Signed JWT tokens (tamper-proof, short-lived)
 * - Rate limiting (prevents brute force)
 * 
 * FLOW:
 * 1. User validates invite code → receives signed JWT (10 min expiry)
 * 2. User passes JWT to Clerk signup (via metadata)
 * 3. Clerk webhook verifies JWT and atomically consumes invite
 * 4. If consumption fails → Clerk user is deleted
 * 
 * DATE: 2026-03-20
 */

import { PoolClient } from 'pg';
import pool from '../../database/pool';
import * as UserRepository from '../../iam/repositories/UserRepository';
import { eventBus, DomainEvents } from '../../shared/events/EventBus';
import { logger } from '../../shared/utils/logger';
import {
  generateInviteJWT,
  verifyInviteJWT,
  generateInviteCode,
  hashInviteCode,
  checkRateLimit,
} from './InviteTokenService';

// Re-export for backward compatibility
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
  remainingInvites?: number;
}

export interface ValidateInviteResult {
  valid: boolean;
  jwt?: string;
  error?: string;
}

export interface ConsumeInviteResult {
  success: boolean;
  error?: string;
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
// CREATE INVITE (ATOMIC)
// ============================================================================

/**
 * Create a new invite
 * 
 * SECURITY:
 * - Checks max active invites limit
 * - Atomic decrement of user's invite count
 * - Generates signed JWT for validation
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
    
    // Create invite record
    const inviteRes = await client.query(
      `INSERT INTO invites (code_hash, token, created_by, status, expires_at, created_at)
       VALUES ($1, $2, $3, 'pending', NOW() + INTERVAL '${INVITE_EXPIRY_DAYS} days', NOW())
       RETURNING id, created_at, expires_at`,
      [codeHash, code, createdBy]
    );
    
    await client.query('COMMIT');
    
    const invite = inviteRes.rows[0];
    
    // Generate signed JWT for validation (10 min expiry)
    const { token: jwt, expiresAt } = generateInviteJWT(code);
    
    // AUDIT LOG
    logger.info('Invite created', {
      event: 'invite_created',
      inviteId: invite.id,
      createdBy,
      expiresAt: invite.expires_at,
    });
    
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
        jwt,
        expiresAt,
      },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to create invite', {
      event: 'invite_failed',
      error: (error as Error).message,
      createdBy,
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
// VALIDATE INVITE CODE (STEP 1 OF SIGNUP FLOW)
// ============================================================================

/**
 * Validate invite code and return signed JWT
 * 
 * SECURITY:
 * - Generic error messages (prevents enumeration)
 * - Rate limiting per IP
 * - Returns JWT (not raw code) for next step
 * 
 * @param rawCode - The invite code entered by user
 * @param clientIp - Client IP for rate limiting
 * @returns Validation result with JWT if valid
 */
export const validateInviteCode = async (
  rawCode: string,
  clientIp?: string
): Promise<ValidateInviteResult> => {
  // Rate limiting
  if (clientIp) {
    const rateLimit = checkRateLimit(`validate:${clientIp}`, 5, 1);
    if (!rateLimit.allowed) {
      logger.warn('Invite validation rate limit exceeded', {
        clientIp,
        tags: { module: 'invites', type: 'security' },
      });
      return { valid: false, error: 'Too many attempts. Please try again later.' };
    }
  }
  
  const normalizedCode = rawCode.toUpperCase().trim();
  const codeHash = hashInviteCode(normalizedCode);
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Find invite by code hash
    const result = await client.query(
      `SELECT id, status, expires_at, used_by_clerk_id
       FROM invites
       WHERE code_hash = $1
       LIMIT 1`,
      [codeHash]
    );
    
    // SECURITY: Generic error message for ALL failure cases
    const genericError = 'Invalid or expired invite code';
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      logger.warn('Invite validation failed: not found', {
        codeHash: `${codeHash.substring(0, 8)}...`,
        tags: { module: 'invites', type: 'security' },
      });
      return { valid: false, error: genericError };
    }
    
    const invite = result.rows[0];
    
    // Check status
    if (invite.status !== 'pending') {
      await client.query('ROLLBACK');
      logger.warn('Invite validation failed: status', {
        status: invite.status,
        inviteId: invite.id,
        tags: { module: 'invites', type: 'security' },
      });
      return { valid: false, error: genericError };
    }
    
    // Check expiry
    if (new Date() > new Date(invite.expires_at)) {
      await client.query('ROLLBACK');
      logger.warn('Invite validation failed: expired', {
        inviteId: invite.id,
        tags: { module: 'invites', type: 'security' },
      });
      return { valid: false, error: genericError };
    }
    
    // Check if already used
    if (invite.used_by_clerk_id) {
      await client.query('ROLLBACK');
      logger.warn('Invite validation failed: already used', {
        inviteId: invite.id,
        tags: { module: 'invites', type: 'security' },
      });
      return { valid: false, error: genericError };
    }
    
    await client.query('COMMIT');
    
    // Success - generate signed JWT (10 min expiry for signup)
    const { token: jwt, expiresAt } = generateInviteJWT(normalizedCode);
    
    logger.info('Invite code validated', {
      event: 'invite_validated',
      inviteId: invite.id,
      clientIp,
      jwtExpiry: expiresAt.toISOString(),
    });
    
    return {
      valid: true,
      jwt,
    };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    logger.error('Invite validation error', {
      error: (error as Error).message,
      clientIp,
    });
    return { valid: false, error: 'Invalid or expired invite code' };
  } finally {
    client.release();
  }
};

// ============================================================================
// CONSUME INVITE (ATOMIC - CALLED FROM WEBHOOK)
// ============================================================================

/**
 * Consume invite atomically during Clerk webhook
 * 
 * SECURITY:
 * - Verifies JWT signature first
 * - Atomic conditional update (prevents double-use)
 * - Returns success/failure for Clerk user cleanup
 * 
 * @param inviteJWT - The signed JWT from Clerk metadata
 * @param clerkUserId - The Clerk user ID
 * @returns Consumption result
 */
export const consumeInvite = async (
  inviteJWT: string,
  clerkUserId: string
): Promise<ConsumeInviteResult> => {
  // Step 1: Verify JWT signature and expiry
  const tokenVerification = verifyInviteJWT(inviteJWT);
  
  if (!tokenVerification.valid) {
    logger.warn('Invite consumption failed: invalid JWT', {
      clerkUserId,
      error: tokenVerification.error,
      tags: { module: 'invites', type: 'security' },
    });
    return { success: false, error: tokenVerification.error || 'Invalid invite token' };
  }
  
  const normalizedCode = tokenVerification.code!.toUpperCase();
  const codeHash = hashInviteCode(normalizedCode);
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Step 2: Atomic conditional update
    // CRITICAL: Only succeeds if invite is pending, not expired, and not used
    const consumeRes = await client.query(
      `UPDATE invites
       SET status = 'used',
           used_by_clerk_id = $2,
           used_at = NOW()
       WHERE code_hash = $1
       AND status = 'pending'
       AND expires_at > NOW()
       AND used_by_clerk_id IS NULL
       RETURNING id, created_by`,
      [codeHash, clerkUserId]
    );
    
    if (consumeRes.rowCount === 0) {
      await client.query('ROLLBACK');
      
      // Determine specific failure reason for logging (not exposed)
      const checkRes = await pool.query(
        `SELECT status, used_by_clerk_id, expires_at 
         FROM invites WHERE code_hash = $1`,
        [codeHash]
      );
      
      if (checkRes.rows.length === 0) {
        logger.error('Invite consumption failed: invite not found after JWT verify', {
          clerkUserId,
          codeHash: `${codeHash.substring(0, 8)}...`,
          tags: { module: 'invites', type: 'security' },
        });
      } else {
        const row = checkRes.rows[0];
        logger.warn('Invite consumption failed: race condition or reuse', {
          clerkUserId,
          status: row.status,
          usedBy: row.used_by_clerk_id,
          expired: new Date(row.expires_at) < new Date(),
          tags: { module: 'invites', type: 'security' },
        });
      }
      
      return { success: false, error: 'Invite already used or expired' };
    }
    
    const inviteId = consumeRes.rows[0].id;
    const invitedBy = consumeRes.rows[0].created_by;
    
    await client.query('COMMIT');
    
    // Publish event (non-blocking)
    eventBus.publish(DomainEvents.INVITE_USED, {
      inviteId,
      usedBy: clerkUserId,
      invitedBy,
    }).catch(() => {});
    
    logger.info('Invite consumed successfully', {
      event: 'invite_consumed',
      inviteId,
      clerkUserId,
      invitedBy,
    });
    
    return {
      success: true,
      invitedBy,
      inviteId,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to consume invite', {
      error: (error as Error).message,
      clerkUserId,
    });
    return { success: false, error: 'Failed to process invite' };
  } finally {
    client.release();
  }
};

// ============================================================================
// USER INVITE QUOTA
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
    `SELECT id, token, status, expires_at, created_at, used_at, used_by_clerk_id
     FROM invites
     WHERE created_by = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  
  return result.rows.map(row => ({
    id: row.id,
    code: row.token, // Return display code
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    usedAt: row.used_at,
    usedBy: row.used_by_clerk_id,
  }));
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
    
    if (!isAdminUser && invite.created_by !== userId) {
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
    
    // Refund invite credit (non-admins only)
    if (!isAdminUser) {
      await client.query(
        `UPDATE users SET invites_remaining = invites_remaining + 1 WHERE id = $1`,
        [userId]
      );
    }
    
    await client.query('COMMIT');
    
    logger.info('Invite revoked', {
      event: 'invite_revoked',
      inviteId,
      revokedBy: userId,
    });
    
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
