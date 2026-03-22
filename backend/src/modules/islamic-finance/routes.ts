/**
 * Islamic Finance Module Routes
 * Islamic finance tools and services
 */

import { Router } from 'express';
import * as IslamicFinanceController from './controllers/IslamicFinanceController';
import { clerkAuthenticate } from '../iam/middleware/clerkAuth';
import { apiLimiter } from '../shared/middleware/rateLimiter';
import { csrfValidator } from '../shared/middleware/csrf';
import { createBodyValidator } from '../shared/middleware/validation';

const router = Router();

// All routes require authentication
router.use(clerkAuthenticate);

// Sadaqah campaigns
router.get('/sadaqah', apiLimiter, IslamicFinanceController.getSadaqahCampaigns);
router.post(
  '/sadaqah/:id/donate',
  apiLimiter,
  csrfValidator,
  createBodyValidator('donation'),
  IslamicFinanceController.donate
);

// Waqf listings
router.get('/waqf', apiLimiter, IslamicFinanceController.getWaqfListings);

// Qard Hasan loans
router.get('/qard-hasan', apiLimiter, IslamicFinanceController.getQardHasanLoans);
router.post(
  '/qard-hasan',
  apiLimiter,
  csrfValidator,
  createBodyValidator('qardHasanLoan'),
  IslamicFinanceController.createQardHasanLoan
);

// Zakat calculator
router.post(
  '/zakat/calculate',
  apiLimiter,
  csrfValidator,
  createBodyValidator('zakatCalculation'),
  IslamicFinanceController.calculateZakat
);

export default router;
