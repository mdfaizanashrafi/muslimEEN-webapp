/**
 * User Controller
 * Handles user profile, connections, and trust score
 * Converted from userController.js to TypeScript with ZERO logic changes
 */

import { Response, NextFunction } from 'express';
import {
  AuthenticatedUserRequest,
  UpdateProfileRequest,
  ConnectionRequestBody,
  NotificationQueryOptions
} from './user.types';
import {
  getProfile as getProfileService,
  updateProfile as updateProfileService,
  getTrustScore as getTrustScoreService,
  getTrustScoreHistory as getTrustScoreHistoryService,
  getConnections as getConnectionsService,
  getPendingConnections as getPendingConnectionsService,
  sendConnectionRequest as sendConnectionRequestService,
  acceptConnectionRequest as acceptConnectionRequestService,
  rejectConnectionRequest as rejectConnectionRequestService,
  getNotifications as getNotificationsService,
  markNotificationRead as markNotificationReadService,
  markAllNotificationsRead as markAllNotificationsReadService
} from './user.service';
import {
  validateUpdateProfile,
  validateConnectionRequest,
  validateNotificationQuery,
  formatValidationErrors
} from './user.validation';

/**
 * Get user profile
 * GET /api/user/profile
 */
export const getProfile = async (
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getProfileService(req.user.id);

    res.json({
      success: true,
      user: result.user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/user/profile
 */
export const updateProfile = async (
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = validateUpdateProfile(req.body);

    if (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: formatValidationErrors(error)
        }
      });
      return;
    }

    const updates: UpdateProfileRequest = value;
    const result = await updateProfileService(req.user.id, updates);

    res.json({
      success: true,
      user: result.user,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user trust score
 * GET /api/user/trust-score
 */
export const getTrustScore = async (
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getTrustScoreService(req.user.id);

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
export const getTrustScoreHistory = async (
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getTrustScoreHistoryService(req.user.id);

    res.json({
      success: true,
      history: result.history
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user connections
 * GET /api/user/connections
 */
export const getConnections = async (
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getConnectionsService(req.user.id);

    res.json({
      success: true,
      connections: result.connections
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending connection requests
 * GET /api/user/connections/pending
 */
export const getPendingConnections = async (
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getPendingConnectionsService(req.user.id);

    res.json({
      success: true,
      requests: result.requests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send connection request
 * POST /api/user/connections
 */
export const sendConnectionRequest = async (
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = validateConnectionRequest(req.body);

    if (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: formatValidationErrors(error)
        }
      });
      return;
    }

    const { recipientId }: ConnectionRequestBody = value;
    const result = await sendConnectionRequestService(
      req.user.id,
      req.user.fullName,
      req.user.trustScore,
      recipientId
    );

    if (result.error) {
      res.status(result.statusCode || 400).json({
        success: false,
        error: result.error
      });
      return;
    }

    res.status(result.statusCode || 201).json({
      success: true,
      connection: result.connection,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept connection request
 * POST /api/user/connections/:id/accept
 */
export const acceptConnectionRequest = async (
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await acceptConnectionRequestService(id, req.user.id);

    if (result.error) {
      res.status(result.statusCode || 404).json({
        success: false,
        error: result.error
      });
      return;
    }

    res.json({
      success: true,
      connection: result.connection,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject connection request
 * POST /api/user/connections/:id/reject
 */
export const rejectConnectionRequest = async (
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await rejectConnectionRequestService(id, req.user.id);

    if (result.error) {
      res.status(result.statusCode || 404).json({
        success: false,
        error: result.error
      });
      return;
    }

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user notifications
 * GET /api/user/notifications
 */
export const getNotifications = async (
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = validateNotificationQuery(req.query);

    if (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: formatValidationErrors(error)
        }
      });
      return;
    }

    const options: NotificationQueryOptions = {
      unreadOnly: value.unreadOnly === 'true',
      limit: value.limit ? parseInt(String(value.limit), 10) : 50,
      offset: value.offset ? parseInt(String(value.offset), 10) : 0
    };

    const result = await getNotificationsService(req.user.id, options);

    res.json({
      success: true,
      notifications: result.notifications,
      unreadCount: result.unreadCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 * PUT /api/user/notifications/:id/read
 */
export const markNotificationRead = async (
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await markNotificationReadService(id, req.user.id);

    if (result.error) {
      res.status(result.statusCode || 404).json({
        success: false,
        error: result.error
      });
      return;
    }

    res.json({
      success: true,
      notification: result.notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 * PUT /api/user/notifications/read-all
 */
export const markAllNotificationsRead = async (
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await markAllNotificationsReadService(req.user.id);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};
