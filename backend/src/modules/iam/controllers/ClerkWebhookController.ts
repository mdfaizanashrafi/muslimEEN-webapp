/**
 * Clerk Webhook Controller - WITH RETRY & FAILURE TOLERANCE
 * 
 * CRITICAL: Handles Clerk user lifecycle events with automatic retry.
 * This is where we ENFORCE invite-only signup on the backend.
 * 
 * SECURITY: Never trust the frontend - always verify invites here.
 * 
 * RESILIENCE FEATURES:
 * - Automatic retry with exponential backoff (3 attempts)
 * - Failed event queue for manual recovery
 * - Comprehensive logging and metrics
 * - No silent failures
 * 
 * DATE: 2026-03-20
 * UPDATED: 2026-03-20 (Added retry logic)
 */

import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { env } from '../../../config/env';
import * as UserRepository from '../repositories/UserRepository';
import * as InviteService from '../../invites/services/InviteService';
import { logger } from '../../shared/utils/logger';
import { criticalLog } from '../../shared/utils/logSampler';
import { 
  executeWithRetry, 
  failedEventQueue, 
  getWebhookHealth,
  WebhookEvent,
  retryFailedEvent,
} from '../services/WebhookRetryService';
import { recordAuthError } from './AuthHealthController';

// ============================================================================
// WEBHOOK VERIFICATION
// ============================================================================

/**
 * Verify Clerk webhook signature
 */
const verifyWebhook = (payload: string, headers: any): any => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('CLERK_WEBHOOK_SECRET not configured');
  }

  const wh = new Webhook(webhookSecret);
  return wh.verify(payload, headers);
};

// ============================================================================
// EVENT HANDLERS (Wrapped for Retry)
// ============================================================================

/**
 * Handle user.created event with retry wrapper
 * 
 * CRITICAL: This enforces invite-only signup.
 * If the user doesn't have a valid invite, we delete the Clerk account.
 */
const handleUserCreated = async (event: WebhookEvent): Promise<void> => {
  const { data } = event;
  const { id: clerkId, email_addresses, first_name, last_name } = data;
  
  const primaryEmail = email_addresses?.[0]?.email_address;
  const firstName = first_name || '';
  const lastName = last_name || '';
  
  logger.info('Processing user.created', { 
    tags: { module: 'auth', type: 'webhook', subtype: 'user.created' },
    eventId: event.id, 
    clerkId, 
    email: primaryEmail,
    attempt: event.attempt,
  });

  // Get invite code from unsafe metadata (set by frontend)
  const inviteCode = data.unsafe_metadata?.inviteCode;
  
  if (!inviteCode) {
    criticalLog('error', 'Signup attempted without invite code', 'security_violation', {
      tags: { module: 'auth', type: 'security' },
      eventId: event.id,
      clerkId, 
      email: primaryEmail,
    });
    
    // CRITICAL: Delete the Clerk user - they didn't have an invite
    await deleteClerkUser(clerkId);
    
    throw new Error('INVITE_REQUIRED: Signup without invite code is not allowed');
  }

  // Validate the invite code
  const validation = await InviteService.validateInvite(inviteCode);
  
  if (!validation.valid) {
    criticalLog('error', 'Invalid invite code used for signup', 'security_violation', {
      tags: { module: 'auth', type: 'security' },
      eventId: event.id,
      clerkId, 
      email: primaryEmail, 
      inviteCode,
      reason: validation.message,
    });
    
    // CRITICAL: Delete the Clerk user - invalid invite
    await deleteClerkUser(clerkId);
    
    throw new Error(`INVALID_INVITE: ${validation.message}`);
  }

  logger.info('Invite validated successfully', { 
    tags: { module: 'auth', type: 'webhook', subtype: 'invite_validated' },
    eventId: event.id,
    clerkId, 
    inviteCode,
    inviteId: validation.invite?.id,
  });

  // Check if email matches invite (if invite has pre-assigned email)
  if (validation.invite?.inviteeEmail && validation.invite.inviteeEmail !== primaryEmail) {
    criticalLog('error', 'Email does not match invite', 'security_violation', {
      tags: { module: 'auth', type: 'security' },
      eventId: event.id,
      clerkId, 
      email: primaryEmail, 
      expectedEmail: validation.invite.inviteeEmail,
    });
    
    await deleteClerkUser(clerkId);
    throw new Error('EMAIL_MISMATCH: This invite is for a different email address');
  }

  try {
    // Create user in our database
    const newUser = await UserRepository.create({
      email: primaryEmail,
      passwordHash: 'CLERK_MANAGED',
      firstName,
      lastName,
      role: 'muslim_unverified',
      verificationTier: 'basic',
    });

    // Link Clerk ID to our user
    await UserRepository.updateClerkId(newUser.id, clerkId);
    logger.info('Created user and linked Clerk ID', { 
      tags: { module: 'auth', type: 'webhook', subtype: 'user_created' },
      eventId: event.id,
      userId: newUser.id, 
      clerkId,
    });
    
    // Mark invite as used
    const useResult = await InviteService.useInvite({
      token: inviteCode,
      userId: newUser.id,
      userEmail: primaryEmail,
    });

    if (!useResult.success) {
      // Record error for health monitoring
      recordAuthError(
        `Failed to mark invite as used: ${useResult.message}`,
        'invite_mark_failed'
      );
      
      logger.error('Failed to mark invite as used', { 
        tags: { module: 'auth', type: 'webhook', subtype: 'invite_mark_failed' },
        eventId: event.id,
        clerkId, 
        userId: newUser.id, 
        inviteCode,
        error: useResult.message,
      });
    } else {
      logger.info('Invite marked as used', { 
        tags: { module: 'auth', type: 'webhook', subtype: 'invite_used' },
        eventId: event.id,
        clerkId, 
        userId: newUser.id, 
        inviteCode,
      });
    }

    // Update last login
    await UserRepository.updateLastLogin(newUser.id);

  } catch (error: any) {
    // Record error for health monitoring
    recordAuthError(
      `Failed to create user in database: ${error.message}`,
      'user_creation_failed'
    );
    
    logger.error('Failed to create user in database', { 
      tags: { module: 'auth', type: 'webhook', subtype: 'user_creation_failed' },
      eventId: event.id,
      clerkId, 
      email: primaryEmail, 
      error: error.message,
    });
    
    // Clean up - delete the Clerk user since we couldn't create our user
    await deleteClerkUser(clerkId);
    
    throw error;
  }
};

