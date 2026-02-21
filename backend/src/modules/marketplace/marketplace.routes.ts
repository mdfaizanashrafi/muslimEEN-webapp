/**
 * Marketplace Routes
 * Routes for EARN, BUILD, LIVE, PROTECT verticals
 */

import { Router } from 'express';
import * as marketplaceController from './marketplace.controller';
import { authenticate } from '../../middleware/auth';
import { marketplaceLimiter } from '../../middleware/rateLimiter';
import { validate, validateQuery } from '../../middleware/validation';

const router = Router();

// GET /api/marketplace/:vertical - Get items by vertical
router.get(
  '/:vertical',
  authenticate,
  marketplaceLimiter,
  validateQuery('marketplaceFilter'),
  marketplaceController.getItems
);

// GET /api/marketplace/:vertical/:id - Get single item
router.get(
  '/:vertical/:id',
  authenticate,
  marketplaceLimiter,
  marketplaceController.getItem
);

// POST /api/marketplace/:vertical - Create item
router.post(
  '/:vertical',
  authenticate,
  marketplaceLimiter,
  validate('createMarketplaceItem'),
  marketplaceController.createItem
);

// PUT /api/marketplace/:vertical/:id - Update item
router.put(
  '/:vertical/:id',
  authenticate,
  marketplaceLimiter,
  marketplaceController.updateItem
);

// DELETE /api/marketplace/:vertical/:id - Delete item
router.delete(
  '/:vertical/:id',
  authenticate,
  marketplaceLimiter,
  marketplaceController.deleteItem
);

// POST /api/marketplace/build/:id/invest - Invest in BUILD item
router.post(
  '/build/:id/invest',
  authenticate,
  marketplaceLimiter,
  marketplaceController.invest
);

export default router;
