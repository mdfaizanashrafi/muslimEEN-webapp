/**
 * Invites Module Routes - ELITE PRODUCTION GRADE
 * 
 * Invitation management endpoints
 * 
 * DATE: 2026-03-21
 */

import { Router } from 'express';
import * as InviteController from './controllers/InviteControllerHardened';
import { clerkAuthenticate, requireRole } from '../iam/middleware/clerkAuth';
import { authLimiter, userLimiter } from '../shared/middleware/rateLimiter';
import { preventNoSqlInjection, sanitizeInput } from '../shared/middleware/sanitization';
import { auditLog, AUDIT_ACTIONS } from '../shared/middleware/auditLogger';

const router = Router();

// ============================================================================
// PUBLIC ENDPOINTS
// ============================================================================

/**
 * POST /invites/validate
 * Validate invite code and get JWT (for Clerk signup)
 */
router.post(
  '/validate',
  authLimiter,
  preventNoSqlInjection,
  sanitizeInput,
  InviteController.validateInvite
);

// ============================================================================
// PROTECTED ENDPOINTS
// ============================================================================

router.use(clerkAuthenticate);

/**
 * GET /invites
 * Get user's invites
 */
router.get('/', userLimiter, InviteController.getUserInvites);

/**
 * GET /invites/quota
 * Get user's invite quota
 */
router.get('/quota', userLimiter, InviteController.getUserInviteQuota);

/**
 * POST /invites
 * Create new invite
 */
router.post(
  '/',
  userLimiter,
  preventNoSqlInjection,
  sanitizeInput,
  auditLog(AUDIT_ACTIONS.INVITE_CREATE, 'invite'),
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
  auditLog(AUDIT_ACTIONS.INVITE_REVOKE, 'invite'),
  InviteController.revokeInvite
);

export default router;