/**
 * Handle user.updated event with retry wrapper
 */
const handleUserUpdated = async (event: WebhookEvent): Promise<void> => {
  const { data } = event;
  const { id: clerkId, email_addresses, first_name, last_name } = data;
  
  const primaryEmail = email_addresses?.[0]?.email_address;
  const firstName = first_name || '';
  const lastName = last_name || '';
  
  logger.info('Processing user.updated', { 
    tags: { module: 'auth', type: 'webhook', subtype: 'user.updated' },
    eventId: event.id,
    clerkId, 
    email: primaryEmail,
    attempt: event.attempt,
  });

  // Find user by Clerk ID
  const user = await UserRepository.findByClerkId(clerkId);
  
  if (!user) {
    logger.warn('User not found for update', { 
      tags: { module: 'auth', type: 'webhook', subtype: 'user_not_found' },
      eventId: event.id,
      clerkId,
    });
    return;
  }

  if (user.email !== primaryEmail || user.firstName !== firstName || user.lastName !== lastName) {
    logger.info('User profile updated from Clerk', { 
      tags: { module: 'auth', type: 'webhook', subtype: 'profile_updated' },
      eventId: event.id,
      userId: user.id, 
      clerkId,
    });
  }
};

/**
 * Handle user.deleted event with retry wrapper
 */
const handleUserDeleted = async (event: WebhookEvent): Promise<void> => {
  const { data } = event;
  const { id: clerkId } = data;
  
  logger.info('Processing user.deleted', { 
    tags: { module: 'auth', type: 'webhook', subtype: 'user.deleted' },
    eventId: event.id,
    clerkId,
    attempt: event.attempt,
  });

  const user = await UserRepository.findByClerkId(clerkId);
  
  if (!user) {
    logger.warn('User not found for deletion', { 
      tags: { module: 'auth', type: 'webhook', subtype: 'user_not_found' },
      eventId: event.id,
      clerkId,
    });
    return;
  }

  await UserRepository.updateRole(user.id, 'deleted' as any);
  
  logger.info('User marked as deleted', { 
    tags: { module: 'auth', type: 'webhook', subtype: 'user_soft_deleted' },
    eventId: event.id,
    userId: user.id, 
    clerkId,
  });
};

/**
 * Handle session.created event with retry wrapper
 */
