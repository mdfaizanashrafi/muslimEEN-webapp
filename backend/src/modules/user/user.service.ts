/**
 * User Service
 * Business logic for user module
 * Extracted from userController.js with ZERO logic changes
 */

import { UpdateProfileRequest, ConnectionRequestBody, NotificationQueryOptions } from './user.types';

// Import original models (JavaScript modules)
const User = require('../../models/User');
const Connection = require('../../models/Connection');
const TrustScore = require('../../models/TrustScore');
const Notification = require('../../models/Notification');
const logger = require('../../utils/logger');

/**
 * Get user profile
 * GET /api/user/profile
 */
export async function getProfile(userId: string) {
  const user = await User.getFullProfile(userId);
  return { user };
}

/**
 * Update user profile
 * PUT /api/user/profile
 */
export async function updateProfile(userId: string, updates: UpdateProfileRequest) {
  const user = await User.update(userId, updates);

  // Recalculate trust score if profile changed
  if (updates.bio || updates.location || updates.industry || updates.skills) {
    await TrustScore.recalculate(userId);
  }

  return {
    user,
    message: 'Profile updated successfully'
  };
}

/**
 * Get user trust score
 * GET /api/user/trust-score
 */
export async function getTrustScore(userId: string) {
  const result = await TrustScore.recalculate(userId);

  return {
    score: result.score,
    factors: result.factors
  };
}

/**
 * Get trust score history
 * GET /api/user/trust-score/history
 */
export async function getTrustScoreHistory(userId: string) {
  const history = await User.getTrustScoreHistory(userId);

  return { history };
}

/**
 * Get user connections
 * GET /api/user/connections
 */
export async function getConnections(userId: string) {
  const connections = await Connection.getByUser(userId);

  return { connections };
}

/**
 * Get pending connection requests
 * GET /api/user/connections/pending
 */
export async function getPendingConnections(userId: string) {
  const requests = await Connection.getPendingRequests(userId);

  return { requests };
}

/**
 * Send connection request
 * POST /api/user/connections
 */
export async function sendConnectionRequest(
  requesterId: string,
  requesterFullName: string,
  requesterTrustScore: number,
  recipientId: string
) {
  // Check if trying to connect to self
  if (recipientId === requesterId) {
    return {
      error: {
        code: 'INVALID_REQUEST',
        message: 'Cannot connect to yourself'
      },
      statusCode: 400
    };
  }

  try {
    const connection = await Connection.create(requesterId, recipientId);

    // Create notification for recipient
    const recipient = await User.findById(recipientId);
    if (recipient) {
      await Notification.createConnectionRequest(recipientId, {
        id: requesterId,
        fullName: requesterFullName,
        trustScore: requesterTrustScore
      });
    }

    logger.info(`Connection request sent from ${requesterId} to ${recipientId}`);

    return {
      connection,
      message: 'Connection request sent',
      statusCode: 201
    };
  } catch (error: any) {
    if (error.message === 'Connection already exists') {
      return {
        error: {
          code: 'CONNECTION_EXISTS',
          message: 'Connection already exists'
        },
        statusCode: 409
      };
    }
    throw error;
  }
}

/**
 * Accept connection request
 * POST /api/user/connections/:id/accept
 */
export async function acceptConnectionRequest(connectionId: string, userId: string) {
  try {
    const connection = await Connection.accept(connectionId, userId);

    if (!connection) {
      return {
        error: {
          code: 'NOT_FOUND',
          message: 'Connection request not found'
        },
        statusCode: 404
      };
    }

    logger.info(`Connection request ${connectionId} accepted by ${userId}`);

    return {
      connection,
      message: 'Connection accepted'
    };
  } catch (error: any) {
    if (error.message === 'Connection request not found') {
      return {
        error: {
          code: 'NOT_FOUND',
          message: 'Connection request not found'
        },
        statusCode: 404
      };
    }
    throw error;
  }
}

/**
 * Reject connection request
 * POST /api/user/connections/:id/reject
 */
export async function rejectConnectionRequest(connectionId: string, userId: string) {
  try {
    const connection = await Connection.reject(connectionId, userId);

    if (!connection) {
      return {
        error: {
          code: 'NOT_FOUND',
          message: 'Connection request not found'
        },
        statusCode: 404
      };
    }

    logger.info(`Connection request ${connectionId} rejected by ${userId}`);

    return {
      message: 'Connection rejected'
    };
  } catch (error: any) {
    if (error.message === 'Connection request not found') {
      return {
        error: {
          code: 'NOT_FOUND',
          message: 'Connection request not found'
        },
        statusCode: 404
      };
    }
    throw error;
  }
}

/**
 * Get user notifications
 * GET /api/user/notifications
 */
export async function getNotifications(userId: string, options: NotificationQueryOptions) {
  const notifications = await Notification.getByUser(userId, {
    unreadOnly: options.unreadOnly === true,
    limit: options.limit || 50,
    offset: options.offset || 0
  });

  const unreadCount = await Notification.getUnreadCount(userId);

  return {
    notifications,
    unreadCount
  };
}

/**
 * Mark notification as read
 * PUT /api/user/notifications/:id/read
 */
export async function markNotificationRead(notificationId: string, userId: string) {
  const notification = await Notification.markAsRead(notificationId, userId);

  if (!notification) {
    return {
      error: {
        code: 'NOT_FOUND',
        message: 'Notification not found'
      },
      statusCode: 404
    };
  }

  return { notification };
}

/**
 * Mark all notifications as read
 * PUT /api/user/notifications/read-all
 */
export async function markAllNotificationsRead(userId: string) {
  await Notification.markAllAsRead(userId);

  return {
    message: 'All notifications marked as read'
  };
}
