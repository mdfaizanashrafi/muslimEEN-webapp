/**
 * Islamic Finance Controller
 * Thin HTTP handler - delegates all logic to IslamicFinanceService
 * Responsibilities: HTTP request/response only
 */

import { Request, Response, NextFunction } from 'express';
import * as IslamicFinanceService from '../services/IslamicFinanceService';
import { IslamicFinanceError } from '../services/IslamicFinanceService';

// ============================================================================
// SADAQAH (CHARITY)
// ============================================================================

export const getSadaqahCampaigns = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const campaigns = await IslamicFinanceService.getSadaqahCampaigns();

    res.json({
      success: true,
      campaigns,
    });
  } catch (error) {
    next(error);
  }
};

export const getSadaqahCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const campaignId = req.params.id;
    const campaign = await IslamicFinanceService.getSadaqahCampaign(campaignId);

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      campaign,
    });
  } catch (error) {
    next(error);
  }
};

export const donate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const campaignId = req.params.id;
    const donorId = req.user!.id;
    const { amount, anonymous, message } = req.body;

    const donation = await IslamicFinanceService.processDonation({
      campaignId,
      donorId,
      amount,
      anonymous,
      message,
    });

    res.json({
      success: true,
      message: 'Donation recorded',
      donation,
    });
  } catch (error) {
    if (error instanceof IslamicFinanceError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }
    next(error);
  }
};

// ============================================================================
// WAQF
// ============================================================================

export const getWaqfListings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const waqfListings = await IslamicFinanceService.getWaqfListings();

    res.json({
      success: true,
      waqf: waqfListings,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// QARD HASAN
// ============================================================================

export const getQardHasanLoans = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const loans = await IslamicFinanceService.getQardHasanLoans();

    res.json({
      success: true,
      loans,
    });
  } catch (error) {
    next(error);
  }
};

export const createQardHasanLoan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const borrowerId = req.user!.id;
    const { amount, purpose, term } = req.body;

    const loan = await IslamicFinanceService.createQardHasanLoan({
      borrowerId,
      amount,
      purpose,
      term,
    });

    res.status(201).json({
      success: true,
      loan,
    });
  } catch (error) {
    if (error instanceof IslamicFinanceError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }
    next(error);
  }
};

export const lendToQardHasan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const loanId = req.params.id;
    const lenderId = req.user!.id;
    const { amount } = req.body;

    const loan = await IslamicFinanceService.addLenderToLoan({
      loanId,
      lenderId,
      amount,
    });

    res.json({
      success: true,
      loan,
    });
  } catch (error) {
    if (error instanceof IslamicFinanceError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }
    next(error);
  }
};

export const repayQardHasan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const loanId = req.params.id;
    const { amount } = req.body;

    const loan = await IslamicFinanceService.processRepayment({
      loanId,
      amount,
    });

    res.json({
      success: true,
      loan,
    });
  } catch (error) {
    if (error instanceof IslamicFinanceError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }
    next(error);
  }
};

// ============================================================================
// ZAKAT CALCULATOR
// ============================================================================

export const calculateZakat = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = IslamicFinanceService.calculateZakat(req.body);

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    next(error);
  }
};
