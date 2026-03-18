/**
 * Auth Module Routes
 * Authentication and authorization endpoints
 */

import { Router } from 'express';
import * as AuthController from '../iam/controllers/AuthController';
import { authenticate } from '../iam/middleware/auth';
import { authLimiter } from '../shared/middleware/rateLimiter';
import { preventNoSqlInjection, sanitizeInput } from '../shared/middleware/sanitization';
import { createBodyValidator } from '../shared/middleware/validation';
import { auditLog, AUDIT_ACTIONS } from '../shared/middleware/auditLogger';
import { csrfTokenSetter, csrfValidator } from '../shared/middleware/csrf';

const router = Router();

// CSRF Token endpoint
router.get('/csrf-token', csrfTokenSetter, (req, res) => {
  res.json({
    success: true,
    csrfToken: res.locals.csrfToken,
  });
});

// Public auth endpoints
router.post(
  '/validate-invitation',
  authLimiter,
  preventNoSqlInjection,
  sanitizeInput,
  createBodyValidator('validateInvitation'),
  AuthController.validateInvitation
);

router.post(
  '/login',
  authLimiter,
  preventNoSqlInjection,
  sanitizeInput,
  createBodyValidator('login'),
  auditLog(AUDIT_ACTIONS.LOGIN, 'auth'),
  AuthController.login
);

router.post(
  '/register',
  authLimiter,
  preventNoSqlInjection,
  sanitizeInput,
  createBodyValidator('register'),
  auditLog(AUDIT_ACTIONS.USER_CREATE, 'user'),
  AuthController.register
);

// Protected auth endpoints
router.post(
  '/logout',
  authenticate,
  csrfValidator,
  auditLog(AUDIT_ACTIONS.LOGOUT, 'auth'),
  AuthController.logout
);

router.get('/me', authenticate, AuthController.getCurrentUser);

// Token refresh endpoint
router.post('/refresh', authenticate, csrfValidator, AuthController.refreshToken);

export default router;
