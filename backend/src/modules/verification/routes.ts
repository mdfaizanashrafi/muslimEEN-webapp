/**
 * Verification Module Routes
 * User verification endpoints
 */

import { Router } from 'express';
import { VerificationController } from '../trust/controllers/VerificationController';
import { authenticate, authorize } from '../iam/middleware/auth';
import { userLimiter } from '../shared/middleware/rateLimiter';
import { csrfValidator } from '../shared/middleware/csrf';
import { preventNoSqlInjection } from '../shared/middleware/sanitization';
import { auditLog, AUDIT_ACTIONS } from '../shared/middleware/auditLogger';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Business verification approval (admin only)
router.post(
  '/business/:userId/approve',
  userLimiter,
  csrfValidator,
  preventNoSqlInjection,
  authorize('admin'),
  auditLog(AUDIT_ACTIONS.VERIFICATION_APPROVE, 'verification'),
  VerificationController.approveBusinessVerification
);

export default router;
