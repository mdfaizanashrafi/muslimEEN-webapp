/**
 * Validation Middleware
 * Central validation utilities and schemas
 */

import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain, Result } from 'express-validator';
import { AppError } from './error.middleware';

/**
 * Validation schema interface
 */
export interface ValidationSchema {
  [key: string]: ValidationChain[];
}

/**
 * Run validation and handle errors
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors: Result = validationResult(req);

    if (errors.isEmpty()) {
      next();
      return;
    }

    // Format validation errors
    const extractedErrors = errors.array().map(err => ({
      field: err.type === 'field' ? err.path : err.type,
      message: err.msg
    }));

    const errorMessage = extractedErrors.map(e => `${e.field}: ${e.message}`).join(', ');
    const validationError = new AppError(errorMessage, 400, 'VALIDATION_ERROR');

    next(validationError);
  };
};

/**
 * Validate request body against schema
 */
export const validateRequest = (schema: ValidationSchema, route: string) => {
  const validations = schema[route] || [];
  return validate(validations);
};

/**
 * Common validation schemas
 */
export const validationSchemas = {
  // Auth validations
  auth: {
    register: [
      body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
      body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number'),
      body('firstName').trim().notEmpty().withMessage('First name is required'),
      body('lastName').trim().notEmpty().withMessage('Last name is required')
    ],
    login: [
      body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
      body('password').notEmpty().withMessage('Password is required')
    ],
    forgotPassword: [
      body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
    ],
    resetPassword: [
      body('token').notEmpty().withMessage('Reset token is required'),
      body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
    ]
  },

  // User validations
  user: {
    updateProfile: [
      body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
      body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
      body('phone').optional().trim(),
      body('location').optional().trim()
    ],
    changePassword: [
      body('currentPassword').notEmpty().withMessage('Current password is required'),
      body('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
    ]
  },

  // Marketplace validations
  marketplace: {
    createListing: [
      body('title').trim().notEmpty().withMessage('Title is required'),
      body('description').trim().notEmpty().withMessage('Description is required'),
      body('category').trim().notEmpty().withMessage('Category is required'),
      body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number')
    ],
    createService: [
      body('title').trim().notEmpty().withMessage('Title is required'),
      body('description').trim().notEmpty().withMessage('Description is required'),
      body('category').trim().notEmpty().withMessage('Category is required')
    ]
  },

  // Message validations
  message: {
    sendMessage: [
      body('recipientId').notEmpty().withMessage('Recipient ID is required'),
      body('content').trim().notEmpty().withMessage('Message content is required'),
      body('content').isLength({ max: 5000 }).withMessage('Message too long')
    ],
    createConversation: [
      body('participantIds').isArray({ min: 1 }).withMessage('At least one participant is required'),
      body('title').optional().trim()
    ]
  }
};

/**
 * Sanitize middleware - removes dangerous characters
 */
export const sanitize = (req: Request, _res: Response, next: NextFunction): void => {
  const sanitizeString = (str: string): string => {
    return str
      .replace(/[<>]/g, '') // Remove < and >
      .trim();
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  next();
};
