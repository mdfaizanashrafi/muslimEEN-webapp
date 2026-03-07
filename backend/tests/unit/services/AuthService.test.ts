/**
 * Auth Service Unit Tests
 * 
 * @deprecated This file has been refactored to follow Single Responsibility Principle.
 * The tests have been split into focused test files in the `auth/` directory:
 * 
 * - `auth/login.test.ts` - Login functionality tests
 * - `auth/register.test.ts` - Registration functionality tests
 * - `auth/logout.test.ts` - Logout functionality tests
 * - `auth/getCurrentUser.test.ts` - Get current user tests
 * - `auth/validateInvitation.test.ts` - Invitation validation tests
 * - `auth/errors.test.ts` - AuthError class tests
 * - `auth/formatters.test.ts` - Response formatters tests
 * - `auth/index.ts` - Barrel export to run all auth tests together
 * 
 * Please use the individual test files for new tests or modifications.
 */

// Re-export all auth tests from the new location for backward compatibility
// Remove this file once all CI/CD pipelines are updated to use the new structure
export * from './auth/login.test';
export * from './auth/register.test';
export * from './auth/logout.test';
export * from './auth/getCurrentUser.test';
export * from './auth/validateInvitation.test';
export * from './auth/errors.test';
export * from './auth/formatters.test';
