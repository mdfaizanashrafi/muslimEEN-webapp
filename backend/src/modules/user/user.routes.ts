/**
 * User Routes
 * Route definitions for user module
 */

import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getTrustScore,
  getTrustScoreHistory,
  getConnections,
  getPendingConnections,
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from './user.controller';

// Import original middleware (JavaScript modules)
const { authenticate } = require('../../middleware/auth');
const { userLimiter } = require('../../middleware/rateLimiter');

const router = Router();

// Apply authentication and rate limiting to all user routes
router.use(authenticate);
router.use(userLimiter);

/**
 * Profile Routes
 */

// GET /user/profile - Get user profile
router.get('/profile', getProfile);

// PUT /user/profile - Update user profile
router.put('/profile', updateProfile);

/**
 * Trust Score Routes
 */

// GET /user/trust-score - Get user trust score
router.get('/trust-score', getTrustScore);

// GET /user/trust-score/history - Get trust score history
router.get('/trust-score/history', getTrustScoreHistory);

/**
 * Connection Routes
 */

// GET /user/connections - Get user connections
router.get('/connections', getConnections);

// GET /user/connections/pending - Get pending connection requests
router.get('/connections/pending', getPendingConnections);

// POST /user/connections - Send connection request
router.post('/connections', sendConnectionRequest);

// POST /user/connections/:id/accept - Accept connection request
router.post('/connections/:id/accept', acceptConnectionRequest);

// POST /user/connections/:id/reject - Reject connection request
router.post('/connections/:id/reject', rejectConnectionRequest);

/**
 * Notification Routes
 */

// GET /user/notifications - Get user notifications
router.get('/notifications', getNotifications);

// PUT /user/notifications/:id/read - Mark notification as read
router.put('/notifications/:id/read', markNotificationRead);

// PUT /user/notifications/read-all - Mark all notifications as read
router.put('/notifications/read-all', markAllNotificationsRead);

export default router;
