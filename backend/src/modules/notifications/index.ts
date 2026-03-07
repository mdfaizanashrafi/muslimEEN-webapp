/**
 * Notifications Module
 * 
 * Responsibilities:
 * - Notification creation and delivery
 * - Notification read status tracking
 * - Event-driven notification generation
 */

// Controllers
export * as NotificationController from './controllers/NotificationController';

// Services
export * as NotificationService from './services/NotificationService';
export { initializeEventHandlers } from './services/NotificationService';

// Repositories
export * as NotificationRepository from './repositories/NotificationRepository';

// Types
export { Notification, NotificationsResponse, NotificationError } from './services/NotificationService';
