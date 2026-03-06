/**
 * Migration Test Setup
 * 
 * Additional setup for migration tests. Runs after the main setup.ts.
 */

import { verifyMigration, printVerificationResults } from './utils/migrationVerifier';

// Log migration status before running tests
beforeAll(async () => {
  console.log('\n========================================');
  console.log('   MIGRATION TEST SETUP');
  console.log('========================================\n');

  // Verify all modules are loadable
  const results = await verifyMigration();
  printVerificationResults(results);

  // Check if any modules have errors
  const hasErrors = results.some(r => r.status === 'error');
  if (hasErrors) {
    console.warn('\n⚠️  Some modules have errors. Tests may fail.\n');
  }

  console.log('Running tests...\n');
});

// Global test utilities for migration
declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * Custom matcher to check if two implementations produce equivalent results
       */
      toMatchLegacyImplementation(): R;
    }
  }
}

// Custom matcher example (can be expanded)
expect.extend({
  toMatchLegacyImplementation(received: any, expected: any) {
    const pass = JSON.stringify(received) === JSON.stringify(expected);
    
    if (pass) {
      return {
        message: () => 'Expected implementations to differ, but they matched',
        pass: true,
      };
    } else {
      return {
        message: () => 
          `Expected implementations to match:\n` +
          `Legacy: ${JSON.stringify(expected, null, 2)}\n` +
          `Modular: ${JSON.stringify(received, null, 2)}`,
        pass: false,
      };
    }
  },
});
