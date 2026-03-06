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

export const DomainEvents = {
  PROFILE_UPDATED: 'profile.updated',
  SKILL_ENDORSED: 'profile.skill_endorsed',
  TRUST_SCORE_UPDATED: 'trust.score_updated',
  CONNECTION_REQUEST_SENT: 'connection.request_sent',
  CONNECTION_REQUEST_ACCEPTED: 'connection.request_accepted',
} as const;
