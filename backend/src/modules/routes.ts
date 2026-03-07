/**
 * API Routes - Modular Architecture
 * MuslimEEN Backend API Routes
 */

import { Router } from 'express';

// Shared middleware
import { authenticate, authorize } from './shared/middleware/auth';
import { createBodyValidator, createQueryValidator } from './shared/middleware/validation';
import {
  authLimiter,
  userLimiter,
  marketplaceLimiter,
  apiLimiter
} from './shared/middleware/rateLimiter';

// IAM Module
import { AuthController } from './iam';

// Profile Module
import { ProfileController } from './profile';

// Trust Module
import { TrustScoreController, VerificationController } from './trust';

// Network Module
import { ConnectionController } from './network';

// Marketplace Module
import * as MarketplaceController from './marketplace/controllers/MarketplaceController';

// Islamic Finance Module
import * as IslamicFinanceController from './islamic-finance/controllers/IslamicFinanceController';


const router = Router();

// ============================================================================
// Health Check
// ============================================================================
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// IAM Module - Authentication
// ============================================================================
router.post('/auth/validate-invitation', authLimiter, createBodyValidator('validateInvitation'), AuthController.validateInvitation);
router.post('/auth/login', authLimiter, createBodyValidator('login'), AuthController.login);
router.post('/auth/register', authLimiter, createBodyValidator('register'), AuthController.register);
router.post('/auth/logout', authenticate, AuthController.logout);
router.get('/auth/me', authenticate, AuthController.getCurrentUser);

// ============================================================================
// Profile Module
// ============================================================================
router.get('/user/profile', authenticate, userLimiter, ProfileController.getCurrentUserProfile);
router.put('/user/profile', authenticate, userLimiter, createBodyValidator('updateProfile'), ProfileController.updateCurrentUserProfile);
router.get('/users/:userId/profile', authenticate, ProfileController.getPublicProfile);

// ============================================================================
// Trust Module - Trust Score
// ============================================================================
router.get('/user/trust-score', authenticate, userLimiter, TrustScoreController.getCurrentTrustScore);
router.post('/user/trust-score/recalculate', authenticate, userLimiter, TrustScoreController.recalculateCurrentTrustScore);
router.get('/user/trust-score/history', authenticate, userLimiter, TrustScoreController.getCurrentUserTrustScoreHistory);

// ============================================================================
// Trust Module - Verification
// ============================================================================
router.post('/verification/biometric/request', authenticate, userLimiter, VerificationController.requestBiometricVerification);
router.post('/verification/biometric/complete', authenticate, userLimiter, VerificationController.completeBiometricVerification);
router.post('/verification/witness/request', authenticate, userLimiter, VerificationController.requestWitnessVerification);
router.post('/verification/witness/:userId/approve', authenticate, userLimiter, VerificationController.approveAsWitness);
router.post('/verification/business/request', authenticate, userLimiter, VerificationController.requestBusinessVerification);
router.post('/verification/business/:userId/approve', authenticate, authorize('admin'), VerificationController.approveBusinessVerification);

// ============================================================================
// Network Module - Connections
// ============================================================================
router.get('/user/connections', authenticate, userLimiter, ConnectionController.getCurrentUserConnections);
router.get('/user/connections/pending', authenticate, userLimiter, ConnectionController.getCurrentUserPendingConnections);
router.post('/user/connections', authenticate, userLimiter, createBodyValidator('connectionRequest'), ConnectionController.sendConnectionRequestToUser);
router.post('/user/connections/:connectionId/accept', authenticate, userLimiter, ConnectionController.acceptIncomingConnectionRequest);
router.post('/user/connections/:connectionId/reject', authenticate, userLimiter, ConnectionController.rejectIncomingConnectionRequest);
router.delete('/user/connections/:connectionId', authenticate, userLimiter, ConnectionController.removeConnection);

// ============================================================================
// Marketplace Module
// ============================================================================
router.get('/marketplace/:vertical', authenticate, marketplaceLimiter, createQueryValidator('marketplaceFilter'), MarketplaceController.getMarketplaceListings);
router.get('/marketplace/:vertical/:id', authenticate, marketplaceLimiter, MarketplaceController.getListingById);
router.post('/marketplace/:vertical', authenticate, marketplaceLimiter, createBodyValidator('createMarketplaceItem'), MarketplaceController.createListing);
router.put('/marketplace/:vertical/:id', authenticate, marketplaceLimiter, MarketplaceController.updateListing);
router.delete('/marketplace/:vertical/:id', authenticate, marketplaceLimiter, MarketplaceController.removeListing);
router.post('/marketplace/:vertical/:id/invest', authenticate, marketplaceLimiter, MarketplaceController.recordInvestment);

// ============================================================================
// Islamic Finance Module
// ============================================================================
router.get('/islamic-finance/sadaqah', authenticate, apiLimiter, IslamicFinanceController.getSadaqahCampaigns);
router.post('/islamic-finance/sadaqah/:id/donate', authenticate, apiLimiter, createBodyValidator('donation'), IslamicFinanceController.donate);
router.get('/islamic-finance/waqf', authenticate, apiLimiter, IslamicFinanceController.getWaqfListings);
router.get('/islamic-finance/qard-hasan', authenticate, apiLimiter, IslamicFinanceController.getQardHasanLoans);
router.post('/islamic-finance/qard-hasan', authenticate, apiLimiter, createBodyValidator('qardHasanLoan'), IslamicFinanceController.createQardHasanLoan);
router.post('/islamic-finance/zakat/calculate', authenticate, apiLimiter, createBodyValidator('zakatCalculation'), IslamicFinanceController.calculateZakat);

export default router;
