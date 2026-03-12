/**
 * API Routes - Modular Architecture
 * MuslimEEN Backend API Routes
 * 
 * NOTE: Witness verification routes removed.
 * Invitation-only onboarding system.
 * 
 * VERSIONING: v1 (current)
 * DEPRECATIONS: Old /user/* routes deprecated in favor of /users/me/*
 */

import { Router } from 'express';

// IAM Module - Authentication & Authorization
import { authenticate, authorize, requireAdmin } from './iam/middleware/auth';
import { createBodyValidator, createQueryValidator } from './shared/middleware/validation';
import {
  authLimiter,
  userLimiter,
  marketplaceLimiter,
  apiLimiter
} from './shared/middleware/rateLimiter';
import { csrfTokenSetter, csrfValidator } from './shared/middleware/csrf';
import { deprecate } from './shared/middleware/deprecation';
import { sanitizeInput, preventNoSqlInjection } from './shared/middleware/sanitization';
import { auditLog, AUDIT_ACTIONS } from './shared/middleware/auditLogger';

// IAM Module
import { AuthController } from './iam';

// Profile Module
import { ProfileController } from './profile';

// Trust Module
import { TrustScoreController, VerificationController } from './trust';

// Network Module
import { ConnectionController } from './network';

// Marketplace Module
import { MarketplaceController } from './marketplace';

// Islamic Finance Module
import { IslamicFinanceController } from './islamic-finance';

// Invites Module
import { InviteController } from './invites';

const router = Router();

// Sunset date for deprecated endpoints
const SUNSET_DATE = '2026-06-01';

// ============================================================================
// Health Check
// ============================================================================
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// CSRF Token Endpoint
// ============================================================================
router.get('/csrf-token', csrfTokenSetter, (req, res) => {
  res.json({
    success: true,
    csrfToken: res.locals.csrfToken,
  });
});

// ============================================================================
// IAM Module - Authentication
// ============================================================================
router.post('/auth/validate-invitation', authLimiter, preventNoSqlInjection, sanitizeInput, createBodyValidator('validateInvitation'), AuthController.validateInvitation);
router.post('/auth/login', authLimiter, preventNoSqlInjection, sanitizeInput, createBodyValidator('login'), auditLog(AUDIT_ACTIONS.LOGIN, 'auth'), AuthController.login);
router.post('/auth/register', authLimiter, preventNoSqlInjection, sanitizeInput, createBodyValidator('register'), auditLog(AUDIT_ACTIONS.USER_CREATE, 'user'), AuthController.register);
router.post('/auth/logout', authenticate, csrfValidator, auditLog(AUDIT_ACTIONS.LOGOUT, 'auth'), AuthController.logout);
router.get('/auth/me', authenticate, AuthController.getCurrentUser);

// ============================================================================
// Users Module - Current User (NEW STANDARD - v1)
// ============================================================================

// Current user profile
router.get('/users/me', authenticate, userLimiter, ProfileController.getCurrentUserProfile);
router.put('/users/me', authenticate, csrfValidator, userLimiter, createBodyValidator('updateProfile'), ProfileController.updateCurrentUserProfile);

// Current user trust score
router.get('/users/me/trust-score', authenticate, userLimiter, TrustScoreController.getCurrentTrustScore);
router.post('/users/me/trust-score/recalculate', authenticate, csrfValidator, userLimiter, TrustScoreController.recalculateCurrentTrustScore);
router.get('/users/me/trust-score/history', authenticate, userLimiter, TrustScoreController.getCurrentUserTrustScoreHistory);

// Current user connections
router.get('/users/me/connections', authenticate, userLimiter, ConnectionController.getCurrentUserConnections);
router.get('/users/me/connections/pending', authenticate, userLimiter, ConnectionController.getCurrentUserPendingConnections);
router.post('/users/me/connections', authenticate, csrfValidator, userLimiter, createBodyValidator('connectionRequest'), ConnectionController.sendConnectionRequestToUser);

// Current user verification
router.get('/users/me/verification', authenticate, userLimiter, VerificationController.getVerificationStatus);
router.post('/users/me/verification/biometric/request', authenticate, csrfValidator, preventNoSqlInjection, userLimiter, auditLog(AUDIT_ACTIONS.VERIFICATION_REQUEST, 'verification'), VerificationController.requestBiometricVerification);
router.post('/users/me/verification/biometric/complete', authenticate, csrfValidator, preventNoSqlInjection, userLimiter, auditLog(AUDIT_ACTIONS.VERIFICATION_APPROVE, 'verification'), VerificationController.completeBiometricVerification);
router.post('/users/me/verification/business/request', authenticate, csrfValidator, preventNoSqlInjection, userLimiter, auditLog(AUDIT_ACTIONS.VERIFICATION_REQUEST, 'verification'), VerificationController.requestBusinessVerification);

