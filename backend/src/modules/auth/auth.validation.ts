/**
 * Authentication Validation
 * Joi schemas for auth requests
 */

import Joi from 'joi';

/**
 * Login validation schema
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  invitationCode: Joi.string().alphanum().length(12).optional()
});

/**
 * Register validation schema
 */
export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(2).max(100).required(),
  lastName: Joi.string().min(2).max(100).required(),
  invitationCode: Joi.string().alphanum().length(12).required()
});

/**
 * Validate invitation schema
 */
export const validateInvitationSchema = Joi.object({
  invitationCode: Joi.string().alphanum().length(12).required()
});

/**
 * Validation schemas map
 */
export const authSchemas = {
  login: loginSchema,
  register: registerSchema,
  validateInvitation: validateInvitationSchema
};
