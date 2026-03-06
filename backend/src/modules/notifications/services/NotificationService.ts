/**
 * Notification Service
 * Event-driven notification delivery
 */

import { eventBus, DomainEvents } from '../../shared/events/EventBus';
import * as NotificationRepository from '../repositories/NotificationRepository';

// Subscribe to domain events
export const initializeEventHandlers = (): void => {
  // Connection events
  eventBus.subscribe(DomainEvents.CONNECTION_REQUEST_SENT, handleConnectionRequest);
  eventBus.subscribe(DomainEvents.CONNECTION_REQUEST_ACCEPTED, handleConnectionAccepted);
  
  // Trust events
  eventBus.subscribe(DomainEvents.TRUST_SCORE_UPDATED, handleTrustScoreUpdate);
  eventBus.subscribe(DomainEvents.VERIFICATION_COMPLETED, handleVerificationCompleted);
  
  // Invitation events
  eventBus.subscribe(DomainEvents.INVITATION_ACCEPTED, handleInvitationAccepted);
};

// Event handlers
async function handleConnectionRequest(payload: any): Promise<void> {
  await NotificationRepository.create({
    userId: payload.recipientId,
    type: 'connection_request',
    title: 'New Connection Request',
    message: 'Someone wants to connect with you',
    data: { requesterId: payload.requesterId },
  });
}

async function handleConnectionAccepted(payload: any): Promise<void> {
  await NotificationRepository.create({
    userId: payload.requesterId,
    type: 'connection_accepted',
    title: 'Connection Accepted',
    message: 'Your connection request was accepted',
    data: { recipientId: payload.recipientId },
  });
}

async function handleTrustScoreUpdate(payload: any): Promise<void> {
  const change = payload.newScore - payload.oldScore;
  if (Math.abs(change) < 10) return; // Only notify for significant changes

  await NotificationRepository.create({
    userId: payload.userId,
    type: 'trust_score_update',
    title: `Trust Score ${change > 0 ? 'Increased' : 'Decreased'}`,
    message: `Your trust score ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change)} points`,
    data: { oldScore: payload.oldScore, newScore: payload.newScore },
  });
}

async function handleVerificationCompleted(payload: any): Promise<void> {
  await NotificationRepository.create({
    userId: payload.userId,
    type: 'verification_update',
    title: 'Verification Completed',
    message: `Your ${payload.type} verification has been completed`,
    data: { tier: payload.tier },
  });
}

async function handleInvitationAccepted(payload: any): Promise<void> {
  if (!payload.invitedBy) return;
  
  await NotificationRepository.create({
    userId: payload.invitedBy,
    type: 'invitation_accepted',
    title: 'Invitation Accepted',
    message: `${payload.firstName} ${payload.lastName} accepted your invitation`,
    data: { newUserId: payload.userId },
  });
}

// User-facing API
export const getUserNotifications = async (userId: string, options: any = {}): Promise<any> => {
  return NotificationRepository.findByUser(userId, options);
};

export const markAsRead = async (notificationId: string, userId: string): Promise<void> => {
  await NotificationRepository.markAsRead(notificationId, userId);
};

export const markAllAsReadForUser = async (userId: string): Promise<void> => {
  await NotificationRepository.markAllAsRead(userId);
};
