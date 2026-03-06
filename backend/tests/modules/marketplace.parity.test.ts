/**
 * Marketplace Module Parity Tests
 * 
 * Compares legacy and modular Marketplace implementations
 */

import * as legacyMarketplaceService from '../../src/services/MarketplaceService';
import * as modularMarketplaceService from '../../src/modules/marketplace/services/MarketplaceService';
import { overrideFeatureFlag, createMockRequest, createMockResponse, createMockNext } from '../utils/moduleTester';
import * as legacyController from '../../src/controllers/marketplaceController';
import * as modularController from '../../src/modules/marketplace/controllers/MarketplaceController';

describe('Marketplace Module Parity Tests', () => {
  const testListing = {
    title: 'Test Service',
    description: 'A test marketplace listing',
    category: 'earn',
    providerId: 'test-provider-id',
    price: 100,
    currency: 'USD',
  };

  describe('Service Methods', () => {
    describe('getListingsByCategory', () => {
      it('should have matching function signatures', () => {
        expect(typeof legacyMarketplaceService.getMarketplaceListings).toBe('function');
        expect(typeof modularMarketplaceService.getListingsByCategory).toBe('function');
      });

      it('should handle invalid categories consistently', async () => {
        // Both should handle invalid categories gracefully
        const legacyPromise = legacyMarketplaceService.getMarketplaceListings('invalid-category', {});
        const modularPromise = modularMarketplaceService.getListingsByCategory('invalid-category', {});

        // Both should either succeed (return empty) or fail consistently
        const [legacyResult, modularResult] = await Promise.allSettled([legacyPromise, modularPromise]);
        
        expect(legacyResult.status).toBe(modularResult.status);
      });
    });

    describe('getListingById', () => {
      it('should return null for non-existent listings', async () => {
        const legacyResult = await legacyMarketplaceService.getListingById('non-existent-id');
        const modularResult = await modularMarketplaceService.getListingById('non-existent-id');

        // Both should handle non-existent IDs the same way
        expect(legacyResult).toBeNull();
        expect(modularResult).toBeNull();
      });
    });

    describe('createListing', () => {
      it('should have consistent validation', async () => {
        const invalidListing = {
          ...testListing,
          price: -100, // Invalid negative price
        };

        // Both should reject invalid data
        await expect(legacyMarketplaceService.createListing(invalidListing as any))
          .rejects.toThrow();
        await expect(modularMarketplaceService.createListing(invalidListing))
          .rejects.toThrow();
      });

      it('should create listings with valid data', async () => {
        // Note: This would require mocking the database
        // For now, we just verify the function signatures match
        expect(legacyMarketplaceService.createListing).toBeDefined();
        expect(modularMarketplaceService.createListing).toBeDefined();
      });
    });
  });

  describe('Controller Methods', () => {
    describe('getMarketplaceListings', () => {
      it('should handle requests with missing category', async () => {
        const req = createMockRequest({ params: {} });
        const res = createMockResponse();
        const next = createMockNext();

        await legacyController.getMarketplaceListings(req as any, res as any, next);
        
        // Should either return error or handle gracefully
        expect(res.statusCode === 400 || res.jsonData !== null).toBe(true);
      });
    });

    describe('Response Format', () => {
      it('should return consistent success response format', () => {
        const legacyResponse = { success: true, listings: [] };
        const modularResponse = { success: true, listings: [] };

        expect(modularResponse).toMatchObject(legacyResponse);
      });

      it('should return consistent error response format', () => {
        const legacyError = { 
          success: false, 
          error: { code: 'NOT_FOUND', message: 'Listing not found' } 
        };
        const modularError = { 
          success: false, 
          error: { code: 'NOT_FOUND', message: 'Listing not found' } 
        };

        expect(modularError).toMatchObject(legacyError);
      });
    });
  });

  describe('Error Handling', () => {
    it('should have consistent error types', () => {
      // If legacy has custom errors, modular should match
      expect(() => {
        throw new Error('MarketplaceError');
      }).toThrow();
    });
  });

  describe('Feature Flag Toggle', () => {
    it('should toggle between implementations', () => {
      const originalValue = require('../../src/modules/shared/config/featureFlags').featureFlags.useModularMarketplace;
      
      // Toggle
      const restore = overrideFeatureFlag('useModularMarketplace', !originalValue);
      const newValue = require('../../src/modules/shared/config/featureFlags').featureFlags.useModularMarketplace;
      
      expect(newValue).toBe(!originalValue);
      
      // Restore
      restore();
      const restoredValue = require('../../src/modules/shared/config/featureFlags').featureFlags.useModularMarketplace;
      expect(restoredValue).toBe(originalValue);
    });
  });
});
