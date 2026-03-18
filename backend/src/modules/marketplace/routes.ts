/**
 * Marketplace Module Routes
 * Marketplace listings and management
 */

import { Router } from 'express';
import * as MarketplaceController from './controllers/MarketplaceController';
import { authenticate } from '../iam/middleware/auth';
import { marketplaceLimiter } from '../shared/middleware/rateLimiter';
import { csrfValidator } from '../shared/middleware/csrf';
import { createBodyValidator, createQueryValidator } from '../shared/middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Marketplace listings by vertical
router.get('/:vertical', marketplaceLimiter, createQueryValidator('marketplaceFilter'), MarketplaceController.getMarketplaceListings);
router.get('/:vertical/:id', marketplaceLimiter, MarketplaceController.getListingById);
router.post(
  '/:vertical',
  marketplaceLimiter,
  csrfValidator,
  createBodyValidator('createMarketplaceItem'),
  MarketplaceController.createListing
);
router.put('/:vertical/:id', marketplaceLimiter, csrfValidator, MarketplaceController.updateListing);
router.delete('/:vertical/:id', marketplaceLimiter, csrfValidator, MarketplaceController.removeListing);
router.post('/:vertical/:id/invest', marketplaceLimiter, csrfValidator, MarketplaceController.recordInvestment);

export default router;
