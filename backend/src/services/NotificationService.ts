/**
 * Notification Service
 * Orchestrates notification creation and management
 * Coordinates between notification repository and business events
 */

import Notification from '../models/Notification';
import { NotificationsResponse } from '../types/api';

// ============================================================================
// NOTIFICATION RETRIEVAL
// ============================================================================

/**
 * Get notifications for a user
 * @param userId User ID
 * @param options Query options
 * @returns Notifications list
 */
export const getUserNotifications = async (
  userId: string,
  options: { unreadOnly?: boolean; limit?: number; offset?: number } = {}
): Promise<NotificationsResponse> => {
  const { unreadOnly = false, limit = 50, offset = 0 } = options;

  const [notifications, unreadCount] = await Promise.all([
    Notification.getByUser(userId, { unreadOnly, limit, offset }),
    Notification.getUnreadCount(userId),
  ]);

  return {
    success: true,
    notifications: notifications.map((notification: any) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      createdAt: notification.createdAt,
      actor: notification.actor,
      actionUrl: notification.actionUrl,
      data: notification.data,
    })),
    unreadCount,
    total: unreadOnly ? unreadCount : await getTotalNotificationCount(userId),
  };
};

/**
 * Mark a single notification as read
 * @param notificationId Notification ID
 * @param userId User ID (for authorization)
 */
export const markAsRead = async (notificationId: string, userId: string): Promise<void> => {
  const result = await Notification.markAsRead(notificationId, userId);
  if (!result) {
    throw new NotificationError('NOT_FOUND', 'Notification not found', 404);
  }
};

/**
 * Mark all notifications as read for a user
 * @param userId User ID
 */
export const markAllAsReadForUser = async (userId: string): Promise<void> => {
  await Notification.markAllAsRead(userId);
};

/**
 * Delete a notification
 * @param notificationId Notification ID
 * @param userId User ID (for authorization)
 */
export const deleteNotification = async (notificationId: string, userId: string): Promise<void> => {
  const result = await Notification.delete(notificationId, userId);
  if (!result) {
    throw new NotificationError('NOT_FOUND', 'Notification not found', 404);
  }
};

// ============================================================================
// NOTIFICATION CREATION (Event Handlers)
// ============================================================================

/**
 * Create connection request notification
 * @param recipientId User receiving the notification
 * @param requester User sending the connection request
 */
export const notifyConnectionRequest = async (
  recipientId: string,
  requester: { id: string; fullName: string; trustScore: number }
): Promise<void> => {
  await Notification.createConnectionRequest(recipientId, requester);
};

/**
 * Create connection accepted notification
 * @param recipientId User receiving the notification
 * @param accepter User who accepted the connection
 */
export const notifyConnectionAccepted = async (
  recipientId: string,
  accepter: { id: string; fullName: string; trustScore: number }
): Promise<void> => {
  await Notification.create({
    userId: recipientId,
    type: Notification.TYPES.CONNECTION_ACCEPTED,
    title: 'Connection Accepted',
    message: `${accepter.fullName} accepted your connection request`,
    actorId: accepter.id,
    actorName: accepter.fullName,
    actorTrustScore: accepter.trustScore,
    actionUrl: '/connections',
  });
};

/**
 * Create endorsement notification
 * @param recipientId User receiving the endorsement
 * @param endorser User giving the endorsement
 * @param skill Skill being endorsed
 */
export const notifyEndorsement = async (
  recipientId: string,
  endorser: { id: string; fullName: string; trustScore: number },
  skill: string
): Promise<void> => {
  await Notification.createEndorsement(recipientId, endorser, skill);
};

/**
 * Create trust score change notification
 * @param userId User whose score changed
 * @param oldScore Previous score
 * @param newScore New score
 */
export const notifyTrustScoreChange = async (
  userId: string,
  oldScore: number,
  newScore: number
): Promise<void> => {
  const change = newScore - oldScore;
  const direction = change > 0 ? 'increased' : 'decreased';

  await Notification.create({
    userId,
    type: Notification.TYPES.TRUST_SCORE_CHANGED,
    title: `Trust Score ${direction.charAt(0).toUpperCase() + direction.slice(1)}`,
    message: `Your trust score ${direction} by ${Math.abs(change)} points`,
    actionUrl: '/verification',
  });
};

/**
 * Create verification completed notification
 * @param userId User who completed verification
 * @param tier Verification tier achieved
 */
export const notifyVerificationCompleted = async (
  userId: string,
  tier: 'basic' | 'full' | 'business'
): Promise<void> => {
  await Notification.createVerificationCompleted(userId, tier);
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get total notification count for user
 * @param userId User ID
 * @returns Total count
 */
const getTotalNotificationCount = async (userId: string): Promise<number> => {
  // This could be optimized with a count query
  const notifications = await Notification.getByUser(userId, { limit: 1000 });
  return notifications.length;
};

// ============================================================================
// CUSTOM ERROR
// ============================================================================

export class NotificationError extends Error {
  public code: string;
  public statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'NotificationError';
  }
}
