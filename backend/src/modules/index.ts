/**
 * MuslimEEN Modular Architecture
 * 
 * Module Structure:
 * - profile: User Profile Management
 * - trustScore: Trust Score and Verification
 * - connections: Network Connections
 * - notifications: Notification Delivery
 * 
 * Shared:
 * - events: Event bus for inter-module communication
 * - database: Database connection
 */

// Initialize notification event handlers
import { initializeEventHandlers } from './notifications/notificationService';
initializeEventHandlers();

// Export modules
export * as profile from './profile/profileController';
export * as trustScore from './trustScore/trustScoreController';
export * as connections from './connections/connectionController';
export * as notifications from './notifications/notificationController';

// Export shared
export { eventBus, DomainEvents } from './shared/events/eventBus';
