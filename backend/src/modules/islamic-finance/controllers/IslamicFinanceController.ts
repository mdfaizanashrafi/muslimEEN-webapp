/**
 * Islamic Finance Controller
 */

import { Request, Response, NextFunction } from 'express';
import * as IslamicFinanceService from '../services/IslamicFinanceService';
import { IslamicFinanceError } from '../services/IslamicFinanceService';

// Sadaqah
export const getSadaqahCampaigns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaigns = await IslamicFinanceService.getSadaqahCampaigns();
    res.json({ success: true, campaigns });
  } catch (error) { next(error); }
};

export const donate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const donation = await IslamicFinanceService.processDonation({
      campaignId: req.params.id,
      donorId: req.user!.id,
      amount: req.body.amount,
      anonymous: req.body.anonymous,
      message: req.body.message,
    });
    res.json({ success: true, donation, message: 'Donation recorded' });
  } catch (error) {
    if (error instanceof IslamicFinanceError) {
      res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
      return;
    }
    next(error);
  }
};

// Waqf
export const getWaqfListings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const waqf = await IslamicFinanceService.getWaqfListings();
    res.json({ success: true, waqf });
  } catch (error) { next(error); }
};

// Qard Hasan
export const getQardHasanLoans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const loans = await IslamicFinanceService.getQardHasanLoans();
    res.json({ success: true, loans });
  } catch (error) { next(error); }
};

export const createQardHasanLoan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const loan = await IslamicFinanceService.createQardHasanLoan({
      borrowerId: req.user!.id,
      ...req.body,
    });
    res.status(201).json({ success: true, loan });
  } catch (error) {
    if (error instanceof IslamicFinanceError) {
      res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
      return;
    }
    next(error);
  }
};

// Zakat
export const calculateZakat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = IslamicFinanceService.calculateZakat(req.body);
    res.json({ success: true, result });
  } catch (error) { next(error); }
};
