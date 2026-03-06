/**
 * Event Bus - Central pub/sub for inter-module communication
 * Enables loose coupling between modules
 */

export type EventHandler<T = any> = (payload: T) => void | Promise<void>;

export interface DomainEvent<T = any> {
  type: string;
  payload: T;
  timestamp: Date;
  correlationId?: string;
}

class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  subscribe<T>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    
    this.handlers.get(eventType)!.add(handler);
    
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  async publish<T>(eventType: string, payload: T, correlationId?: string): Promise<void> {
    const handlers = this.handlers.get(eventType);
    if (!handlers || handlers.size === 0) {
      return;
    }

    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(payload);
      } catch (error) {
        console.error(`Event handler failed for ${eventType}:`, error);
      }
    });

    await Promise.all(promises);
  }
}

export const eventBus = new EventBus();

/**
 * Domain Events Registry
 * All application events are defined here for type safety and consistency
 */
export const DomainEvents = {
  // IAM Events
  USER_REGISTERED: 'user.registered',
  USER_AUTHENTICATED: 'user.authenticated',
  USER_LOGGED_OUT: 'user.logged_out',

  // Profile Events
  PROFILE_UPDATED: 'profile.updated',
  PROFILE_CREATED: 'profile.created',
  SKILL_ENDORSED: 'profile.skill_endorsed',

  // Trust & Verification Events
  TRUST_SCORE_UPDATED: 'trust.score_updated',
  TRUST_SCORE_RECALCULATED: 'trust.score_recalculated',
  VERIFICATION_COMPLETED: 'verification.completed',
  VERIFICATION_REQUESTED: 'verification.requested',
  WITNESS_APPROVED: 'verification.witness_approved',

  // Connection/Network Events
  CONNECTION_REQUEST_SENT: 'connection.request_sent',
  CONNECTION_REQUEST_ACCEPTED: 'connection.request_accepted',
  CONNECTION_REQUEST_REJECTED: 'connection.request_rejected',
  CONNECTION_REMOVED: 'connection.removed',

  // Notification Events
  NOTIFICATION_CREATED: 'notification.created',
  NOTIFICATION_READ: 'notification.read',

  // Invitation Events
  INVITATION_CREATED: 'invitation.created',
  INVITATION_ACCEPTED: 'invitation.accepted',
  INVITATION_REVOKED: 'invitation.revoked',

  // Marketplace Events
  LISTING_CREATED: 'marketplace.listing_created',
  LISTING_UPDATED: 'marketplace.listing_updated',
  LISTING_DELETED: 'marketplace.listing_deleted',
  INVESTMENT_RECORDED: 'marketplace.investment_recorded',

  // Islamic Finance Events
  DONATION_RECORDED: 'islamic_finance.donation_recorded',
  QARD_HASAN_CREATED: 'islamic_finance.qard_hasan_created',
  QARD_HASAN_FUNDED: 'islamic_finance.qard_hasan_funded',
  QARD_HASAN_REPAID: 'islamic_finance.qard_hasan_repaid',
  WAQF_CONTRIBUTION: 'islamic_finance.waqf_contribution',
  ZAKAT_CALCULATED: 'islamic_finance.zakat_calculated',
} as const;

// Type for event names
type DomainEventName = typeof DomainEvents[keyof typeof DomainEvents];
