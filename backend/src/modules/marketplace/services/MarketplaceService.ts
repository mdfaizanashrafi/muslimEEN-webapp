/**
 * Marketplace Service
 */

import * as MarketplaceRepository from '../repositories/MarketplaceRepository';
import { eventBus, DomainEvents } from '../../shared/events/EventBus';

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

export const updateListing = async (id: string, updates: any): Promise<any> => {
  const listing = await MarketplaceRepository.update(id, updates);
  
  await eventBus.publish(DomainEvents.LISTING_UPDATED, {
    listingId: id,
    timestamp: new Date(),
  });
  
  return listing;
};

export const removeListing = async (id: string): Promise<void> => {
  await MarketplaceRepository.remove(id);
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
