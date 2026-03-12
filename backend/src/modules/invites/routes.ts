/**
 * Invites Module Routes
 * Invitation management endpoints
 */

import { Router } from 'express';
import { InviteController } from './controllers/InviteController';
import { authenticate, requireAdmin } from '../iam/middleware/auth';
import { authLimiter, userLimiter } from '../shared/middleware/rateLimiter';
import { csrfValidator } from '../shared/middleware/csrf';
import { preventNoSqlInjection, sanitizeInput } from '../shared/middleware/sanitization';
import { auditLog, AUDIT_ACTIONS } from '../shared/middleware/auditLogger';

const router = Router();

// Public invite validation
router.get('/validate/:token', authLimiter, InviteController.validateInvite);

// Protected routes - require authentication
router.use(authenticate);

// User invite management
router.get('/', userLimiter, InviteController.getUserInvites);
router.get('/quota', userLimiter, InviteController.getUserInviteQuota);
router.post(
  '/',
  userLimiter,
  csrfValidator,
  preventNoSqlInjection,
  sanitizeInput,
  auditLog(AUDIT_ACTIONS.INVITE_CREATE, 'invite'),
  InviteController.createInvite
);
router.delete(
  '/:id',
  userLimiter,
  csrfValidator,
  preventNoSqlInjection,
  auditLog(AUDIT_ACTIONS.INVITE_REVOKE, 'invite'),
  InviteController.revokeInvite
);

// Admin invite management
router.post(
  '/admin',
  userLimiter,
  csrfValidator,
  requireAdmin,
  InviteController.createAdminInvite
);
router.get('/admin/analytics', userLimiter, requireAdmin, InviteController.getInviteAnalytics);
router.get('/admin/users', userLimiter, requireAdmin, InviteController.getUserInviteAnalytics);

export default router;
