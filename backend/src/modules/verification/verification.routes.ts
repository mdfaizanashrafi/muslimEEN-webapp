/**
 * Verification Routes
 * Routes for user verification (biometric, two-witness, business)
 */

import { Router } from 'express';
import {
  requestBiometricVerification,
  completeBiometricVerification,
  requestWitnessVerification,
  approveWitness,
  requestBusinessVerification,
  approveBusinessVerification,
} from './verification.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/admin';

const router = Router();

// Biometric verification routes
router.post(
  '/biometric/request',
  authenticate,
  requestBiometricVerification
);

router.post(
  '/biometric/complete',
  authenticate,
  completeBiometricVerification
);

// Witness verification routes
router.post(
  '/witness/request',
  authenticate,
  requestWitnessVerification
);

router.post(
  '/witness/approve',
  authenticate,
  approveWitness
);

// Business verification routes
router.post(
  '/business/request',
  authenticate,
  requestBusinessVerification
);

router.post(
  '/business/approve',
  authenticate,
  requireAdmin,
  approveBusinessVerification
);

export default router;
