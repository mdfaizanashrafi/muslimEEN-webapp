/**
 * Marketplace Controller
 * Thin HTTP handler - delegates all logic to Marketplace model
 * Note: Marketplace model is already fairly simple, minimal changes needed
 * Responsibilities: HTTP request/response only
 */

import { Request, Response, NextFunction } from 'express';
import Marketplace from '../models/marketplace';

// ============================================================================
// GET LISTINGS
// ============================================================================

export const getMarketplaceListings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { vertical: category } = req.params;
    const listings = await Marketplace.getByVertical(category, req.query);

    res.json({
      success: true,
      listings,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// GET SINGLE LISTING
// ============================================================================

export const getListingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const listing = await Marketplace.getById(req.params.id);

    if (!listing) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Listing not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      listing,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// CREATE LISTING
// ============================================================================

export const createListing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { vertical: category } = req.params;
    const listing = await Marketplace.create(category, {
      ...req.body,
      providerId: req.user!.id,
    });

    res.status(201).json({
      success: true,
      listing,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// UPDATE LISTING
// ============================================================================

export const updateListing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const listing = await Marketplace.update(req.params.id, req.body);

    res.json({
      success: true,
      listing,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// DELETE LISTING
// ============================================================================

export const removeListing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await Marketplace.delete(req.params.id);

    res.json({
      success: true,
      message: 'Listing removed',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// INVEST (BUILD VERTICAL)
// ============================================================================

export const recordInvestment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { amount } = req.body;
    const listing = await Marketplace.incrementRaised(req.params.id, amount);

    res.json({
      success: true,
      listing,
      message: 'Investment recorded',
    });
  } catch (error) {
    next(error);
  }
};
