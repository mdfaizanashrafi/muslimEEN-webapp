/**
 * User Controller
 * HTTP request handling for user-related operations
 * Responsibilities: Extract HTTP data, delegate to services, format responses
 *
 * @deprecated This file is now a barrel export for backward compatibility.
 * Import directly from the specific controllers instead:
 * - profileController: Profile operations
 * - trustScoreController: Trust score operations
 * - connectionController: Connection/network operations
 * - notificationController: Notification operations
 */

// Barrel export for backward compatibility
export * from './profileController';
export * from './trustScoreController';
export * from './connectionController';
export * from './notificationController';
