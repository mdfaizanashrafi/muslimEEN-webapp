/**
 * Islamic Finance Controller
 * Handles Islamic Finance HTTP requests
 */

import { Request, Response, NextFunction } from 'express';
import {
  IslamicFinanceService,
  CampaignNotFoundError,
  LoanNotFoundError,
  InvalidRequestError,
  AmountExceedsNeedError,
  ForbiddenError
} from './islamicFinance.service';
import { DonationInput, QardHasanCreateInput, LendingInput, RepaymentInput, ZakatCalculationInput } from './islamicFinance.types';

export class IslamicFinanceController {
  // ==================== Sadaqah (Charity) ====================

  /**
   * Get Sadaqah campaigns
   * GET /api/islamic-finance/sadaqah
   */
  static async getSadaqahCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const campaigns = await IslamicFinanceService.getSadaqahCampaigns();

      res.json({
        success: true,
        items: campaigns
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single Sadaqah campaign
   * GET /api/islamic-finance/sadaqah/:id
   */
  static async getSadaqahCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const campaign = await IslamicFinanceService.getSadaqahCampaign(id);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Campaign not found'
          }
        });
      }

      res.json({
        success: true,
        item: campaign
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Donate to Sadaqah campaign
   * POST /api/islamic-finance/sadaqah/:id/donate
   */
  static async donate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input: DonationInput = req.body;

      const result = await IslamicFinanceService.donate(id, req.user.id, input);

      res.json({
        success: true,
        donation: result.donation,
        message: 'Donation recorded successfully'
      });
    } catch (error) {
      if (error instanceof CampaignNotFoundError) {
        return res.status(404).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      }
      next(error);
    }
  }

  // ==================== Waqf ====================

  /**
   * Get Waqf listings
   * GET /api/islamic-finance/waqf
   */
  static async getWaqf(req: Request, res: Response, next: NextFunction) {
    try {
      const waqf = await IslamicFinanceService.getWaqf();

      res.json({
        success: true,
        items: waqf
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== Qard Hasan ====================

  /**
   * Get Qard Hasan loans
   * GET /api/islamic-finance/qardhasan
   */
  static async getQardHasanLoans(req: Request, res: Response, next: NextFunction) {
    try {
      const loans = await IslamicFinanceService.getQardHasanLoans();

      res.json({
        success: true,
        items: loans
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create Qard Hasan loan request
   * POST /api/islamic-finance/qardhasan
   */
  static async createQardHasanLoan(req: Request, res: Response, next: NextFunction) {
    try {
      const input: QardHasanCreateInput = {
        ...req.body,
        borrowerId: req.user.id
      };

      const loan = await IslamicFinanceService.createQardHasanLoan(input);

      res.status(201).json({
        success: true,
        item: loan,
        message: 'Loan request created'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lend to Qard Hasan loan
   * POST /api/islamic-finance/qardhasan/:id/lend
   */
  static async lendToQardHasan(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input: LendingInput = req.body;

      const updated = await IslamicFinanceService.lendToQardHasan(id, req.user.id, input);

      res.json({
        success: true,
        item: updated,
        message: 'Lending recorded'
      });
    } catch (error) {
      if (error instanceof LoanNotFoundError) {
        return res.status(404).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      }
      if (error instanceof InvalidRequestError || error instanceof AmountExceedsNeedError) {
        return res.status(400).json({
          success: false,
          error: {
            code: (error as InvalidRequestError | AmountExceedsNeedError).code,
            message: error.message
          }
        });
      }
      next(error);
    }
  }

  /**
   * Record repayment for Qard Hasan
   * POST /api/islamic-finance/qardhasan/:id/repay
   */
  static async repayQardHasan(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input: RepaymentInput = req.body;

      const updated = await IslamicFinanceService.repayQardHasan(id, req.user.id, input);

      res.json({
        success: true,
        item: updated,
        message: 'Repayment recorded'
      });
    } catch (error) {
      if (error instanceof LoanNotFoundError) {
        return res.status(404).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      }
      if (error instanceof ForbiddenError) {
        return res.status(403).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      }
      next(error);
    }
  }

  // ==================== Zakat Calculator ====================

  /**
   * Calculate Zakat
   * POST /api/islamic-finance/zakat/calculate
   */
  static async calculateZakat(req: Request, res: Response, next: NextFunction) {
    try {
      const input: ZakatCalculationInput = req.body;

      const calculation = IslamicFinanceService.calculateZakat(input);

      res.json({
        success: true,
        calculation
      });
    } catch (error) {
      next(error);
    }
  }
}
