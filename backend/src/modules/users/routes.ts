/**
 * Users Module Routes
 * User profile and management endpoints
 */

import { Router } from 'express';
import * as ProfileController from '../profile/controllers/ProfileController';
import * as TrustScoreController from '../trust/controllers/TrustScoreController';
import * as VerificationController from '../trust/controllers/VerificationController';
import { authenticate } from '../iam/middleware/auth';
import { userLimiter } from '../shared/middleware/rateLimiter';
import { csrfValidator } from '../shared/middleware/csrf';
import { createBodyValidator } from '../shared/middleware/validation';
import { preventNoSqlInjection } from '../shared/middleware/sanitization';
import { auditLog, AUDIT_ACTIONS } from '../shared/middleware/auditLogger';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Current user profile
router.get('/me', userLimiter, ProfileController.getCurrentUserProfile);
router.put(
  '/me',
  userLimiter,
  csrfValidator,
  createBodyValidator('updateProfile'),
  ProfileController.updateCurrentUserProfile
);

// Current user trust score
router.get('/me/trust-score', userLimiter, TrustScoreController.getCurrentTrustScore);
router.get('/me/trust-score/history', userLimiter, TrustScoreController.getCurrentUserTrustScoreHistory);
router.post(
  '/me/trust-score/recalculate',
  userLimiter,
  csrfValidator,
  TrustScoreController.recalculateCurrentTrustScore
);

// Current user verification
router.get('/me/verification', userLimiter, VerificationController.getVerificationStatus);
router.post(
  '/me/verification/biometric/request',
  userLimiter,
  csrfValidator,
  preventNoSqlInjection,
  auditLog(AUDIT_ACTIONS.VERIFICATION_REQUEST, 'verification'),
  VerificationController.requestBiometricVerification
);
router.post(
  '/me/verification/biometric/complete',
  userLimiter,
  csrfValidator,
  preventNoSqlInjection,
  auditLog(AUDIT_ACTIONS.VERIFICATION_APPROVE, 'verification'),
  VerificationController.completeBiometricVerification
);
router.post(
  '/me/verification/business/request',
  userLimiter,
  csrfValidator,
  preventNoSqlInjection,
  auditLog(AUDIT_ACTIONS.VERIFICATION_REQUEST, 'verification'),
  VerificationController.requestBusinessVerification
);

// Public profile by user ID
router.get('/:userId', userLimiter, ProfileController.getPublicProfile);

export default router;
