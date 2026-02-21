/**
 * Islamic Finance Routes
 * MuslimEEN Backend
 */

import { Router } from 'express';
import { IslamicFinanceController } from './islamicFinance.controller';

// Middleware will be imported from middleware directory
const { authenticate } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const { apiLimiter } = require('../../middleware/rateLimiter');

const router = Router();

// ==================== Sadaqah (Charity) ====================

// GET /api/islamic-finance/sadaqah - Get all Sadaqah campaigns
router.get('/sadaqah', authenticate, apiLimiter, IslamicFinanceController.getSadaqahCampaigns);

// GET /api/islamic-finance/sadaqah/:id - Get single Sadaqah campaign
router.get('/sadaqah/:id', authenticate, apiLimiter, IslamicFinanceController.getSadaqahCampaign);

// POST /api/islamic-finance/sadaqah/:id/donate - Donate to Sadaqah campaign
router.post('/sadaqah/:id/donate', authenticate, apiLimiter, validate('donation'), IslamicFinanceController.donate);

// ==================== Waqf ====================

// GET /api/islamic-finance/waqf - Get Waqf listings
router.get('/waqf', authenticate, apiLimiter, IslamicFinanceController.getWaqf);

// ==================== Qard Hasan ====================

// GET /api/islamic-finance/qardhasan - Get Qard Hasan loans
router.get('/qardhasan', authenticate, apiLimiter, IslamicFinanceController.getQardHasanLoans);

// POST /api/islamic-finance/qardhasan - Create Qard Hasan loan request
router.post('/qardhasan', authenticate, apiLimiter, validate('qardHasanLoan'), IslamicFinanceController.createQardHasanLoan);

// POST /api/islamic-finance/qardhasan/:id/lend - Lend to Qard Hasan loan
router.post('/qardhasan/:id/lend', authenticate, apiLimiter, IslamicFinanceController.lendToQardHasan);

// POST /api/islamic-finance/qardhasan/:id/repay - Record repayment for Qard Hasan
router.post('/qardhasan/:id/repay', authenticate, apiLimiter, IslamicFinanceController.repayQardHasan);

// ==================== Zakat Calculator ====================

// POST /api/islamic-finance/zakat/calculate - Calculate Zakat
router.post('/zakat/calculate', authenticate, apiLimiter, validate('zakatCalculation'), IslamicFinanceController.calculateZakat);

export default router;
