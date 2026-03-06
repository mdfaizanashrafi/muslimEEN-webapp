/**
 * API Routes
 * MuslimEEN Backend API Routes
 * 
 * Note: Routes are now thin - all business logic moved to services
 */

import { Router, Request, Response } from 'express';

// Middleware
import { authenticate, optionalAuth, authorize } from '../middleware/auth';
import { createBodyValidator, createQueryValidator } from '../middleware/validation';
import {
  authLimiter,
  userLimiter,
  marketplaceLimiter,
  apiLimiter,
} from '../middleware/rateLimiter';

// Controllers
import * as authController from '../controllers/authController';
import * as userController from '../controllers/userController';
import * as marketplaceController from '../controllers/marketplaceController';
import * as islamicFinanceController from '../controllers/islamicFinanceController';
import * as verificationController from '../controllers/verificationController';
import * as invitationController from '../controllers/invitationController';

const router = Router();

// ============================================================================
// Public Routes
// ============================================================================

// API Info
router.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'MuslimEEN API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      user: '/api/user',
      marketplace: '/api/marketplace',
      islamicFinance: '/api/islamic-finance',
      verification: '/api/verification',
      invitations: '/api/invitations',
    },
  });
});

// ============================================================================
// Authentication Routes
// ============================================================================

router.post('/auth/validate-invitation', authLimiter, createBodyValidator('validateInvitation'), authController.validateInvitation);
router.post('/auth/login', authLimiter, createBodyValidator('login'), authController.login);
router.post('/auth/register', authLimiter, createBodyValidator('register'), authController.register);
router.post('/auth/logout', authenticate, authController.logout);
router.get('/auth/me', authenticate, authController.getCurrentUser);

// ============================================================================
// User Routes
// ============================================================================

router.get('/user/profile', authenticate, userLimiter, userController.getCurrentUserProfile);
router.put('/user/profile', authenticate, userLimiter, createBodyValidator('updateProfile'), userController.updateCurrentUserProfile);

// Trust Score
router.get('/user/trust-score', authenticate, userLimiter, userController.getCurrentTrustScore);
router.post('/user/trust-score/recalculate', authenticate, userLimiter, userController.recalculateCurrentTrustScore);
router.get('/user/trust-score/history', authenticate, userLimiter, userController.getCurrentUserTrustScoreHistory);

// Connections
router.get('/user/connections', authenticate, userLimiter, userController.getCurrentUserConnections);
router.get('/user/connections/pending', authenticate, userLimiter, userController.getCurrentUserPendingConnections);
router.post('/user/connections', authenticate, userLimiter, createBodyValidator('connectionRequest'), userController.sendConnectionRequestToUser);
router.post('/user/connections/:connectionId/accept', authenticate, userLimiter, userController.acceptIncomingConnectionRequest);
router.post('/user/connections/:connectionId/reject', authenticate, userLimiter, userController.rejectIncomingConnectionRequest);

// Notifications
router.get('/user/notifications', authenticate, userLimiter, userController.getCurrentUserNotifications);
router.put('/user/notifications/:notificationId/read', authenticate, userLimiter, userController.markNotificationAsRead);
router.put('/user/notifications/read-all', authenticate, userLimiter, userController.markAllNotificationsAsRead);

// ============================================================================
// Invitation Routes
// ============================================================================

router.get('/invitations', authenticate, userLimiter, invitationController.getInvitations);
router.post('/invitations', authenticate, userLimiter, invitationController.createInvitation);
router.delete('/invitations/:id', authenticate, userLimiter, invitationController.revokeInvitation);
router.get('/invitations/remaining', authenticate, userLimiter, invitationController.getRemainingCount);
router.get('/invitations/validate/:code', authLimiter, invitationController.validateInvitation);

// ============================================================================
// Marketplace Routes
// ============================================================================

router.get('/marketplace/:vertical', authenticate, marketplaceLimiter, createQueryValidator('marketplaceFilter'), marketplaceController.getMarketplaceListings);
router.get('/marketplace/:vertical/:id', authenticate, marketplaceLimiter, marketplaceController.getListingById);
router.post('/marketplace/:vertical', authenticate, marketplaceLimiter, createBodyValidator('createMarketplaceItem'), marketplaceController.createListing);
router.put('/marketplace/:vertical/:id', authenticate, marketplaceLimiter, marketplaceController.updateListing);
router.delete('/marketplace/:vertical/:id', authenticate, marketplaceLimiter, marketplaceController.removeListing);

// Investment endpoint for BUILD vertical
router.post('/marketplace/:vertical/:id/invest', authenticate, marketplaceLimiter, marketplaceController.recordInvestment);

// ============================================================================
// Islamic Finance Routes
// ============================================================================

// Sadaqah (Charity)
router.get('/islamic-finance/sadaqah', authenticate, apiLimiter, islamicFinanceController.getSadaqahCampaigns);
router.get('/islamic-finance/sadaqah/:id', authenticate, apiLimiter, islamicFinanceController.getSadaqahCampaign);
router.post('/islamic-finance/sadaqah/:id/donate', authenticate, apiLimiter, createBodyValidator('donation'), islamicFinanceController.donate);

// Waqf
router.get('/islamic-finance/waqf', authenticate, apiLimiter, islamicFinanceController.getWaqfListings);

// Qard Hasan (Benevolent Loans)
router.get('/islamic-finance/qard-hasan', authenticate, apiLimiter, islamicFinanceController.getQardHasanLoans);
router.post('/islamic-finance/qard-hasan', authenticate, apiLimiter, createBodyValidator('qardHasanLoan'), islamicFinanceController.createQardHasanLoan);
router.post('/islamic-finance/qard-hasan/:id/lend', authenticate, apiLimiter, islamicFinanceController.lendToQardHasan);
router.post('/islamic-finance/qard-hasan/:id/repay', authenticate, apiLimiter, islamicFinanceController.repayQardHasan);

// Zakat Calculator
router.post('/islamic-finance/zakat/calculate', authenticate, apiLimiter, createBodyValidator('zakatCalculation'), islamicFinanceController.calculateZakat);

// ============================================================================
// Verification Routes
// ============================================================================

// Biometric
router.post('/verification/biometric/request', authenticate, userLimiter, verificationController.requestBiometricVerification);
router.post('/verification/biometric/complete', authenticate, userLimiter, verificationController.completeBiometricVerification);

// Witness
router.post('/verification/witness/request', authenticate, userLimiter, verificationController.requestWitnessVerification);
router.post('/verification/witness/:id/approve', authenticate, userLimiter, verificationController.approveWitness);

// Business
router.post('/verification/business/request', authenticate, userLimiter, verificationController.requestBusinessVerification);
router.post('/verification/business/:userId/approve', authenticate, userLimiter, authorize('admin'), verificationController.approveBusinessVerification);

// ============================================================================
// Admin Routes
// ============================================================================

// Placeholder for admin routes
router.get('/admin/stats', authenticate, authorize('admin'), (req: Request, res: Response) => {
  res.json({ success: true, message: 'Admin stats endpoint' });
});

// ============================================================================
// Feed Routes
// ============================================================================

// Public feed endpoint
router.get('/feed', optionalAuth, apiLimiter, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Feed endpoint',
    items: [],
  });
});

export default router;
