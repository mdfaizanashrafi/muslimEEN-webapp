/**
 * Notification Event Handlers
 * Listens to domain events and creates notifications via NotificationService
 * 
 * This separation follows SRP:
 * - NotificationService: Creates/manages notifications
 * - Event Handlers: Listen to events and call NotificationService
 */

import { eventBus, DomainEvents } from '../../shared/events/EventBus';
import {
  notifyTrustScoreChange,
  notifyVerificationCompleted,
} from '../services/NotificationService';

/**
 * Initialize event handlers for notifications
 * Called once at application startup
 */
export const initializeNotificationEventHandlers = (): void => {
  // Listen for events that should create notifications
  eventBus.subscribe(DomainEvents.CONNECTION_REQUEST_SENT, async (payload: any) => {
    // This would be handled by the connection service calling notifyConnectionRequest
  });

  eventBus.subscribe(DomainEvents.CONNECTION_REQUEST_ACCEPTED, async (payload: any) => {
    // This would be handled by the connection service calling notifyConnectionAccepted
  });

  eventBus.subscribe(DomainEvents.TRUST_SCORE_UPDATED, async (payload: any) => {
    if (payload.oldScore !== undefined && payload.newScore !== undefined) {
      await notifyTrustScoreChange(payload.userId, payload.oldScore, payload.newScore);
    }
  });

  eventBus.subscribe(DomainEvents.VERIFICATION_COMPLETED, async (payload: any) => {
    await notifyVerificationCompleted(payload.userId, payload.tier);
  });

  console.log('Notification event handlers initialized');
};
