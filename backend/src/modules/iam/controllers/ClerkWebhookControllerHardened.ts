/**
 * Clerk Webhook Controller - PRODUCTION GRADE
 * 
 * SECURITY CRITICAL: This is the ENFORCEMENT POINT for invite-only signup.
 * 
 * FLOW:
 * 1. Clerk sends webhook on user.created
 * 2. Verify webhook signature (prevent spoofing)
 * 3. Extract invite JWT from user metadata
 * 4. Verify JWT (signature, expiry)
 * 5. Atomically consume invite
 * 6. Create internal user record
 * 7. If ANY step fails → delete Clerk user
 * 
 * DATE: 2026-03-20
 */

import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { env } from '../../../config/env';
import { logger } from '../../shared/utils/logger';
import * as InviteService from '../../invites/services/InviteServiceHardened';
import * as UserRepository from '../repositories/UserRepository';
import pool from '../../database/pool';
import { eventBus, DomainEvents } from '../../shared/events/EventBus';
import { UserRole, VerificationTier } from '../../shared/types';

// ============================================================================
// WEBHOOK VERIFICATION
// ============================================================================

/**
 * Verify Clerk webhook signature
 * CRITICAL: Prevents webhook spoofing attacks
 */
const verifyWebhook = (req: Request): { valid: boolean; payload?: any; error?: string } => {
  try {
    const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET;
    
    if (!WEBHOOK_SECRET) {
      logger.error('CLERK_WEBHOOK_SECRET not configured');
      return { valid: false, error: 'Webhook secret not configured' };
    }
    
    const headers = req.headers;
    const payload = req.body;
    
    // Svix headers
    const svix_id = headers['svix-id'] as string;
    const svix_timestamp = headers['svix-timestamp'] as string;
    const svix_signature = headers['svix-signature'] as string;
    
    if (!svix_id || !svix_timestamp || !svix_signature) {
      logger.warn('Missing Svix headers', {
        headers: Object.keys(headers),
        tags: { module: 'webhooks', type: 'security' },
      });
      return { valid: false, error: 'Missing webhook headers' };
    }
    
    // Verify with Svix
    const wh = new Webhook(WEBHOOK_SECRET);
    const verified = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
    
    return { valid: true, payload: verified };
  } catch (error) {
    logger.error('Webhook verification failed', {
      error: (error as Error).message,
      tags: { module: 'webhooks', type: 'security' },
    });
    return { valid: false, error: 'Invalid webhook signature' };
  }
};

// ============================================================================
// CLERK USER MANAGEMENT
// ============================================================================

/**
 * Delete a Clerk user (cleanup on failure)
 * Used when invite validation fails to enforce invite-only policy
 */
const deleteClerkUser = async (clerkUserId: string): Promise<boolean> => {
  try {
    const { createClerkClient } = await import('@clerk/backend');
    const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
    
    await clerk.users.deleteUser(clerkUserId);
    
    logger.warn('Deleted Clerk user due to invite validation failure', {
      clerkUserId,
      tags: { module: 'webhooks', type: 'security' },
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to delete Clerk user', {
      clerkUserId,
      error: (error as Error).message,
      tags: { module: 'webhooks', type: 'error' },
    });
    return false;
  }
};

/**
 * Update Clerk user metadata (mark as validated)
 */
const markUserAsValidated = async (clerkUserId: string, inviteId: string): Promise<void> => {
  try {
    const { createClerkClient } = await import('@clerk/backend');
    const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
    
    await clerk.users.updateUser(clerkUserId, {
      publicMetadata: {
        inviteValidated: true,
        inviteId,
        validatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to update Clerk user metadata', {
      clerkUserId,
      error: (error as Error).message,
    });
  }
};

// ============================================================================
// WEBHOOK HANDLERS
// ============================================================================

/**
 * Handle user.created event
 * CRITICAL: This is the enforcement point for invite-only signup
 */
const handleUserCreated = async (payload: any): Promise<{ success: boolean; error?: string }> => {
  const clerkUserId = payload.data?.id;
  const email = payload.data?.email_addresses?.[0]?.email_address;
  const firstName = payload.data?.first_name;
  const lastName = payload.data?.last_name;
  const inviteJWT = payload.data?.unsafe_metadata?.inviteToken;
  
  logger.info('Processing user.created webhook', {
    clerkUserId,
    email,
    hasInviteToken: !!inviteJWT,
  });
  
  // Step 1: Verify invite token exists
  if (!inviteJWT) {
    logger.error('No invite token in user metadata', {
      clerkUserId,
      email,
      tags: { module: 'webhooks', type: 'security' },
    });
    
    // Delete the Clerk user - enforce invite-only policy
    await deleteClerkUser(clerkUserId);
    return { success: false, error: 'No invite token provided' };
  }
  
  // Step 2: Consume invite atomically
  const consumeResult = await InviteService.consumeInvite(inviteJWT, clerkUserId);
  
  if (!consumeResult.success) {
    logger.error('Invite consumption failed', {
      clerkUserId,
      email,
      error: consumeResult.error,
      tags: { module: 'webhooks', type: 'security' },
    });
    
    // Delete the Clerk user - enforce invite-only policy
    await deleteClerkUser(clerkUserId);
    return { success: false, error: consumeResult.error };
  }
  
  // Step 3: Create internal user record
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if user already exists (idempotency)
    const existingUser = await UserRepository.findByClerkId(clerkUserId);
    if (existingUser) {
      logger.warn('User already exists in database', {
        clerkUserId,
        userId: existingUser.id,
      });
      await client.query('COMMIT');
      return { success: true };
    }
    
    // Create new user
    const newUser = await UserRepository.createWithClient(client, {
      clerk_id: clerkUserId,
      email: email || '',
      firstName: firstName || '',
      lastName: lastName || '',
      role: 'muslim_unverified' as UserRole,
      verificationTier: 'basic' as VerificationTier,
      invitedBy: consumeResult.invitedBy,
      invitesRemaining: 3, // New users get 3 invites
    });
    
    await client.query('COMMIT');
    
    // Step 4: Mark Clerk user as validated
    await markUserAsValidated(clerkUserId, consumeResult.inviteId!);
    
    // Publish event
    eventBus.publish(DomainEvents.USER_REGISTERED, {
      userId: newUser.id,
      clerkId: clerkUserId,
      email,
      invitedBy: consumeResult.invitedBy,
    }).catch(() => {});
    
    logger.info('User created successfully with invite', {
      event: 'user_created',
      clerkUserId,
      userId: newUser.id,
      inviteId: consumeResult.inviteId,
      invitedBy: consumeResult.invitedBy,
    });
    
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    
    logger.error('Failed to create internal user', {
      clerkUserId,
      error: (error as Error).message,
    });
    
    // Attempt to clean up Clerk user
    await deleteClerkUser(clerkUserId);
    
    return { success: false, error: 'Failed to create user record' };
  } finally {
    client.release();
  }
};

