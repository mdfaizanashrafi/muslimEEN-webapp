/**
 * User Validation Schemas
 * Request validation using Joi
 */

import Joi from 'joi';

/**
 * Update Profile Schema
 * Same validation rules as original validation.js
 */
export const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(100).optional(),
  lastName: Joi.string().min(2).max(100).optional(),
  bio: Joi.string().max(500).optional(),
  location: Joi.string().max(255).optional(),
  industry: Joi.string().max(100).optional(),
  skills: Joi.array().items(Joi.string()).max(50).optional()
});

/**
 * Connection Request Schema
 * Same validation rules as original validation.js
 */
export const connectionRequestSchema = Joi.object({
  recipientId: Joi.string().uuid().required()
});

/**
 * Notification Query Schema
 */
export const notificationQuerySchema = Joi.object({
  unreadOnly: Joi.string().valid('true', 'false').optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  offset: Joi.number().integer().min(0).optional()
});

/**
 * Validation result interface
 */
export interface ValidationResult<T> {
  error?: Joi.ValidationError;
  value: T;
}

/**
 * Validate update profile request
 */
export function validateUpdateProfile(data: unknown): ValidationResult<{
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  industry?: string;
  skills?: string[];
}> {
  return updateProfileSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
}

/**
 * Validate connection request
 */
export function validateConnectionRequest(data: unknown): ValidationResult<{
  recipientId: string;
}> {
  return connectionRequestSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
}

/**
 * Validate notification query
 */
export function validateNotificationQuery(data: unknown): ValidationResult<{
  unreadOnly?: string;
  limit?: number;
  offset?: number;
}> {
  return notificationQuerySchema.validate(data, {
    abortEarly: false
  });
}

/**
 * Format validation errors
 */
export function formatValidationErrors(error: Joi.ValidationError): string[] {
  return error.details.map(detail => detail.message);
}
