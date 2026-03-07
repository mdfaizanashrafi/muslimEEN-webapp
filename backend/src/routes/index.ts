/**
 * API Routes
 * MuslimEEN Backend API Routes
 * 
 * Migration Status: HYBRID (Legacy + Modular)
 * This router supports gradual migration via feature flags.
 * Each module can be switched independently.
 */

import { Router, Request, Response } from 'express';

// Feature Flags
import { featureFlags } from '../modules/shared/config/featureFlags';

// ============================================================================
// MIDDLEWARE (Legacy - will be migrated last)
// ============================================================================
import { authenticate, optionalAuth, authorize } from '../middleware/auth';
import { createBodyValidator, createQueryValidator } from '../middleware/validation';
import {
  authLimiter,
  userLimiter,
  marketplaceLimiter,
  apiLimiter,
} from '../middleware/rateLimiter';

// ============================================================================
// LEGACY CONTROLLERS
// ============================================================================
import * as legacyAuthController from '../controllers/authController';
import * as legacyUserController from '../controllers/userController';
import * as legacyMarketplaceController from '../controllers/marketplaceController';
import * as legacyIslamicFinanceController from '../controllers/islamicFinanceController';
import * as legacyVerificationController from '../controllers/verificationController';
import * as legacyInvitationController from '../controllers/invitationController';
import * as legacyNotificationController from '../controllers/userController'; // Notifications via userController

// Modular Invitations & Notifications
import { InvitationController as modularInvitationController } from '../modules/invitations';
import { NotificationController as modularNotificationController } from '../modules/notifications';

// ============================================================================
// MODULAR CONTROLLERS
// ============================================================================
import { AuthController as modularAuthController } from '../modules/iam';
import { ProfileController as modularProfileController } from '../modules/profile';
import { TrustScoreController as modularTrustScoreController, VerificationController as modularVerificationController } from '../modules/trust';
import { ConnectionController as modularConnectionController } from '../modules/network';
import * as modularMarketplaceController from '../modules/marketplace/controllers/MarketplaceController';
import * as modularIslamicFinanceController from '../modules/islamic-finance/controllers/IslamicFinanceController';

const router = Router();

// ============================================================================
// MIGRATION STATUS ENDPOINT
// ============================================================================

