/**
 * User Controller
 * Handles user profile, connections, and trust score
 */

const User = require('../models/User');
const Connection = require('../models/Connection');
const TrustScore = require('../models/TrustScore');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

/**
 * Get user profile
 * GET /api/user/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.getFullProfile(req.user.id);

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/user/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const updates = req.body;

    const user = await User.update(req.user.id, updates);

    // Recalculate trust score if profile changed
    if (updates.bio || updates.location || updates.industry || updates.skills) {
      await TrustScore.recalculate(req.user.id);
    }

    res.json({
      success: true,
      user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user trust score
 * GET /api/user/trust-score
 */
const getTrustScore = async (req, res, next) => {
  try {
    const result = await TrustScore.recalculate(req.user.id);

    res.json({
      success: true,
      score: result.score,
      factors: result.factors
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get trust score history
 * GET /api/user/trust-score/history
 */
const getTrustScoreHistory = async (req, res, next) => {
  try {
    const history = await User.getTrustScoreHistory(req.user.id);

    res.json({
      success: true,
      history
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user connections
 * GET /api/user/connections
 */
const getConnections = async (req, res, next) => {
  try {
    const connections = await Connection.getByUser(req.user.id);

    res.json({
      success: true,
      connections
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending connection requests
 * GET /api/user/connections/pending
 */
const getPendingConnections = async (req, res, next) => {
  try {
    const requests = await Connection.getPendingRequests(req.user.id);

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send connection request
 * POST /api/user/connections
 */
const sendConnectionRequest = async (req, res, next) => {
  try {
    const { recipientId } = req.body;

    // Check if trying to connect to self
    if (recipientId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Cannot connect to yourself'
        }
      });
    }

    const connection = await Connection.create(req.user.id, recipientId);

    // Create notification for recipient
    const recipient = await User.findById(recipientId);
    if (recipient) {
      await Notification.createConnectionRequest(recipientId, req.user);
    }

    logger.info(`Connection request sent from ${req.user.id} to ${recipientId}`);

    res.status(201).json({
      success: true,
      connection,
      message: 'Connection request sent'
    });
  } catch (error) {
    if (error.message === 'Connection already exists') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONNECTION_EXISTS',
          message: 'Connection already exists'
        }
      });
    }
    next(error);
  }
};

/**
 * Accept connection request
 * POST /api/user/connections/:id/accept
 */
const acceptConnectionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const connection = await Connection.accept(id, req.user.id);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Connection request not found'
        }
      });
    }

    logger.info(`Connection request ${id} accepted by ${req.user.id}`);

    res.json({
      success: true,
      connection,
      message: 'Connection accepted'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject connection request
 * POST /api/user/connections/:id/reject
 */
const rejectConnectionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const connection = await Connection.reject(id, req.user.id);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Connection request not found'
        }
      });
    }

    logger.info(`Connection request ${id} rejected by ${req.user.id}`);

    res.json({
      success: true,
      message: 'Connection rejected'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user notifications
 * GET /api/user/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const { unreadOnly, limit, offset } = req.query;

    const notifications = await Notification.getByUser(req.user.id, {
      unreadOnly: unreadOnly === 'true',
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });

    const unreadCount = await Notification.getUnreadCount(req.user.id);

    res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 * PUT /api/user/notifications/:id/read
 */
const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.markAsRead(id, req.user.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notification not found'
        }
      });
    }

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 * PUT /api/user/notifications/read-all
 */
const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
