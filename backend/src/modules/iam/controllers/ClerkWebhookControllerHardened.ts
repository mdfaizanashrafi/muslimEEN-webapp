/**
 * Clerk Webhook Controller - HARDENED VERSION (FIXED)
 * 
 * CRITICAL FIXES APPLIED:
 * 1. NO password_hash (Clerk-only auth)
 * 2. NO early consumeInvite - validate first, consume later
 * 3. NO fake 'PENDING' user IDs
 * 4. CORRECT transaction order: verify → validate → create → consume → commit
 * 5. HANDLE NULL inviter (genesis invite)
 * 6. ATOMIC operations with proper ROLLBACK
 * 
 * SECURITY: This is the FINAL GATE for invite-only signup.
 */

import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { env } from '../../../config/env';
import pool from '../../database/pool';
import { verifySignedToken } from '../../invites/services/InviteTokenService';
import * as InviteRepository from '../../invites/repositories/InviteRepository';
import { logger } from '../../shared/utils/logger';
import { criticalLog } from '../../shared/utils/logSampler';

// ============================================================================
// WEBHOOK VERIFICATION
// ============================================================================

const verifyWebhook = (payload: string, headers: any): any => {
  const webhookSecret = env.CLERK_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('CLERK_WEBHOOK_SECRET not configured');
  }
  
  const wh = new Webhook(webhookSecret);
  return wh.verify(payload, headers);
};

// ============================================================================
// USER CREATED HANDLER - CORRECTED FLOW
// ============================================================================

/**
 * Handle user.created event - FIXED VERSION
 * 
 * CORRECT ORDER:
 * 1. Extract & verify signed token
 * 2. Validate invite (read-only, NO mutation)
 * 3. BEGIN TRANSACTION
 * 4. Create user (NO password_hash)
 * 5. Set invited_by (can be NULL for genesis)
 * 6. Consume invite (UPDATE by token, used_by IS NULL)
 * 7. COMMIT
 */