/**
 * Handle user.updated event
 */
const handleUserUpdated = async (payload: any): Promise<void> => {
  const clerkUserId = payload.data?.id;
  const email = payload.data?.email_addresses?.[0]?.email_address;
  const firstName = payload.data?.first_name;
  const lastName = payload.data?.last_name;
  
  // Update internal user record
  const user = await UserRepository.findByClerkId(clerkUserId);
  
  if (user) {
    await UserRepository.update(user.id, {
      email: email || user.email,
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
    });
    
    logger.info('User updated', {
      event: 'user_updated',
      clerkUserId,
      userId: user.id,
    });
  }
};

/**
 * Handle user.deleted event
 */
const handleUserDeleted = async (payload: any): Promise<void> => {
  const clerkUserId = payload.data?.id;
  
  const user = await UserRepository.findByClerkId(clerkUserId);
  
  if (user) {
    // Soft delete - mark as inactive
    await UserRepository.update(user.id, { isActive: false });
    
    logger.info('User marked as inactive', {
      event: 'user_deleted',
      clerkUserId,
      userId: user.id,
    });
  }
};

// ============================================================================
// MAIN WEBHOOK HANDLER
// ============================================================================

/**
 * POST /webhooks/clerk
 * Main Clerk webhook endpoint
 */
export const handleClerkWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    // Step 1: Verify webhook signature
    const verification = verifyWebhook(req);
    
    if (!verification.valid) {
      logger.warn('Webhook verification failed', {
        error: verification.error,
        tags: { module: 'webhooks', type: 'security' },
      });
      res.status(401).json({ success: false, error: verification.error });
      return;
    }
    
    const payload = verification.payload;
    const eventType = payload.type;
    
    logger.debug('Webhook received', {
      eventType,
      timestamp: new Date().toISOString(),
    });
    
    // Step 2: Route to appropriate handler
    switch (eventType) {
      case 'user.created': {
        const result = await handleUserCreated(payload);
        if (result.success) {
          res.json({ success: true, message: 'User processed successfully' });
        } else {
          // Return 200 to prevent Clerk retries (user was already deleted)
          res.status(200).json({ 
            success: false, 
            error: result.error,
            message: 'User rejected and deleted due to invite validation failure'
          });
        }
        break;
      }
        
      case 'user.updated':
        await handleUserUpdated(payload);
        res.json({ success: true });
        break;
        
      case 'user.deleted':
        await handleUserDeleted(payload);
        res.json({ success: true });
        break;
        
      default:
        logger.debug('Unhandled webhook event', { eventType });
        res.json({ success: true, message: 'Event not handled' });
    }
  } catch (error) {
    logger.error('Webhook processing error', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ============================================================================
// ADMIN ENDPOINTS (for monitoring)
// ============================================================================

/**
 * GET /admin/webhooks/health
 * Webhook health status
 */
export const getWebhookHealthEndpoint = (req: Request, res: Response): void => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    webhookSecret: env.CLERK_WEBHOOK_SECRET ? 'configured' : 'missing',
  });
};

/**
 * GET /admin/webhooks/failed
 * Get failed webhook events (placeholder for future queue implementation)
 */
export const getFailedEventsEndpoint = (req: Request, res: Response): void => {
  res.json({
    failedEvents: [],
    message: 'Webhook retry queue not yet implemented',
  });
};

/**
 * POST /admin/webhooks/retry/:eventId
 * Retry a failed webhook event
 */
export const retryFailedEventEndpoint = (req: Request, res: Response): void => {
  res.status(501).json({
    success: false,
    error: 'Webhook retry not yet implemented',
  });
};
