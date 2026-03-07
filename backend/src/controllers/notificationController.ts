/**
 * Notification Controller
 * HTTP request handling for user notification operations
 * Responsibilities: Extract HTTP data, delegate to NotificationService, format responses
 */

import { Request, Response, NextFunction } from 'express';
import * as NotificationService from '../services/NotificationService';
import logger from '../utils/logger';

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/**
 * Retrieve user's notification inbox
 * GET /user/notifications
 */
export const retrieveUserNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authenticatedUserId = req.user!.id;
    const { unreadOnly, limit: queryLimit, offset: queryOffset } = req.query;

    const userNotificationInbox = await NotificationService.getUserNotifications(authenticatedUserId, {
      unreadOnly: unreadOnly === 'true',
      limit: queryLimit ? parseInt(queryLimit as string, 10) : undefined,
      offset: queryOffset ? parseInt(queryOffset as string, 10) : undefined,
    });

    res.json(userNotificationInbox);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark specific notification as read
 * PUT /user/notifications/:notificationId/read
 */
export const markSingleNotificationAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authenticatedUserId = req.user!.id;
    const notificationId = req.params.notificationId;

    await NotificationService.markAsRead(notificationId, authenticatedUserId);

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all user's notifications as read
 * PUT /user/notifications/read-all
 */
export const markAllUserNotificationsAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authenticatedUserId = req.user!.id;

    await NotificationService.markAllAsReadForUser(authenticatedUserId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};
