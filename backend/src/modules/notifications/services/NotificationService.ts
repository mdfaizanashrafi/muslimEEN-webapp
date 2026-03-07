/**
 * Notification Service
 * Manages notification creation and retrieval
 */

import * as NotificationRepository from '../repositories/NotificationRepository';
import { eventBus, DomainEvents } from '../../shared/events/EventBus';

// ============================================================================
// TYPES
// ============================================================================

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actorId?: string;
  actorName?: string;
  actorTrustScore?: number;
  actionUrl?: string;
  data?: any;
}

export interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
  total: number;
}

// ============================================================================
// NOTIFICATION RETRIEVAL
// ============================================================================

/**
 * Get notifications for a user
 */
export const getUserNotifications = async (
  userId: string,
  options: { unreadOnly?: boolean; limit?: number; offset?: number } = {}
): Promise<NotificationsResponse> => {
  const { unreadOnly = false, limit = 50, offset = 0 } = options;

  const [notifications, unreadCount, total] = await Promise.all([
    NotificationRepository.getByUser(userId, { unreadOnly, limit, offset }),
    NotificationRepository.getUnreadCount(userId),
    NotificationRepository.getTotalCount(userId),
  ]);

  return {
    success: true,
    notifications,
    unreadCount,
    total,
  };
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (notificationId: string, userId: string): Promise<void> => {
  const result = await NotificationRepository.markAsRead(notificationId, userId);
  if (!result) {
    throw new NotificationError('NOT_FOUND', 'Notification not found', 404);
  }
  
  // Publish event
  await eventBus.publish(DomainEvents.NOTIFICATION_READ, {
    notificationId,
    userId,
  });
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsReadForUser = async (userId: string): Promise<void> => {
  await NotificationRepository.markAllAsRead(userId);
  
  // Publish event
  await eventBus.publish(DomainEvents.NOTIFICATION_READ, {
    userId,
    all: true,
  });
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string, userId: string): Promise<void> => {
  const result = await NotificationRepository.deleteNotification(notificationId, userId);
  if (!result) {
    throw new NotificationError('NOT_FOUND', 'Notification not found', 404);
  }
};

// ============================================================================
// NOTIFICATION CREATION
// ============================================================================

/**
 * Create a notification
 */
export const createNotification = async (data: Partial<Notification>): Promise<Notification> => {
  const notification = await NotificationRepository.create(data);
  
  // Publish event
  await eventBus.publish(DomainEvents.NOTIFICATION_CREATED, {
    notificationId: notification.id,
    userId: notification.userId,
    type: notification.type,
  });
  
  return notification;
};

/**
 * Create connection request notification
 */
export const notifyConnectionRequest = async (
  recipientId: string,
  requester: { id: string; fullName: string; trustScore: number }
): Promise<void> => {
  await createNotification({
    userId: recipientId,
    type: 'CONNECTION_REQUEST',
    title: 'New Connection Request',
    message: `${requester.fullName} wants to connect with you`,
    actorId: requester.id,
    actorName: requester.fullName,
    actorTrustScore: requester.trustScore,
    actionUrl: '/connections',
  });
};

/**
 * Create connection accepted notification
 */
export const notifyConnectionAccepted = async (
  recipientId: string,
  accepter: { id: string; fullName: string; trustScore: number }
): Promise<void> => {
  await createNotification({
    userId: recipientId,
    type: 'CONNECTION_ACCEPTED',
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
 */
export const notifyEndorsement = async (
  recipientId: string,
  endorser: { id: string; fullName: string; trustScore: number },
  skill: string
): Promise<void> => {
  await createNotification({
    userId: recipientId,
    type: 'ENDORSEMENT',
    title: 'New Skill Endorsement',
    message: `${endorser.fullName} endorsed you for ${skill}`,
    actorId: endorser.id,
    actorName: endorser.fullName,
    actorTrustScore: endorser.trustScore,
    actionUrl: '/profile',
  });
};

/**
 * Create trust score change notification
 */
export const notifyTrustScoreChange = async (
  userId: string,
  oldScore: number,
  newScore: number
): Promise<void> => {
  const change = newScore - oldScore;
  const direction = change > 0 ? 'increased' : 'decreased';

  await createNotification({
    userId,
    type: 'TRUST_SCORE_CHANGED',
    title: `Trust Score ${direction.charAt(0).toUpperCase() + direction.slice(1)}`,
    message: `Your trust score ${direction} by ${Math.abs(change)} points`,
    actionUrl: '/verification',
  });
};

/**
 * Create verification completed notification
 */
export const notifyVerificationCompleted = async (
  userId: string,
  tier: 'basic' | 'full' | 'business'
): Promise<void> => {
  const tierNames = {
    basic: 'Basic',
    full: 'Full',
    business: 'Business',
  };

  await createNotification({
    userId,
    type: 'VERIFICATION_COMPLETED',
    title: 'Verification Completed',
    message: `Congratulations! You have achieved ${tierNames[tier]} verification`,
    actionUrl: '/verification',
  });
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
