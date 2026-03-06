/**
 * Jest Configuration for Migration Testing
 * 
 * This configuration is specifically for testing the modular architecture migration.
 * It includes both legacy and modular test paths.
 */

const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,

  // Display name for this test configuration
  displayName: 'migration-tests',

  // Specific test patterns for migration
  testMatch: [
    '**/tests/modules/**/*.parity.test.ts',
    '**/tests/integration/migration/**/*.test.ts',
    '**/tests/utils/**/*.test.ts',
  ],

  // Setup files specific to migration testing
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts',
    '<rootDir>/tests/setup.migration.ts', // Additional setup for migration tests
  ],

  // Coverage specifically for migration
  collectCoverageFrom: [
    'src/modules/**/*.ts',
    'src/services/**/*.ts',
    'src/controllers/**/*.ts',
    '!src/**/*.d.ts',
  ],

  // Coverage thresholds for migration
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Reporter configuration
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './reports',
      outputName: 'migration-tests.xml',
    }],
  ],

  // Environment variables for tests
  testEnvironmentOptions: {
    url: 'http://localhost:3001',
  },

  // Verbose output for migration debugging
  verbose: true,

  // Fail fast on first error (optional - remove if you want all tests to run)
  // bail: 1,
};
