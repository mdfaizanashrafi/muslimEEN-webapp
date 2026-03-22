/**
 * Invites Module Routes - HARDENED VERSION
 * 
 * SECURITY:
 * - Rate limiting on all sensitive endpoints
 * - Authentication required for user operations
 * - Input validation middleware
 */

import { Router } from 'express';
import * as InviteController from './controllers/InviteControllerHardened';
import { clerkAuthenticate, requireRole } from '../iam/middleware/clerkAuth';
import {
  inviteValidationLimiter,
  inviteCreationLimiter,
  userLimiter,
} from '../shared/middleware/rateLimiter';
import { preventNoSqlInjection, sanitizeInput } from '../shared/middleware/sanitization';

const router = Router();

// ============================================================================
// PUBLIC ENDPOINTS (With Rate Limiting)
// ============================================================================

/**
 * POST /invites/validate
 * Validate invite code and get signed token
 * Rate limited: 5 per minute per IP
 */
router.post(
  '/validate',
  inviteValidationLimiter,
  preventNoSqlInjection,
  sanitizeInput,
  InviteController.validateInvite
);

// ============================================================================
// PROTECTED ENDPOINTS (Authentication Required)
// ============================================================================

router.use(clerkAuthenticate);

/**
 * GET /invites
 * Get user's invites
 */
router.get(
  '/',
  userLimiter,
  InviteController.getUserInvites
);

/**
 * GET /invites/quota
 * Get user's invite quota
 */
router.get(
  '/quota',
  userLimiter,
  InviteController.getUserInviteQuota
);

/**
 * POST /invites
 * Create new invite
 * Rate limited: 10 per minute per user
 */
router.post(
  '/',
  inviteCreationLimiter,
  preventNoSqlInjection,
  sanitizeInput,
  InviteController.createInvite
);

/**
 * DELETE /invites/:id
 * Revoke an invite
 */
router.delete(
  '/:id',
  userLimiter,
  preventNoSqlInjection,
  InviteController.revokeInvite
);

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

// Admin invite creation (unlimited)
// router.post('/admin', requireAdmin, ...);

export default router;
