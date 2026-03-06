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

// ============================================================================
// MODULAR CONTROLLERS
// ============================================================================
import { AuthController as modularAuthController } from '../modules/iam';
import { ProfileController as modularProfileController } from '../modules/profile';
import { TrustScoreController as modularTrustScoreController, VerificationController as modularVerificationController } from '../modules/trust';
import { ConnectionController as modularConnectionController } from '../modules/network';
import { MarketplaceController as modularMarketplaceController } from '../modules/marketplace';
import * as modularIslamicFinanceController from '../modules/islamic-finance/controllers/IslamicFinanceController';

// ============================================================================
// CONTROLLER SELECTION (Feature Flag Based)
// ============================================================================

// IAM Module
const authController = featureFlags.useModularIAM ? modularAuthController : legacyAuthController;

// Profile Module (note: legacy userController handles profile)
const profileController = featureFlags.useModularProfile ? modularProfileController : legacyUserController;

// Trust Module
const trustScoreController = featureFlags.useModularTrust ? modularTrustScoreController : legacyUserController;
const verificationController = featureFlags.useModularTrust ? modularVerificationController : legacyVerificationController;

// Network Module
const connectionController = featureFlags.useModularNetwork ? modularConnectionController : legacyUserController;

// Marketplace Module
const marketplaceController = featureFlags.useModularMarketplace ? modularMarketplaceController : legacyMarketplaceController;

// Islamic Finance Module
const islamicFinanceController = featureFlags.useModularIslamicFinance ? modularIslamicFinanceController : legacyIslamicFinanceController;

// Invitations Module (currently only legacy available)
const invitationController = legacyInvitationController;

// Notifications Module (currently only legacy available via userController)
const notificationController = legacyUserController;

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

router.post('/auth/validate-invitation', authLimiter, createBodyValidator('validateInvitation'), authController.validateInvitation);
router.post('/auth/login', authLimiter, createBodyValidator('login'), authController.login);
router.post('/auth/register', authLimiter, createBodyValidator('register'), authController.register);
router.post('/auth/logout', authenticate, authController.logout);
router.get('/auth/me', authenticate, authController.getCurrentUser);

// ============================================================================
// USER/PROFILE ROUTES (Profile Module)
// ============================================================================

router.get('/user/profile', authenticate, userLimiter, profileController.getCurrentUserProfile);
router.put('/user/profile', authenticate, userLimiter, createBodyValidator('updateProfile'), profileController.updateCurrentUserProfile);

// Public profile endpoint (modular only)
if (featureFlags.useModularProfile) {
  router.get('/users/:userId/profile', authenticate, modularProfileController.getPublicProfile);
}

// ============================================================================
// TRUST SCORE ROUTES (Trust Module)
// ============================================================================

router.get('/user/trust-score', authenticate, userLimiter, trustScoreController.getCurrentTrustScore);
router.post('/user/trust-score/recalculate', authenticate, userLimiter, trustScoreController.recalculateCurrentTrustScore);
router.get('/user/trust-score/history', authenticate, userLimiter, trustScoreController.getCurrentUserTrustScoreHistory);

// ============================================================================
// CONNECTIONS ROUTES (Network Module)
// ============================================================================

router.get('/user/connections', authenticate, userLimiter, connectionController.getCurrentUserConnections);
router.get('/user/connections/pending', authenticate, userLimiter, connectionController.getCurrentUserPendingConnections);
router.post('/user/connections', authenticate, userLimiter, createBodyValidator('connectionRequest'), connectionController.sendConnectionRequestToUser);
router.post('/user/connections/:connectionId/accept', authenticate, userLimiter, connectionController.acceptIncomingConnectionRequest);
router.post('/user/connections/:connectionId/reject', authenticate, userLimiter, connectionController.rejectIncomingConnectionRequest);

// Additional modular endpoint
if (featureFlags.useModularNetwork) {
  router.delete('/user/connections/:connectionId', authenticate, userLimiter, modularConnectionController.removeConnection);
}

// ============================================================================
// NOTIFICATIONS ROUTES (Notifications Module - Legacy only for now)
// ============================================================================

router.get('/user/notifications', authenticate, userLimiter, notificationController.getCurrentUserNotifications);
router.put('/user/notifications/:notificationId/read', authenticate, userLimiter, notificationController.markNotificationAsRead);
router.put('/user/notifications/read-all', authenticate, userLimiter, notificationController.markAllNotificationsAsRead);

// ============================================================================
// INVITATION ROUTES (Invitations Module - Legacy only for now)
// ============================================================================

router.get('/invitations', authenticate, userLimiter, invitationController.getInvitations);
router.post('/invitations', authenticate, userLimiter, invitationController.createInvitation);
router.delete('/invitations/:id', authenticate, userLimiter, invitationController.revokeInvitation);
router.get('/invitations/remaining', authenticate, userLimiter, invitationController.getRemainingCount);
router.get('/invitations/validate/:code', authLimiter, invitationController.validateInvitation);

// ============================================================================
// MARKETPLACE ROUTES (Marketplace Module)
// ============================================================================

router.get('/marketplace/:vertical', authenticate, marketplaceLimiter, createQueryValidator('marketplaceFilter'), marketplaceController.getMarketplaceListings);
router.get('/marketplace/:vertical/:id', authenticate, marketplaceLimiter, marketplaceController.getListingById);
router.post('/marketplace/:vertical', authenticate, marketplaceLimiter, createBodyValidator('createMarketplaceItem'), marketplaceController.createListing);
router.put('/marketplace/:vertical/:id', authenticate, marketplaceLimiter, marketplaceController.updateListing);
router.delete('/marketplace/:vertical/:id', authenticate, marketplaceLimiter, marketplaceController.removeListing);

// Investment endpoint for BUILD vertical
router.post('/marketplace/:vertical/:id/invest', authenticate, marketplaceLimiter, marketplaceController.recordInvestment);

// ============================================================================
// ISLAMIC FINANCE ROUTES (Islamic Finance Module)
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
// VERIFICATION ROUTES (Trust Module - Verification)
// ============================================================================

// Biometric
router.post('/verification/biometric/request', authenticate, userLimiter, verificationController.requestBiometricVerification);
router.post('/verification/biometric/complete', authenticate, userLimiter, verificationController.completeBiometricVerification);

// Witness
router.post('/verification/witness/request', authenticate, userLimiter, verificationController.requestWitnessVerification);

// Modular has different param name
if (featureFlags.useModularTrust) {
  router.post('/verification/witness/:userId/approve', authenticate, userLimiter, modularVerificationController.approveAsWitness);
} else {
  router.post('/verification/witness/:id/approve', authenticate, userLimiter, legacyVerificationController.approveWitness);
}

// Business
router.post('/verification/business/request', authenticate, userLimiter, verificationController.requestBusinessVerification);
router.post('/verification/business/:userId/approve', authenticate, userLimiter, authorize('admin'), verificationController.approveBusinessVerification);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

// Placeholder for admin routes
router.get('/admin/stats', authenticate, authorize('admin'), (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'Admin stats endpoint',
    migration: getMigrationStatus(),
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

// Helper function for admin stats
function getMigrationStatus() {
  return {
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
  };
}

export default router;
