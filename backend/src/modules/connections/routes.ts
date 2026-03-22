/**
 * Connections Module Routes
 * User network and connection management
 */

import { Router } from 'express';
import * as ConnectionController from '../network/controllers/ConnectionController';
import { clerkAuthenticate } from '../iam/middleware/clerkAuth';
import { userLimiter } from '../shared/middleware/rateLimiter';
import { csrfValidator } from '../shared/middleware/csrf';
import { createBodyValidator } from '../shared/middleware/validation';
import { preventNoSqlInjection, sanitizeInput } from '../shared/middleware/sanitization';
import { auditLog, AUDIT_ACTIONS } from '../shared/middleware/auditLogger';

const router = Router();

// All routes require authentication
router.use(clerkAuthenticate);

// Get current user's connections
router.get('/', userLimiter, ConnectionController.getCurrentUserConnections);

// Get pending connection requests
router.get('/pending', userLimiter, ConnectionController.getCurrentUserPendingConnections);

// Send connection request
router.post(
  '/',
  userLimiter,
  csrfValidator,
  createBodyValidator('connectionRequest'),
  ConnectionController.sendConnectionRequestToUser
);

// Update connection status (accept/reject)
router.patch(
  '/:connectionId/status',
  userLimiter,
  csrfValidator,
  preventNoSqlInjection,
  sanitizeInput,
  auditLog(AUDIT_ACTIONS.CONNECTION_ACCEPT, 'connection'),
  ConnectionController.updateConnectionStatus
);

// Remove connection
router.delete(
  '/:connectionId',
  userLimiter,
  csrfValidator,
  preventNoSqlInjection,
  auditLog(AUDIT_ACTIONS.CONNECTION_DELETE, 'connection'),
  ConnectionController.removeConnection
);

export default router;