router.get('/migration-status', (_req: Request, res: Response) => {
  res.json({
    name: 'MuslimEEN API',
    version: '1.0.0',
    migration: {
      status: 'in-progress',
      featureFlags,
      modules: {
        iam: featureFlags.useModularIAM ? 'modular' : 'legacy',
        profile: featureFlags.useModularProfile ? 'modular' : 'legacy',
        trust: featureFlags.useModularTrust ? 'modular' : 'legacy',
        network: featureFlags.useModularNetwork ? 'modular' : 'legacy',
        notifications: featureFlags.useModularNotifications ? 'modular' : 'legacy',
        invitations: featureFlags.useModularInvitations ? 'modular' : 'legacy',
        marketplace: featureFlags.useModularMarketplace ? 'modular' : 'legacy',
        islamicFinance: featureFlags.useModularIslamicFinance ? 'modular' : 'legacy',
      }
    },
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
// Public Routes
// ============================================================================

// API Info (redirect to migration-status)
router.get('/', (req: Request, res: Response) => {
  res.redirect('/api/migration-status');
});

// ============================================================================
// AUTHENTICATION ROUTES (IAM Module)
// ============================================================================

const authController = featureFlags.useModularIAM ? modularAuthController : legacyAuthController;

router.post('/auth/validate-invitation', authLimiter, createBodyValidator('validateInvitation'), authController.validateInvitation);
router.post('/auth/login', authLimiter, createBodyValidator('login'), authController.login);
router.post('/auth/register', authLimiter, createBodyValidator('register'), authController.register);
router.post('/auth/logout', authenticate, authController.logout);
router.get('/auth/me', authenticate, authController.getCurrentUser);

// ============================================================================
// USER/PROFILE ROUTES (Profile Module)
// ============================================================================

if (featureFlags.useModularProfile) {
  // Use modular profile controller
  router.get('/user/profile', authenticate, userLimiter, modularProfileController.getCurrentUserProfile);
  router.put('/user/profile', authenticate, userLimiter, createBodyValidator('updateProfile'), modularProfileController.updateCurrentUserProfile);
  router.get('/users/:userId/profile', authenticate, modularProfileController.getPublicProfile);
} else {
  // Use legacy user controller (profile methods)
  router.get('/user/profile', authenticate, userLimiter, legacyUserController.retrieveCurrentUserProfile);
  router.put('/user/profile', authenticate, userLimiter, createBodyValidator('updateProfile'), legacyUserController.modifyCurrentUserProfile);
}

// ============================================================================
// TRUST SCORE ROUTES (Trust Module)
// ============================================================================

if (featureFlags.useModularTrust) {
  // Modular trust routes
  router.get('/user/trust-score', authenticate, userLimiter, modularTrustScoreController.getCurrentTrustScore);
  router.post('/user/trust-score/recalculate', authenticate, userLimiter, modularTrustScoreController.recalculateCurrentTrustScore);
  router.get('/user/trust-score/history', authenticate, userLimiter, modularTrustScoreController.getCurrentUserTrustScoreHistory);
  
  // Verification routes (modular)
  router.post('/verification/biometric/request', authenticate, userLimiter, modularVerificationController.requestBiometricVerification);
  router.post('/verification/biometric/complete', authenticate, userLimiter, modularVerificationController.completeBiometricVerification);
  router.post('/verification/witness/request', authenticate, userLimiter, modularVerificationController.requestWitnessVerification);
  router.post('/verification/witness/:userId/approve', authenticate, userLimiter, modularVerificationController.approveAsWitness);
  router.post('/verification/business/request', authenticate, userLimiter, modularVerificationController.requestBusinessVerification);
  router.post('/verification/business/:userId/approve', authenticate, userLimiter, authorize('admin'), modularVerificationController.approveBusinessVerification);
} else {
  // Legacy trust routes
  router.get('/user/trust-score', authenticate, userLimiter, legacyUserController.retrieveCurrentTrustScore);
  router.post('/user/trust-score/recalculate', authenticate, userLimiter, legacyUserController.triggerTrustScoreRecalculation);
  router.get('/user/trust-score/history', authenticate, userLimiter, legacyUserController.retrieveTrustScoreHistory);
  
  // Verification routes (legacy)
  router.post('/verification/biometric/request', authenticate, userLimiter, legacyVerificationController.requestBiometricVerification);
  router.post('/verification/biometric/complete', authenticate, userLimiter, legacyVerificationController.completeBiometricVerification);
  router.post('/verification/witness/request', authenticate, userLimiter, legacyVerificationController.requestWitnessVerification);
  router.post('/verification/witness/:id/approve', authenticate, userLimiter, legacyVerificationController.approveWitness);
  router.post('/verification/business/request', authenticate, userLimiter, legacyVerificationController.requestBusinessVerification);
  router.post('/verification/business/:userId/approve', authenticate, userLimiter, authorize('admin'), legacyVerificationController.approveBusinessVerification);
}

// ============================================================================
// CONNECTIONS ROUTES (Network Module)
// ============================================================================

if (featureFlags.useModularNetwork) {
  // Modular network routes
  router.get('/user/connections', authenticate, userLimiter, modularConnectionController.getCurrentUserConnections);
  router.get('/user/connections/pending', authenticate, userLimiter, modularConnectionController.getCurrentUserPendingConnections);
  router.post('/user/connections', authenticate, userLimiter, createBodyValidator('connectionRequest'), modularConnectionController.sendConnectionRequestToUser);
  router.post('/user/connections/:connectionId/accept', authenticate, userLimiter, modularConnectionController.acceptIncomingConnectionRequest);
  router.post('/user/connections/:connectionId/reject', authenticate, userLimiter, modularConnectionController.rejectIncomingConnectionRequest);
  router.delete('/user/connections/:connectionId', authenticate, userLimiter, modularConnectionController.removeConnection);
} else {
  // Legacy connection routes
  router.get('/user/connections', authenticate, userLimiter, legacyUserController.retrieveUserNetworkConnections);
  router.get('/user/connections/pending', authenticate, userLimiter, legacyUserController.retrievePendingConnectionRequests);
  router.post('/user/connections', authenticate, userLimiter, createBodyValidator('connectionRequest'), legacyUserController.initiateConnectionRequest);
  router.post('/user/connections/:connectionId/accept', authenticate, userLimiter, legacyUserController.acceptConnectionRequest);
  router.post('/user/connections/:connectionId/reject', authenticate, userLimiter, legacyUserController.declineConnectionRequest);
}

// ============================================================================
// NOTIFICATIONS ROUTES (Notifications Module)
// ============================================================================

if (featureFlags.useModularNotifications) {
  // Modular notification routes
  router.get('/user/notifications', authenticate, userLimiter, modularNotificationController.getUserNotifications);
  router.put('/user/notifications/:notificationId/read', authenticate, userLimiter, modularNotificationController.markNotificationAsRead);
  router.put('/user/notifications/read-all', authenticate, userLimiter, modularNotificationController.markAllNotificationsAsRead);
} else {
  // Legacy notification routes
  router.get('/user/notifications', authenticate, userLimiter, legacyUserController.retrieveUserNotifications);
  router.put('/user/notifications/:notificationId/read', authenticate, userLimiter, legacyUserController.markSingleNotificationAsRead);
  router.put('/user/notifications/read-all', authenticate, userLimiter, legacyUserController.markAllUserNotificationsAsRead);
}

// ============================================================================
// INVITATION ROUTES (Invitations Module)
// ============================================================================

if (featureFlags.useModularInvitations) {
  // Modular invitation routes
  router.get('/invitations', authenticate, userLimiter, modularInvitationController.getInvitations);
  router.post('/invitations', authenticate, userLimiter, modularInvitationController.createInvitation);
  router.delete('/invitations/:id', authenticate, userLimiter, modularInvitationController.revokeInvitation);
  router.get('/invitations/remaining', authenticate, userLimiter, modularInvitationController.getRemainingCount);
  router.get('/invitations/validate/:code', authLimiter, modularInvitationController.validateInvitation);
} else {
  // Legacy invitation routes
  router.get('/invitations', authenticate, userLimiter, legacyInvitationController.getInvitations);
  router.post('/invitations', authenticate, userLimiter, legacyInvitationController.createInvitation);
  router.delete('/invitations/:id', authenticate, userLimiter, legacyInvitationController.revokeInvitation);
  router.get('/invitations/remaining', authenticate, userLimiter, legacyInvitationController.getRemainingCount);
  router.get('/invitations/validate/:code', authLimiter, legacyInvitationController.validateInvitation);
}

// ============================================================================
// MARKETPLACE ROUTES (Marketplace Module)
// ============================================================================

const marketplaceController = featureFlags.useModularMarketplace ? modularMarketplaceController : legacyMarketplaceController;

router.get('/marketplace/:vertical', authenticate, marketplaceLimiter, createQueryValidator('marketplaceFilter'), marketplaceController.getMarketplaceListings);
router.get('/marketplace/:vertical/:id', authenticate, marketplaceLimiter, marketplaceController.getListingById);
router.post('/marketplace/:vertical', authenticate, marketplaceLimiter, createBodyValidator('createMarketplaceItem'), marketplaceController.createListing);
router.put('/marketplace/:vertical/:id', authenticate, marketplaceLimiter, marketplaceController.updateListing);
router.delete('/marketplace/:vertical/:id', authenticate, marketplaceLimiter, marketplaceController.removeListing);
router.post('/marketplace/:vertical/:id/invest', authenticate, marketplaceLimiter, marketplaceController.recordInvestment);

// ============================================================================
// ISLAMIC FINANCE ROUTES (Islamic Finance Module)
// ============================================================================

const islamicFinanceController = featureFlags.useModularIslamicFinance ? modularIslamicFinanceController : legacyIslamicFinanceController;

// Sadaqah (Charity)
router.get('/islamic-finance/sadaqah', authenticate, apiLimiter, islamicFinanceController.getSadaqahCampaigns);

// Note: Legacy has getSadaqahCampaign, modular might not - handle carefully
if (!featureFlags.useModularIslamicFinance) {
  router.get('/islamic-finance/sadaqah/:id', authenticate, apiLimiter, legacyIslamicFinanceController.getSadaqahCampaign);
}

router.post('/islamic-finance/sadaqah/:id/donate', authenticate, apiLimiter, createBodyValidator('donation'), islamicFinanceController.donate);

// Waqf
router.get('/islamic-finance/waqf', authenticate, apiLimiter, islamicFinanceController.getWaqfListings);

// Qard Hasan (Benevolent Loans)
router.get('/islamic-finance/qard-hasan', authenticate, apiLimiter, islamicFinanceController.getQardHasanLoans);
router.post('/islamic-finance/qard-hasan', authenticate, apiLimiter, createBodyValidator('qardHasanLoan'), islamicFinanceController.createQardHasanLoan);

// Note: lend and repay might differ between legacy and modular
if (featureFlags.useModularIslamicFinance) {
  // Check if modular has these methods
  if (modularIslamicFinanceController.lendToQardHasan) {
    router.post('/islamic-finance/qard-hasan/:id/lend', authenticate, apiLimiter, modularIslamicFinanceController.lendToQardHasan);
  }
  if (modularIslamicFinanceController.repayQardHasan) {
    router.post('/islamic-finance/qard-hasan/:id/repay', authenticate, apiLimiter, modularIslamicFinanceController.repayQardHasan);
  }
} else {
  router.post('/islamic-finance/qard-hasan/:id/lend', authenticate, apiLimiter, legacyIslamicFinanceController.lendToQardHasan);
  router.post('/islamic-finance/qard-hasan/:id/repay', authenticate, apiLimiter, legacyIslamicFinanceController.repayQardHasan);
}

// Zakat Calculator
router.post('/islamic-finance/zakat/calculate', authenticate, apiLimiter, createBodyValidator('zakatCalculation'), islamicFinanceController.calculateZakat);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

// Placeholder for admin routes
router.get('/admin/stats', authenticate, authorize('admin'), (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'Admin stats endpoint',
    migration: {
      status: 'in-progress',
      featureFlags,
    },
  });
});

// ============================================================================
// FEED ROUTES
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
