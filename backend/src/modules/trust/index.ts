/**
 * Trust & Verification Module
 * 
 * Responsibilities:
 * - Trust score calculation
 * - Trust score history tracking
 * - Witness eligibility determination
 * - Identity verification (biometric, witness-based, business)
 */

// Controllers
export * as TrustScoreController from './controllers/TrustScoreController';
export * as VerificationController from './controllers/VerificationController';

// Services
export * as TrustScoreService from './services/TrustScoreService';
export * as VerificationService from './services/VerificationService';

// Repositories
export * as TrustScoreRepository from './repositories/TrustScoreRepository';
export * as VerificationRepository from './repositories/VerificationRepository';

// Types
export { RecalculationResult, TrustScoreFactors } from './services/TrustScoreService';
