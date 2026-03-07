/**
 * Model Mocks
 * Mock implementations of database models for unit testing
 * 
 * @deprecated This file has been refactored to follow Single Responsibility Principle.
 * The mocks have been split into focused mock files:
 * 
 * - `user.mock.ts` - User model mocks
 * - `connection.mock.ts` - Connection model mocks
 * - `invitation.mock.ts` - Invitation model mocks
 * - `notification.mock.ts` - Notification model mocks
 * - `trust-score.mock.ts` - Trust score model mocks
 * - `islamic-finance.mock.ts` - Islamic finance model mocks
 * - `index.ts` - Barrel exports for all mocks
 * 
 * Please import from the individual mock files or use `mocks/index.ts` for new tests.
 * This file is kept for backward compatibility.
 */

// Re-export all mocks from the new modular structure
export * from './index';
