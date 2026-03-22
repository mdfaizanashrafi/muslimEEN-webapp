/**
 * Verification Module Routes
 * User verification endpoints
 */

import { Router } from 'express';
import * as VerificationController from '../trust/controllers/VerificationController';
import { clerkAuthenticate, requireRole } from '../iam/middleware/clerkAuth';
import { userLimiter } from '../shared/middleware/rateLimiter';
import { csrfValidator } from '../shared/middleware/csrf';
import { preventNoSqlInjection } from '../shared/middleware/sanitization';
import { auditLog, AUDIT_ACTIONS } from '../shared/middleware/auditLogger';

const router = Router();

// All routes require authentication
router.use(clerkAuthenticate);

// Business verification approval (admin only)
router.post(
  '/business/:userId/approve',
  userLimiter,
  csrfValidator,
  preventNoSqlInjection,
  requireRole('admin', 'super_admin'),
  auditLog(AUDIT_ACTIONS.VERIFICATION_APPROVE, 'verification'),
  VerificationController.approveBusinessVerification
);

export default router;
