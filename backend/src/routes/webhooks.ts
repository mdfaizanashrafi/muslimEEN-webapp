/**
 * Webhook Routes
 * 
 * Handles external webhook callbacks including:
 * - Clerk user lifecycle webhooks
 * - Payment provider webhooks (future)
 * 
 * SECURITY: These endpoints use signature verification, not JWT auth.
 * They must be registered BEFORE the Clerk authentication middleware.
 * 
 * DATE: 2026-03-20
 */

import { Router } from 'express';
import { raw } from '../modules/shared/middleware/bodyParser';
import { handleClerkWebhook } from '../modules/iam/controllers/ClerkWebhookController';

const router = Router();

// ============================================================================
// CLERK WEBHOOKS
// ============================================================================

/**
 * POST /webhooks/clerk
 * 
 * Receives Clerk webhook events:
 * - user.created: Creates internal user, validates invite, marks invite as used
 * - user.updated: Syncs user data changes
 * - user.deleted: Marks user as deleted in our DB
 * - session.created: Updates last login timestamp
 * 
 * SECURITY: Verifies Svix signature. Never processes unverified webhooks.
 */
router.post(
  '/clerk',
  raw({ type: 'application/json' }), // Raw body needed for signature verification
  handleClerkWebhook
);

export default router;
