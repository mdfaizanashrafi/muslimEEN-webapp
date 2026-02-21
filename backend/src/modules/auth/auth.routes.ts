/**
 * Authentication Routes
 * Express routes for authentication endpoints
 */

import { Router } from 'express';
import * as authController from './auth.controller';

// Import middleware from existing locations
const { authLimiter } = require('../../middleware/rateLimiter');
const { validate } = require('../../middleware/validation');
const { authenticate } = require('../../middleware/auth');

// Import validation schemas
import { loginSchema, registerSchema, validateInvitationSchema } from './auth.validation';

const router = Router();

/**
 * POST /validate-invitation
 * Validate invitation code
 */
router.post(
  '/validate-invitation',
  authLimiter,
  validate('validateInvitation'),
  authController.validateInvitation
);

/**
 * POST /login
 * Login user
 */
router.post(
  '/login',
  authLimiter,
  validate('login'),
  authController.login
);

/**
 * POST /register
 * Register user
 */
router.post(
  '/register',
  authLimiter,
  validate('register'),
  authController.register
);

/**
 * POST /logout
 * Logout user (protected)
 */
router.post(
  '/logout',
  authLimiter,
  authenticate,
  authController.logout
);

/**
 * GET /me
 * Get current user (protected)
 */
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

export default router;
