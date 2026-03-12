/**
 * Marketplace Service
 * 
 * SECURITY FIXES APPLIED:
 * - Added ownership parameter to update and remove operations
 * - Added admin override capability
 * - Added authorization checks
 */

import * as MarketplaceRepository from '../repositories/MarketplaceRepository';
import { eventBus, DomainEvents } from '../../shared/events/EventBus';
import { logger } from '../../shared/utils/logger';

export const getListingsByCategory = async (category: string, filters: any): Promise<any[]> => {
  return MarketplaceRepository.findByCategory(category, filters);
};

export const getListingById = async (id: string): Promise<any | null> => {
  return MarketplaceRepository.findById(id);
};

export const createListing = async (data: any): Promise<any> => {
  const listing = await MarketplaceRepository.create(data);
  
  await eventBus.publish(DomainEvents.LISTING_CREATED, {
    listingId: listing.id,
    category: listing.category,
    providerId: listing.provider_id,
    timestamp: new Date(),
  });
  
  return listing;
};

/**
 * Update listing with ownership verification
 * SECURITY FIX: Requires providerId for authorization
 */
export const updateListing = async (
  id: string, 
  providerId: string, 
  updates: any,
  isAdmin: boolean = false
): Promise<any> => {
  let listing;
  
  if (isAdmin) {
    // Admin can update any listing - fetch first to get provider_id
    const existing = await MarketplaceRepository.findById(id);
    if (!existing) {
      throw new Error('LISTING_NOT_FOUND');
    }
    // Admin update uses the original provider_id
    listing = await MarketplaceRepository.update(id, existing.providerId, updates);
    
    logger.info('Admin updated marketplace listing', {
      listingId: id,
      adminId: providerId,
      originalProvider: existing.providerId,
    });
  } else {
    // Regular user can only update their own listings
    listing = await MarketplaceRepository.update(id, providerId, updates);
  }
  
  if (!listing) {
    throw new Error('LISTING_NOT_FOUND_OR_UNAUTHORIZED');
  }
  
  await eventBus.publish(DomainEvents.LISTING_UPDATED, {
    listingId: id,
    timestamp: new Date(),
  });
  
  return listing;
};

/**
 * Remove listing with ownership verification
 * SECURITY FIX: Requires providerId for authorization
 */
export const removeListing = async (
  id: string, 
  providerId: string,
  isAdmin: boolean = false
): Promise<void> => {
  let success;
  
  if (isAdmin) {
    success = await MarketplaceRepository.removeAsAdmin(id);
    
    logger.info('Admin deleted marketplace listing', {
      listingId: id,
      adminId: providerId,
    });
  } else {
    success = await MarketplaceRepository.remove(id, providerId);
  }
  
  if (!success) {
    throw new Error('LISTING_NOT_FOUND_OR_UNAUTHORIZED');
  }
};

export const recordInvestment = async (listingId: string, investorId: string, amount: number): Promise<any> => {
  const investment = await MarketplaceRepository.recordInvestment(listingId, investorId, amount);
  
  await eventBus.publish(DomainEvents.INVESTMENT_RECORDED, {
    listingId,
    investorId,
    amount,
    timestamp: new Date(),
  });
  
  return investment;
};