// ============================================================================
// Users Module - Public Profiles
// ============================================================================
router.get('/users/:userId', authenticate, ProfileController.getPublicProfile);

// ============================================================================
// Connections Module - RESTful Status Updates
// ============================================================================
router.patch('/connections/:connectionId/status', authenticate, csrfValidator, preventNoSqlInjection, sanitizeInput, userLimiter, auditLog(AUDIT_ACTIONS.CONNECTION_ACCEPT, 'connection'), ConnectionController.updateConnectionStatus);
router.delete('/connections/:connectionId', authenticate, csrfValidator, preventNoSqlInjection, userLimiter, auditLog(AUDIT_ACTIONS.CONNECTION_DELETE, 'connection'), ConnectionController.removeConnection);

// ============================================================================
// Profile Module (DEPRECATED - Use /users/me/* instead)
// ============================================================================
router.get('/user/profile', 
  authenticate, 
  deprecate({ alternative: '/api/users/me', sunsetDate: SUNSET_DATE, reason: 'Standardized user endpoints' }),
  userLimiter, 
  ProfileController.getCurrentUserProfile
);
router.put('/user/profile', 
  authenticate, 
  csrfValidator, 
  deprecate({ alternative: '/api/users/me', sunsetDate: SUNSET_DATE, reason: 'Standardized user endpoints' }),
  userLimiter, 
  createBodyValidator('updateProfile'), 
  ProfileController.updateCurrentUserProfile
);
router.get('/users/:userId/profile', 
  authenticate, 
  deprecate({ alternative: '/api/users/:userId', sunsetDate: SUNSET_DATE, reason: 'Simplified user endpoints' }),
  ProfileController.getPublicProfile
);

// ============================================================================
// Invites Module - User Invite Management
// ============================================================================
router.get('/invites', authenticate, userLimiter, InviteController.getUserInvites);
router.post('/invites', authenticate, csrfValidator, preventNoSqlInjection, sanitizeInput, userLimiter, auditLog(AUDIT_ACTIONS.INVITE_CREATE, 'invite'), InviteController.createInvite);
router.get('/invites/quota', authenticate, userLimiter, InviteController.getUserInviteQuota);
router.delete('/invites/:id', authenticate, csrfValidator, preventNoSqlInjection, userLimiter, auditLog(AUDIT_ACTIONS.INVITE_REVOKE, 'invite'), InviteController.revokeInvite);

// ============================================================================
// Invites Module - Public Validation
// ============================================================================
router.get('/invites/validate/:token', authLimiter, InviteController.validateInvite);

// ============================================================================
// Invites Module - Admin Routes
// ============================================================================
router.post('/admin/invites', authenticate, csrfValidator, requireAdmin, InviteController.createAdminInvite);
router.get('/admin/invites/analytics', authenticate, requireAdmin, InviteController.getInviteAnalytics);
router.get('/admin/invites/users', authenticate, requireAdmin, InviteController.getUserInviteAnalytics);

// ============================================================================
// Trust Module - Trust Score (DEPRECATED - Use /users/me/* instead)
// ============================================================================
router.get('/user/trust-score', 
  authenticate, 
  deprecate({ alternative: '/api/users/me/trust-score', sunsetDate: SUNSET_DATE, reason: 'Standardized user endpoints' }),
  userLimiter, 
  TrustScoreController.getCurrentTrustScore
);
router.post('/user/trust-score/recalculate', 
  authenticate, 
  csrfValidator, 
  deprecate({ alternative: '/api/users/me/trust-score/recalculate', sunsetDate: SUNSET_DATE, reason: 'Standardized user endpoints' }),
  userLimiter, 
  TrustScoreController.recalculateCurrentTrustScore
);
router.get('/user/trust-score/history', 
  authenticate, 
  deprecate({ alternative: '/api/users/me/trust-score/history', sunsetDate: SUNSET_DATE, reason: 'Standardized user endpoints' }),
  userLimiter, 
  TrustScoreController.getCurrentUserTrustScoreHistory
);

// ============================================================================
// Trust Module - Verification (DEPRECATED - Use /users/me/verification instead)
// ============================================================================
router.get('/verification/status', 
  authenticate, 
  deprecate({ alternative: '/api/users/me/verification', sunsetDate: SUNSET_DATE, reason: 'Standardized user endpoints' }),
  userLimiter, 
  VerificationController.getVerificationStatus
);
router.post('/verification/biometric/request', 
  authenticate, 
  csrfValidator, 
  deprecate({ alternative: '/api/users/me/verification/biometric/request', sunsetDate: SUNSET_DATE, reason: 'Standardized user endpoints' }),
  userLimiter, 
  VerificationController.requestBiometricVerification
);
router.post('/verification/biometric/complete', 
  authenticate, 
  csrfValidator, 
  deprecate({ alternative: '/api/users/me/verification/biometric/complete', sunsetDate: SUNSET_DATE, reason: 'Standardized user endpoints' }),
  userLimiter, 
  VerificationController.completeBiometricVerification
);
router.post('/verification/business/request', 
  authenticate, 
  csrfValidator, 
  deprecate({ alternative: '/api/users/me/verification/business/request', sunsetDate: SUNSET_DATE, reason: 'Standardized user endpoints' }),
  userLimiter, 
  VerificationController.requestBusinessVerification
);
router.post('/verification/business/:userId/approve', 
  authenticate, 
  csrfValidator, 
  preventNoSqlInjection,
  authorize('admin'), 
  auditLog(AUDIT_ACTIONS.VERIFICATION_APPROVE, 'verification'),
  VerificationController.approveBusinessVerification
);

