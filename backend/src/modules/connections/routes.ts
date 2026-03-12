/**
 * Connections Module Routes
 * User network and connection management
 */

import { Router } from 'express';
import { ConnectionController } from '../network/controllers/ConnectionController';
import { authenticate } from '../iam/middleware/auth';
import { userLimiter } from '../shared/middleware/rateLimiter';
import { csrfValidator } from '../shared/middleware/csrf';
import { createBodyValidator } from '../shared/middleware/validation';
import { preventNoSqlInjection, sanitizeInput } from '../shared/middleware/sanitization';
import { auditLog, AUDIT_ACTIONS } from '../shared/middleware/auditLogger';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Current user's connections
router.get('/me/connections', userLimiter, ConnectionController.getCurrentUserConnections);
router.get('/me/connections/pending', userLimiter, ConnectionController.getCurrentUserPendingConnections);
router.post(
  '/me/connections',
  userLimiter,
  csrfValidator,
  createBodyValidator('connectionRequest'),
  ConnectionController.sendConnectionRequestToUser
);

// Connection management by ID
router.patch(
  '/:connectionId/status',
  userLimiter,
  csrfValidator,
  preventNoSqlInjection,
  sanitizeInput,
  auditLog(AUDIT_ACTIONS.CONNECTION_ACCEPT, 'connection'),
  ConnectionController.updateConnectionStatus
);

router.delete(
  '/:connectionId',
  userLimiter,
  csrfValidator,
  preventNoSqlInjection,
  auditLog(AUDIT_ACTIONS.CONNECTION_DELETE, 'connection'),
  ConnectionController.removeConnection
);

export default router;
