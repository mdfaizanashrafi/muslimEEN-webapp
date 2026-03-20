/**
 * Auth Module Routes
 * Authentication and authorization endpoints
 * 
 * MIGRATED: Now uses Clerk for authentication
 * DATE: 2026-03-20
 */

import { Router } from 'express';
import * as AuthController from '../iam/controllers/AuthController';
import { clerkAuthenticate } from '../iam/middleware/clerkAuth';
import { authLimiter } from '../shared/middleware/rateLimiter';
import { preventNoSqlInjection, sanitizeInput } from '../shared/middleware/sanitization';
import { createBodyValidator } from '../shared/middleware/validation';
import { auditLog, AUDIT_ACTIONS } from '../shared/middleware/auditLogger';

const router = Router();

// Public auth endpoints
router.post(
  '/validate-invitation',
  authLimiter,
  preventNoSqlInjection,
  sanitizeInput,
  createBodyValidator('validateInvitation'),
  AuthController.validateInvitation
);

// NOTE: Login is now handled by Clerk's frontend components
// These endpoints are kept for backward compatibility during migration
// They return 501 to indicate the client should use Clerk

router.post(
  '/login',
  authLimiter,
  preventNoSqlInjection,
  sanitizeInput,
  (req, res) => {
    res.status(501).json({
      success: false,
      error: {
        code: 'AUTH_METHOD_DEPRECATED',
        message: 'Direct login is no longer supported. Use Clerk authentication.',
        documentation: 'https://clerk.com/docs',
      },
    });
  }
);

router.post(
  '/register',
  authLimiter,
  preventNoSqlInjection,
  sanitizeInput,
  (req, res) => {
    res.status(501).json({
      success: false,
      error: {
        code: 'AUTH_METHOD_DEPRECATED',
        message: 'Direct registration is no longer supported. Use Clerk authentication.',
        documentation: 'https://clerk.com/docs',
      },
    });
  }
);

// Protected auth endpoints (require Clerk authentication)
router.post(
  '/logout',
  clerkAuthenticate,
  auditLog(AUDIT_ACTIONS.LOGOUT, 'auth'),
  AuthController.logout
);

router.get('/me', clerkAuthenticate, AuthController.getCurrentUser);

// Token refresh endpoint - Now handled by Clerk automatically
router.post('/refresh', clerkAuthenticate, (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'AUTH_METHOD_DEPRECATED',
      message: 'Token refresh is handled automatically by Clerk.',
    },
  });
});

// Webhook endpoint for Clerk events (if needed)
router.post('/webhook', (req, res) => {
  // Handle Clerk webhooks here
  // Example: user.created, user.updated, user.deleted
  res.json({ received: true });
});

export default router;
