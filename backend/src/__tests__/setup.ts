/**
 * Test Setup
 * Global test configuration and utilities
 */

import pool from '../modules/database/pool';
import { logger } from '../modules/shared/utils/logger';

// Disable logging during tests
// Winston logger configuration - silent in tests
process.env.LOG_LEVEL = 'silent';

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
