/**
 * Marketplace Validation Schemas
 * Using Joi for request validation
 */

import Joi from 'joi';

export const createMarketplaceItem = Joi.object({
  category: Joi.string().required(),
  subcategory: Joi.string().optional(),
  title: Joi.string().min(5).max(255).required(),
  description: Joi.string().min(20).max(2000).required(),
  location: Joi.string().max(255).optional(),
  rate: Joi.string().max(100).optional(),
  salary: Joi.string().max(100).optional(),
  seeking: Joi.number().integer().positive().optional(),
  price: Joi.string().max(100).optional(),
  coverage: Joi.string().max(100).optional(),
  units: Joi.number().integer().positive().optional()
});

export const marketplaceFilter = Joi.object({
  category: Joi.string().optional(),
  location: Joi.string().optional(),
  trustScoreMin: Joi.number().integer().min(0).max(1000).optional(),
  search: Joi.string().max(100).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0)
});

export const investment = Joi.object({
  amount: Joi.number().positive().required()
});
