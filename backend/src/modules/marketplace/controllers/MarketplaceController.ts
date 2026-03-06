/**
 * Marketplace Controller
 */

import { Request, Response, NextFunction } from 'express';
import * as MarketplaceService from '../services/MarketplaceService';

export const getMarketplaceListings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { vertical: category } = req.params;
    const listings = await MarketplaceService.getListingsByCategory(category, req.query);
    res.json({ success: true, listings });
  } catch (error) {
    next(error);
  }
};

export const getListingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const listing = await MarketplaceService.getListingById(req.params.id);
    if (!listing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Listing not found' } });
      return;
    }
    res.json({ success: true, listing });
  } catch (error) {
    next(error);
  }
};

export const createListing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { vertical: category } = req.params;
    const listing = await MarketplaceService.createListing({
      ...req.body,
      category,
      providerId: req.user!.id,
    });
    res.status(201).json({ success: true, listing });
  } catch (error) {
    next(error);
  }
};

export const updateListing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const listing = await MarketplaceService.updateListing(req.params.id, req.body);
    res.json({ success: true, listing });
  } catch (error) {
    next(error);
  }
};

export const removeListing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await MarketplaceService.removeListing(req.params.id);
    res.json({ success: true, message: 'Listing removed' });
  } catch (error) {
    next(error);
  }
};

export const recordInvestment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { amount } = req.body;
    const investment = await MarketplaceService.recordInvestment(req.params.id, req.user!.id, amount);
    res.json({ success: true, investment, message: 'Investment recorded' });
  } catch (error) {
    next(error);
  }
};
