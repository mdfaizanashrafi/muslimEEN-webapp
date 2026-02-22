/**
 * API Routes
 * MuslimEEN Backend API Routes
 */

import { Router, Request, Response } from 'express';

// Middleware
import { authenticate, optionalAuth, authorize } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import {
  authLimiter,
  userLimiter,
  marketplaceLimiter,
  messageLimiter,
  apiLimiter
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
      invitations: '/api/invitations'
    }
  });
});

// ============================================================================
// Authentication Routes
// ============================================================================

router.post('/auth/validate-invitation', authLimiter, validate('validateInvitation'), authController.validateInvitation);
router.post('/auth/login', authLimiter, validate('login'), authController.login);
router.post('/auth/register', authLimiter, validate('register'), authController.register);
router.post('/auth/logout', authenticate, authController.logout);
router.get('/auth/me', authenticate, authController.getCurrentUser);

// ============================================================================
// User Routes
// ============================================================================

router.get('/user/profile', authenticate, userLimiter, userController.getProfile);
router.put('/user/profile', authenticate, userLimiter, validate('updateProfile'), userController.updateProfile);

// Trust Score
router.get('/user/trust-score', authenticate, userLimiter, userController.getTrustScore);
router.get('/user/trust-score/history', authenticate, userLimiter, userController.getTrustScoreHistory);

// Connections
router.get('/user/connections', authenticate, userLimiter, userController.getConnections);
router.get('/user/connections/pending', authenticate, userLimiter, userController.getPendingConnections);
router.post('/user/connections', authenticate, userLimiter, validate('connectionRequest'), userController.sendConnectionRequest);
router.post('/user/connections/:id/accept', authenticate, userLimiter, userController.acceptConnectionRequest);
router.post('/user/connections/:id/reject', authenticate, userLimiter, userController.rejectConnectionRequest);

// Notifications
router.get('/user/notifications', authenticate, userLimiter, userController.getNotifications);
router.put('/user/notifications/:id/read', authenticate, userLimiter, userController.markNotificationRead);
router.put('/user/notifications/read-all', authenticate, userLimiter, userController.markAllNotificationsRead);

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

router.get('/marketplace/:vertical', authenticate, marketplaceLimiter, validateQuery('marketplaceFilter'), marketplaceController.getItems);
router.get('/marketplace/:vertical/:id', authenticate, marketplaceLimiter, marketplaceController.getItem);
router.post('/marketplace/:vertical', authenticate, marketplaceLimiter, validate('createMarketplaceItem'), marketplaceController.createItem);
router.put('/marketplace/:vertical/:id', authenticate, marketplaceLimiter, marketplaceController.updateItem);
router.delete('/marketplace/:vertical/:id', authenticate, marketplaceLimiter, marketplaceController.deleteItem);

// Investment endpoint for BUILD vertical
router.post('/marketplace/:vertical/:id/invest', authenticate, marketplaceLimiter, marketplaceController.invest);

// ============================================================================
// Islamic Finance Routes
// ============================================================================

// Sadaqah (Charity)
router.get('/islamic-finance/sadaqah', authenticate, apiLimiter, islamicFinanceController.getSadaqahCampaigns);
router.get('/islamic-finance/sadaqah/:id', authenticate, apiLimiter, islamicFinanceController.getSadaqahCampaign);
router.post('/islamic-finance/sadaqah/:id/donate', authenticate, apiLimiter, validate('donation'), islamicFinanceController.donate);

// Waqf
router.get('/islamic-finance/waqf', authenticate, apiLimiter, islamicFinanceController.getWaqf);

// Qard Hasan (Benevolent Loans)
router.get('/islamic-finance/qard-hasan', authenticate, apiLimiter, islamicFinanceController.getQardHasanLoans);
router.post('/islamic-finance/qard-hasan', authenticate, apiLimiter, validate('qardHasanLoan'), islamicFinanceController.createQardHasanLoan);
router.post('/islamic-finance/qard-hasan/:id/lend', authenticate, apiLimiter, islamicFinanceController.lendToQardHasan);
router.post('/islamic-finance/qard-hasan/:id/repay', authenticate, apiLimiter, islamicFinanceController.repayQardHasan);

// Zakat Calculator
router.post('/islamic-finance/zakat/calculate', authenticate, apiLimiter, validate('zakatCalculation'), islamicFinanceController.calculateZakat);

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
    items: []
  });
});

export default router;
