/**
 * Test Setup
 * Global test configuration and utilities
 */

import pool from '../modules/database/pool';
import { logger } from '../modules/shared/utils/logger';

// Disable logging during tests
// Winston logger configuration - silent in tests
process.env.LOG_LEVEL = 'silent';

// ============================================================================
// CUSTOM JEST MATCHERS
// ============================================================================

/**
 * toBeOneOf matcher - checks if value is in array of expected values
 */
expect.extend({
  toBeOneOf(received: any, expectedArray: any[]) {
    const pass = expectedArray.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${JSON.stringify(expectedArray)}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${JSON.stringify(expectedArray)}`,
        pass: false,
      };
    }
  },
});

// Type declaration for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expectedArray: any[]): R;
    }
  }
}

// Global test timeout
jest.setTimeout(30000);

// Before all tests
beforeAll(async () => {
  // Verify database connection
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw new Error('Test database not available');
  }
});

// After all tests
afterAll(async () => {
  // Close database connection
  await pool.end();
});

// Clean up after each test
afterEach(async () => {
  // Note: In a real implementation, you might want to clear test data
  // For now, we'll assume tests use unique data or transactions
});
