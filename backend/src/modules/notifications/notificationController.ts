/**
 * Notification Controller
 * HTTP request handling for notifications
 */

import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notificationService';

/**
 * Get current user's notifications
 * GET /user/notifications
 */
export const getCurrentUserNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { unreadOnly, limit, offset } = req.query;
    
    const result = await NotificationService.getUserNotifications(userId, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });
    
    res.json({
      success: true,
      data: result.notifications,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 * PUT /user/notifications/:notificationId/read
 */
export const markNotificationAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { notificationId } = req.params;
    
    await NotificationService.markAsRead(notificationId, userId);
    
    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 * PUT /user/notifications/read-all
 */
export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    await NotificationService.markAllAsRead(userId);
    
    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};
