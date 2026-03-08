/**
 * MuslimEEN Modular Architecture
 * 
 * Module Structure:
 * - iam: Identity and Access Management
 * - profile: User Profile Management
 * - trust: Trust Score and Verification
 * - network: Network Connections
 * - marketplace: Marketplace
 * - islamic-finance: Islamic Finance Tools
 * - invites: Invite-Only Onboarding System
 * - notifications: Notification Delivery
 * 
 * Shared:
 * - events: Event bus for inter-module communication
 * - database: Database connection
 * - config: Feature flags and configuration
 */

// Initialize notification event handlers
import { initializeNotificationEventHandlers } from './notifications/eventHandlers';
initializeNotificationEventHandlers();

// Export modules
export * as iam from './iam';
export * as profile from './profile';
export * as trust from './trust';
export * as network from './network';
export * as marketplace from './marketplace';
export * as islamicFinance from './islamic-finance';
export * as invites from './invites';
export * as notifications from './notifications';

// Export shared
export { eventBus, DomainEvents } from './shared/events/EventBus';
export { featureFlags, isFullyMigrated, getMigrationStatus } from './shared/config/featureFlags';