// ============================================================================
// Network Module - Connections (DEPRECATED - Use /users/me/* or /connections/*)
// ============================================================================
router.get('/user/connections', 
  authenticate, 
  deprecate({ alternative: '/api/users/me/connections', sunsetDate: SUNSET_DATE, reason: 'Standardized user endpoints' }),
  userLimiter, 
  ConnectionController.getCurrentUserConnections
);
router.get('/user/connections/pending', 
  authenticate, 
  deprecate({ alternative: '/api/users/me/connections/pending', sunsetDate: SUNSET_DATE, reason: 'Standardized user endpoints' }),
  userLimiter, 
  ConnectionController.getCurrentUserPendingConnections
);
router.post('/user/connections', 
  authenticate, 
  csrfValidator, 
  deprecate({ alternative: '/api/users/me/connections', sunsetDate: SUNSET_DATE, reason: 'Standardized user endpoints' }),
  userLimiter, 
  createBodyValidator('connectionRequest'), 
  ConnectionController.sendConnectionRequestToUser
);
router.post('/user/connections/:connectionId/accept', 
  authenticate, 
  csrfValidator, 
  deprecate({ alternative: 'PATCH /api/connections/:id/status with {status: "accepted"}', sunsetDate: SUNSET_DATE, reason: 'RESTful status updates' }),
  userLimiter, 
  ConnectionController.acceptIncomingConnectionRequest
);
router.post('/user/connections/:connectionId/reject', 
  authenticate, 
  csrfValidator, 
  deprecate({ alternative: 'PATCH /api/connections/:id/status with {status: "rejected"}', sunsetDate: SUNSET_DATE, reason: 'RESTful status updates' }),
  userLimiter, 
  ConnectionController.rejectIncomingConnectionRequest
);
router.delete('/user/connections/:connectionId', 
  authenticate, 
  csrfValidator, 
  deprecate({ alternative: 'DELETE /api/connections/:id', sunsetDate: SUNSET_DATE, reason: 'RESTful resource paths' }),
  userLimiter, 
  ConnectionController.removeConnection
);

// ============================================================================
// Marketplace Module
// ============================================================================
router.get('/marketplace/:vertical', authenticate, marketplaceLimiter, createQueryValidator('marketplaceFilter'), MarketplaceController.getMarketplaceListings);
router.get('/marketplace/:vertical/:id', authenticate, marketplaceLimiter, MarketplaceController.getListingById);
router.post('/marketplace/:vertical', authenticate, csrfValidator, marketplaceLimiter, createBodyValidator('createMarketplaceItem'), MarketplaceController.createListing);
router.put('/marketplace/:vertical/:id', authenticate, csrfValidator, marketplaceLimiter, MarketplaceController.updateListing);
router.delete('/marketplace/:vertical/:id', authenticate, csrfValidator, marketplaceLimiter, MarketplaceController.removeListing);
router.post('/marketplace/:vertical/:id/invest', authenticate, csrfValidator, marketplaceLimiter, MarketplaceController.recordInvestment);

// ============================================================================
// Islamic Finance Module
// ============================================================================
router.get('/islamic-finance/sadaqah', authenticate, apiLimiter, IslamicFinanceController.getSadaqahCampaigns);
router.post('/islamic-finance/sadaqah/:id/donate', authenticate, csrfValidator, apiLimiter, createBodyValidator('donation'), IslamicFinanceController.donate);
router.get('/islamic-finance/waqf', authenticate, apiLimiter, IslamicFinanceController.getWaqfListings);
router.get('/islamic-finance/qard-hasan', authenticate, apiLimiter, IslamicFinanceController.getQardHasanLoans);
router.post('/islamic-finance/qard-hasan', authenticate, csrfValidator, apiLimiter, createBodyValidator('qardHasanLoan'), IslamicFinanceController.createQardHasanLoan);
router.post('/islamic-finance/zakat/calculate', authenticate, csrfValidator, apiLimiter, createBodyValidator('zakatCalculation'), IslamicFinanceController.calculateZakat);

export default router;
