/**
 * Validation Middleware
 * Request validation using Joi
 */

const Joi = require('joi');

// Validation schemas
const schemas = {
  // Auth
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    invitationCode: Joi.string().alphanum().length(12).optional()
  }),

  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(100).required(),
    lastName: Joi.string().min(2).max(100).required(),
    invitationCode: Joi.string().alphanum().length(12).required()
  }),

  validateInvitation: Joi.object({
    invitationCode: Joi.string().alphanum().length(12).required()
  }),

  // User
  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(100).optional(),
    lastName: Joi.string().min(2).max(100).optional(),
    bio: Joi.string().max(500).optional(),
    location: Joi.string().max(255).optional(),
    industry: Joi.string().max(100).optional(),
    skills: Joi.array().items(Joi.string()).max(50).optional()
  }),

  // Marketplace
  createMarketplaceItem: Joi.object({
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
  }),

  marketplaceFilter: Joi.object({
    category: Joi.string().optional(),
    location: Joi.string().optional(),
    trustScoreMin: Joi.number().integer().min(0).max(1000).optional(),
    search: Joi.string().max(100).optional(),
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0)
  }),

  // Islamic Finance
  zakatCalculation: Joi.object({
    cash: Joi.number().min(0).default(0),
    gold: Joi.number().min(0).default(0),
    silver: Joi.number().min(0).default(0),
    investments: Joi.number().min(0).default(0),
    businessAssets: Joi.number().min(0).default(0),
    debts: Joi.number().min(0).default(0),
    nisabType: Joi.string().valid('gold', 'silver').default('gold')
  }),

  donation: Joi.object({
    amount: Joi.number().positive().required(),
    anonymous: Joi.boolean().default(false),
    message: Joi.string().max(500).optional()
  }),

  qardHasanLoan: Joi.object({
    amount: Joi.number().positive().required(),
    purpose: Joi.string().min(10).max(500).required(),
    term: Joi.number().integer().positive().max(60).required()
  }),

  // Connection
  connectionRequest: Joi.object({
    recipientId: Joi.string().uuid().required()
  })
};

/**
 * Validation middleware factory
 */
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Unknown validation schema'
        }
      });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const messages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: messages
        }
      });
    }

    // Replace body with validated value
    req.body = value;
    next();
  };
};

/**
 * Query validation middleware
 */
const validateQuery = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      return next();
    }

    const { error, value } = schema.validate(req.query, {
      abortEarly: false
    });

    if (error) {
      const messages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: messages
        }
      });
    }

    req.query = value;
    next();
  };
};

module.exports = {
  validate,
  validateQuery,
  schemas
};
