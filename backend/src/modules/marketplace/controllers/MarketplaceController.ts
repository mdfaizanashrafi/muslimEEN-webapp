/**
 * Marketplace Controller
 * 
 * SECURITY FIXES APPLIED:
 * - Fixed mass assignment vulnerability (whitelist approach)
 * - Added ownership verification for update/delete operations
 * - Added admin override for moderation
 * - Added input validation
 */

import { Request, Response, NextFunction } from 'express';
import * as MarketplaceService from '../services/MarketplaceService';
import { logger } from '../../shared/utils/logger';

// SECURITY: Whitelist of allowed fields for marketplace listings
const ALLOWED_LISTING_FIELDS = [
  'title',
  'description',
  'location',
  'rate',
  'salary',
  'seeking',
  'price',
  'coverage',
  'units',
];

/**
 * Sanitize listing data to prevent mass assignment
 * SECURITY FIX: Only allow whitelisted fields
 */
const sanitizeListingData = (data: any): any => {
  const sanitized: any = {};
  
  for (const field of ALLOWED_LISTING_FIELDS) {
    if (data[field] !== undefined) {
      sanitized[field] = data[field];
    }
  }
  
  // Log attempted mass assignment
  const invalidFields = Object.keys(data).filter(key => !ALLOWED_LISTING_FIELDS.includes(key));
  if (invalidFields.length > 0) {
    logger.warn('Attempted mass assignment in marketplace listing', {
      invalidFields,
      timestamp: new Date().toISOString(),
    });
  }
  
  return sanitized;
};

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
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    // SECURITY FIX: Use whitelist approach instead of spreading req.body
    const listingData = {
      ...sanitizeListingData(req.body),
      category,
      providerId: userId,
    };

    const listing = await MarketplaceService.createListing(listingData);
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
    const listingId = req.params.id;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    // SECURITY FIX: Verify ownership before update
    const existingListing = await MarketplaceService.getListingById(listingId);
    if (!existingListing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Listing not found' } });
      return;
    }

    // Check ownership or admin role
    const isOwner = existingListing.providerId === userId;
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';
    
    if (!isOwner && !isAdmin) {
      logger.warn('Unauthorized attempt to update marketplace listing', {
        listingId,
        attemptedBy: userId,
        owner: existingListing.providerId,
        timestamp: new Date().toISOString(),
      });
      
      res.status(403).json({ 
        success: false, 
        error: { code: 'FORBIDDEN', message: 'You can only update your own listings' } 
      });
      return;
    }

    // SECURITY FIX: Sanitize input data
    const updateData = sanitizeListingData(req.body);
    
    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ 
        success: false, 
        error: { code: 'NO_VALID_FIELDS', message: 'No valid fields provided for update' } 
      });
      return;
    }

    const listing = await MarketplaceService.updateListing(listingId, userId, updateData, isAdmin);
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
    const listingId = req.params.id;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    // SECURITY FIX: Verify ownership before delete
    const existingListing = await MarketplaceService.getListingById(listingId);
    if (!existingListing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Listing not found' } });
      return;
    }

    // Check ownership or admin role
    const isOwner = existingListing.providerId === userId;
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';
    
    if (!isOwner && !isAdmin) {
      logger.warn('Unauthorized attempt to delete marketplace listing', {
        listingId,
        attemptedBy: userId,
        owner: existingListing.providerId,
        timestamp: new Date().toISOString(),
      });
      
      res.status(403).json({ 
        success: false, 
        error: { code: 'FORBIDDEN', message: 'You can only delete your own listings' } 
      });
      return;
    }

    await MarketplaceService.removeListing(listingId, userId, isAdmin);
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
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ 
        success: false, 
        error: { code: 'INVALID_AMOUNT', message: 'Amount must be a positive number' } 
      });
      return;
    }

    const investment = await MarketplaceService.recordInvestment(req.params.id, userId, amount);
    res.json({ success: true, investment, message: 'Investment recorded' });
  } catch (error) {
    next(error);
  }
};