const handleUserCreated = async (event: any): Promise<void> => {
  const { data } = event;
  const { id: clerkId, email_addresses, first_name, last_name } = data;
  
  const primaryEmail = email_addresses?.[0]?.email_address;
  const firstName = first_name || '';
  const lastName = last_name || '';
  
  logger.info('Processing user.created', {
    eventId: event.id,
    clerkId,
    email: primaryEmail,
    tags: { module: 'auth', type: 'webhook' },
  });
  
  // ==========================================================================
  // STEP 1: Extract signed invite token
  // ==========================================================================
  
  const signedToken = data.unsafe_metadata?.inviteToken;
  
  if (!signedToken) {
    criticalLog('error', 'Signup attempted without invite token', 'security_violation', {
      clerkId,
      email: primaryEmail,
      tags: { module: 'auth', type: 'security' },
    });
    
    throw new WebhookError('INVITE_REQUIRED', 'Invite token required', 400);
  }
  
  // ==========================================================================
  // STEP 2: Verify token signature and extract code
  // ==========================================================================
  
  const tokenVerification = verifySignedToken(signedToken);
  
  if (!tokenVerification.valid) {
    criticalLog('error', 'Invalid invite token signature', 'security_violation', {
      clerkId,
      email: primaryEmail,
      reason: tokenVerification.error,
      tags: { module: 'auth', type: 'security' },
    });
    
    throw new WebhookError('INVALID_INVITE', 'Invalid invite token', 400);
  }
  
  const inviteCode = tokenVerification.code!;
  
  // ==========================================================================
  // STEP 3: Validate invite (READ-ONLY, no mutation)
  // ==========================================================================
  
  const invite = await InviteRepository.findByToken(inviteCode);
  
  if (!invite) {
    criticalLog('error', 'Invite not found', 'security_violation', {
      clerkId,
      email: primaryEmail,
      inviteCode,
      tags: { module: 'auth', type: 'security' },
    });
    throw new WebhookError('INVALID_INVITE', 'Invalid or expired invite', 400);
  }
  
  // Check status
  if (invite.status !== 'pending') {
    criticalLog('error', 'Invite already used or revoked', 'security_violation', {
      clerkId,
      email: primaryEmail,
      inviteId: invite.id,
      status: invite.status,
      tags: { module: 'auth', type: 'security' },
    });
    throw new WebhookError('INVALID_INVITE', 'Invalid or expired invite', 400);
  }
  
  // Check expiry
  if (new Date() > new Date(invite.expiresAt)) {
    criticalLog('error', 'Invite expired', 'security_violation', {
      clerkId,
      email: primaryEmail,
      inviteId: invite.id,
      tags: { module: 'auth', type: 'security' },
    });
    throw new WebhookError('INVALID_INVITE', 'Invalid or expired invite', 400);
  }
  
  // Check if already used
  if (invite.usedBy) {
    criticalLog('error', 'Invite already consumed', 'security_violation', {
      clerkId,
      email: primaryEmail,
      inviteId: invite.id,
      usedBy: invite.usedBy,
      tags: { module: 'auth', type: 'security' },
    });
    throw new WebhookError('INVALID_INVITE', 'Invalid or expired invite', 400);
  }
  
  // Get inviter (can be NULL for genesis invite)
  const invitedBy = invite.createdBy || null;
  
  logger.info('Invite validated successfully', {
    eventId: event.id,
    clerkId,
    inviteId: invite.id,
    invitedBy,
    tags: { module: 'auth', type: 'webhook' },
  });
  
  // ==========================================================================
  // STEP 4: Begin transaction - ALL DB operations must be atomic
  // ==========================================================================
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // ========================================================================
    // STEP 5: Create user (NO password_hash - Clerk manages auth)
    // ========================================================================
    
    const createUserResult = await client.query(
      `INSERT INTO users (
        email,
        first_name,
        last_name,
        role,
        verification_tier,
        invited_by,
        invites_remaining,
        clerk_id,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id`,
      [
        primaryEmail.toLowerCase(),
        firstName,
        lastName,
        'muslim_unverified',
        'basic',
        invitedBy,              // Can be NULL for genesis invite
        3,                      // Initial invites
        clerkId,
      ]
    );
    
    const userId = createUserResult.rows[0].id;
    
    logger.info('User record created', {
      userId,
      clerkId,
      invitedBy,
      tags: { module: 'auth', type: 'webhook' },
    });
    
    // ========================================================================
    // STEP 6: Consume invite (CORRECTED QUERY)
    // Use invite.id or token for precise targeting
    // ========================================================================
    
    const consumeResult = await client.query(
      `UPDATE invites
       SET 
         status = 'used',
         used_by = $1,
         used_at = NOW()
       WHERE id = $2
         AND status = 'pending'
         AND used_by IS NULL
       RETURNING id`,
      [userId, invite.id]
    );
    
    // CRITICAL: Check if exactly one row was updated
    if (consumeResult.rowCount === 0) {
      // Invite was consumed by another request (race condition)
      await client.query('ROLLBACK');
      
      criticalLog('error', 'Race condition: Invite already consumed', 'security_violation', {
        clerkId,
        email: primaryEmail,
        inviteId: invite.id,
        tags: { module: 'auth', type: 'security' },
      });
      
      throw new WebhookError('INVITE_ALREADY_USED', 'Invalid or expired invite', 400);
    }
    
    if (consumeResult.rowCount > 1) {
      // This should never happen with proper WHERE clause, but safety check
      await client.query('ROLLBACK');
      
      criticalLog('error', 'CRITICAL: Multiple invites updated', 'security_violation', {
        clerkId,
        email: primaryEmail,
        inviteId: invite.id,
        rowCount: consumeResult.rowCount,
        tags: { module: 'auth', type: 'security' },
      });
      
      throw new WebhookError('INTERNAL_ERROR', 'Internal server error', 500);
    }
    
    logger.info('Invite consumed successfully', {
      userId,
      inviteId: invite.id,
      tags: { module: 'auth', type: 'webhook' },
    });
    
    // ========================================================================
    // STEP 7: Commit transaction
    // ========================================================================
    
    await client.query('COMMIT');
    
    logger.info('User signup completed successfully', {
      userId,
      clerkId,
      invitedBy,
      inviteId: invite.id,
      tags: { module: 'auth', type: 'success' },
    });
    
  } catch (error) {
    // Rollback on ANY error
    await client.query('ROLLBACK');
    
    // If it's already a WebhookError, just re-throw
    if (error instanceof WebhookError) {
      throw error;
    }
    
    // Log unexpected errors
    logger.error('Transaction failed during user creation', {
      error: (error as Error).message,
      stack: (error as Error).stack,
      clerkId,
      email: primaryEmail,
      tags: { module: 'auth', type: 'error' },
    });
    
    throw new WebhookError('INTERNAL_ERROR', 'Failed to create user', 500);
  } finally {
    client.release();
  }
};

// ============================================================================
// MAIN WEBHOOK HANDLER
// ============================================================================

export const handleClerkWebhook = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    // Verify webhook signature
    const payload = JSON.stringify(req.body);
    const headers = {
      'svix-id': req.headers['svix-id'] as string,
      'svix-timestamp': req.headers['svix-timestamp'] as string,
      'svix-signature': req.headers['svix-signature'] as string,
    };
    
    let evt: any;
    try {
      evt = verifyWebhook(payload, headers);
    } catch (err) {
      logger.error('Webhook signature verification failed', {
        error: (err as Error).message,
        tags: { module: 'auth', type: 'security' },
      });
      res.status(401).json({ success: false, error: 'Invalid signature' });
      return;
    }
    
    const eventType = evt.type;
    
    logger.info('Received Clerk webhook', {
      eventType,
      eventId: evt.id,
      tags: { module: 'auth', type: 'webhook' },
    });
    
    // Handle events
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt);
        break;
        
      case 'user.updated':
        // Handle updates if needed
        break;
        
      case 'user.deleted':
        // Handle deletion if needed
        break;
        
      default:
        // Unhandled event
        break;
    }
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      eventType,
      durationMs: duration,
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof WebhookError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    } else {
      logger.error('Unexpected webhook error', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        tags: { module: 'auth', type: 'error' },
      });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

// ============================================================================
// CUSTOM ERROR CLASS
// ============================================================================

class WebhookError extends Error {
  public code: string;
  public statusCode: number;
  
  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'WebhookError';
  }
}

export default handleClerkWebhook;
