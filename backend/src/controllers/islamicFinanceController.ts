/**
 * Islamic Finance Controller
 * Handles Sadaqah, Waqf, Qard Hasan, and Zakat
 */

import { Response, NextFunction } from 'express';
import { Sadaqah, Waqf, QardHasan, ZakatCalculator } from '../models/IslamicFinance';
import { AuthenticatedRequest } from '../types';

// Sadaqah (Charity)
export const getSadaqahCampaigns = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const campaigns = await Sadaqah.getAll();
    res.json({ success: true, campaigns });
  } catch (error) { next(error); }
};

export const getSadaqahCampaign = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const campaign = await Sadaqah.getById(req.params.id);
    if (!campaign) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
      return;
    }
    res.json({ success: true, campaign });
  } catch (error) { next(error); }
};

export const donate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { amount, anonymous, message } = req.body;
    await Sadaqah.recordDonation(req.params.id, req.user!.id, amount, anonymous, message);
    res.json({ success: true, message: 'Donation recorded' });
  } catch (error) { next(error); }
};

// Waqf
export const getWaqf = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const waqf = await Waqf.getAll();
    res.json({ success: true, waqf });
  } catch (error) { next(error); }
};

// Qard Hasan
export const getQardHasanLoans = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const loans = await QardHasan.getAll();
    res.json({ success: true, loans });
  } catch (error) { next(error); }
};

export const createQardHasanLoan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const loan = await QardHasan.create({
      ...req.body,
      borrowerId: req.user!.id
    });
    res.status(201).json({ success: true, loan });
  } catch (error) { next(error); }
};

export const lendToQardHasan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { amount } = req.body;
    const loan = await QardHasan.addLender(req.params.id, req.user!.id, amount);
    res.json({ success: true, loan });
  } catch (error) { next(error); }
};

export const repayQardHasan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { amount } = req.body;
    const loan = await QardHasan.recordRepayment(req.params.id, amount);
    res.json({ success: true, loan });
  } catch (error) { next(error); }
};

// Zakat
export const calculateZakat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = ZakatCalculator.calculate(req.body);
    res.json({ success: true, result });
  } catch (error) { next(error); }
};