const handleSessionCreated = async (event: WebhookEvent): Promise<void> => {
  const { data } = event;
  const { user_id: clerkId } = data;
  
  const user = await UserRepository.findByClerkId(clerkId);
  
  if (user) {
    await UserRepository.updateLastLogin(user.id);
    logger.debug('Updated last login', { 
      tags: { module: 'auth', type: 'webhook', subtype: 'session_created' },
      eventId: event.id,
      userId: user.id, 
      clerkId,
    });
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Delete a user from Clerk
 */
const deleteClerkUser = async (clerkId: string): Promise<void> => {
  try {
    const { clerkClient } = await import('@clerk/clerk-sdk-node');
    await clerkClient.users.deleteUser(clerkId);
    logger.info('Deleted Clerk user', { 
      tags: { module: 'auth', type: 'webhook', subtype: 'clerk_cleanup' },
      clerkId,
    });
  } catch (error: any) {
    logger.error('Failed to delete Clerk user', { 
      tags: { module: 'auth', type: 'webhook', subtype: 'cleanup_failed' },
      clerkId, 
      error: error.message,
    });
  }
};

/**
 * Get event handler based on type
 */
const getEventHandler = (eventType: string): ((event: WebhookEvent) => Promise<void>) | null => {
  switch (eventType) {
    case 'user.created':
      return handleUserCreated;
    case 'user.updated':
      return handleUserUpdated;
    case 'user.deleted':
      return handleUserDeleted;
    case 'session.created':
      return handleSessionCreated;
    default:
      return null;
  }
};

// ============================================================================
// MAIN WEBHOOK HANDLER (With Retry)
// ============================================================================

/**
 * Main Clerk webhook handler with failure tolerance
 * 
 * SECURITY NOTES:
 * - Always verifies webhook signature
 * - Never trusts frontend data
 * - Enforces invite-only signup
 * - Handles all Clerk user lifecycle events
 * - Retries failed events automatically
 * - Tracks metrics for observability
 */
export const handleClerkWebhook = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    // Get the raw body and headers
    const payload = JSON.stringify(req.body);
    const headers = {
      'svix-id': req.headers['svix-id'] as string,
      'svix-timestamp': req.headers['svix-timestamp'] as string,
      'svix-signature': req.headers['svix-signature'] as string,
    };

    // Verify webhook signature
    let evt: any;
    try {
      evt = verifyWebhook(payload, headers);
    } catch (err: any) {
      logger.error('Webhook signature verification failed', { 
        tags: { module: 'auth', type: 'security', subtype: 'invalid_signature' },
        error: err.message,
      });
      res.status(401).json({ 
        success: false,
        error: 'Invalid webhook signature' 
      });
      return;
    }

    const eventType = evt.type;
    const eventId = evt.id;
    
    logger.info('Received Clerk webhook', { 
      tags: { module: 'auth', type: 'webhook', subtype: 'received' },
      eventType, 
      eventId,
      timestamp: new Date().toISOString(),
    });

    // Get the appropriate handler
    const handler = getEventHandler(eventType);
    
    if (!handler) {
      // Unhandled event type - acknowledge but log
      logger.debug('Unhandled webhook event type', { 
        tags: { module: 'auth', type: 'webhook', subtype: 'unhandled' },
        eventType, 
        eventId,
      });
      res.json({ 
        success: true, 
        message: `Event type '${eventType}' not handled` 
      });
      return;
    }

    // Execute with retry logic
    const webhookEvent: WebhookEvent = {
      id: eventId,
      type: eventType,
      data: evt.data,
      timestamp: new Date(),
      attempt: 1,
    };

    const result = await executeWithRetry(webhookEvent, handler);

    const duration = Date.now() - startTime;
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: `Processed ${eventType}`,
        eventId,
        durationMs: duration,
      });
    } else {
      // Event failed and is queued for retry
      logger.error('Webhook processing failed, queued for retry', {
        tags: { module: 'auth', type: 'webhook', subtype: 'queued_for_retry' },
        eventId,
        eventType,
        error: result.finalError,
        durationMs: duration,
      });
      
      // Return 200 to prevent Clerk from retrying (we handle retries)
      res.status(200).json({ 
        success: false, 
        message: 'Event queued for retry',
        eventId,
        error: result.finalError,
      });
    }
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Record error for health monitoring
    recordAuthError(
      `Webhook processing failed: ${error.message}`,
      'webhook_processing_error'
    );
    
    logger.error('Unexpected webhook error', { 
      tags: { module: 'auth', type: 'webhook', subtype: 'unexpected_error' },
      error: error.message,
      stack: error.stack,
      durationMs: duration,
    });
    
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

// ============================================================================
// ADMIN ENDPOINTS (for monitoring and recovery)
// ============================================================================

/**
 * GET /admin/webhooks/health
 * Get webhook health status
 */
export const getWebhookHealthEndpoint = (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: getWebhookHealth(),
  });
};

/**
 * GET /admin/webhooks/failed
 * Get list of failed events
 */
export const getFailedEventsEndpoint = (req: Request, res: Response): void => {
  const events = failedEventQueue.getAll();
  
  res.json({
    success: true,
    data: {
      count: events.length,
      events: events.map(fe => ({
        id: fe.event.id,
        type: fe.event.type,
        failedAt: fe.failedAt,
        retryCount: fe.retryCount,
        error: fe.error.substring(0, 200), // Truncate long errors
      })),
    },
  });
};

/**
 * POST /admin/webhooks/retry/:eventId
 * Manually retry a failed event
 */
export const retryFailedEventEndpoint = async (req: Request, res: Response): Promise<void> => {
  const { eventId } = req.params;
  
  logger.info('Manual webhook retry requested', { 
    tags: { module: 'auth', type: 'webhook', subtype: 'manual_retry' },
    eventId, 
    by: (req as any).user?.id,
  });
  
  // Get the failed event
  const failedEvent = failedEventQueue.getByEventId(eventId);
  
  if (!failedEvent) {
    res.status(404).json({
      success: false,
      error: 'Failed event not found',
    });
    return;
  }
  
  // Get handler and retry
  const handler = getEventHandler(failedEvent.event.type);
  
  if (!handler) {
    res.status(400).json({
      success: false,
      error: `No handler for event type: ${failedEvent.event.type}`,
    });
    return;
  }
  
  const success = await retryFailedEvent(eventId, handler);
  
  if (success) {
    res.json({
      success: true,
      message: 'Event retried successfully',
      eventId,
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'Retry failed, event still in failed queue',
      eventId,
    });
  }
};

export default handleClerkWebhook;
