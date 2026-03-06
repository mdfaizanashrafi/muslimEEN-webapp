/**
 * Notification Service
 * Business logic for notification delivery
 * Event-driven: Subscribes to domain events from other modules
 */

import { NotificationRepository } from './notificationRepository';
import { eventBus, DomainEvents } from '../shared/events/eventBus';

/**
 * Initialize event handlers
 * Called once at application startup
 */
export const initializeEventHandlers = (): void => {
  // Connection events
  eventBus.subscribe(DomainEvents.CONNECTION_REQUEST_SENT, handleConnectionRequestSent);
  eventBus.subscribe(DomainEvents.CONNECTION_REQUEST_ACCEPTED, handleConnectionAccepted);
  
  // Profile events
  eventBus.subscribe(DomainEvents.PROFILE_UPDATED, handleProfileUpdated);
  eventBus.subscribe(DomainEvents.SKILL_ENDORSED, handleSkillEndorsed);
  
  // Trust score events
  eventBus.subscribe(DomainEvents.TRUST_SCORE_UPDATED, handleTrustScoreUpdated);
};

// ============================================================================
// EVENT HANDLERS
// ============================================================================

async function handleConnectionRequestSent(payload: any): Promise<void> {
  await createNotification({
    userId: payload.recipientId,
    type: 'connection_request',
    title: 'New Connection Request',
    message: 'Someone wants to connect with you',
    data: { requesterId: payload.requesterId },
  });
}

async function handleConnectionAccepted(payload: any): Promise<void> {
  await createNotification({
    userId: payload.requesterId,
    type: 'connection_accepted',
    title: 'Connection Accepted',
    message: 'Your connection request was accepted',
    data: { recipientId: payload.recipientId },
  });
}

async function handleProfileUpdated(payload: any): Promise<void> {
  // No notification for profile updates
  // Could be used for audit logging
}

async function handleSkillEndorsed(payload: any): Promise<void> {
  await createNotification({
    userId: payload.userId,
    type: 'skill_endorsed',
    title: 'Skill Endorsed',
    message: `Someone endorsed your skill: ${payload.skill}`,
    data: { skill: payload.skill, endorserId: payload.endorserId },
  });
}

async function handleTrustScoreUpdated(payload: any): Promise<void> {
  const change = payload.newScore - payload.oldScore;
  
  // Only notify for significant changes
  if (Math.abs(change) < 10) return;
  
  const direction = change > 0 ? 'increased' : 'decreased';
  
  await createNotification({
    userId: payload.userId,
    type: 'trust_score_update',
    title: `Trust Score ${direction.charAt(0).toUpperCase() + direction.slice(1)}`,
    message: `Your trust score ${direction} by ${Math.abs(change)} points`,
    data: { oldScore: payload.oldScore, newScore: payload.newScore },
  });
}

// ============================================================================
// PUBLIC API
// ============================================================================

interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}

/**
 * Create a notification
 */
const createNotification = async (input: CreateNotificationInput): Promise<void> => {
  await NotificationRepository.create({
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    data: input.data || {},
    isRead: false,
    createdAt: new Date(),
  });
  
  // TODO: Send push notification if user has enabled
  // TODO: Send email if user has enabled
};

/**
 * Get notifications for user
 */
export const getUserNotifications = async (
  userId: string,
  options: { unreadOnly?: boolean; limit?: number; offset?: number }
): Promise<{ notifications: any[]; unreadCount: number }> => {
  const notifications = await NotificationRepository.findByUserId(userId, options);
  const unreadCount = await NotificationRepository.countUnread(userId);
  
  return { notifications, unreadCount };
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId: string, userId: string): Promise<void> => {
  await NotificationRepository.markAsRead(notificationId, userId);
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (userId: string): Promise<void> => {
  await NotificationRepository.markAllAsRead(userId);
};
