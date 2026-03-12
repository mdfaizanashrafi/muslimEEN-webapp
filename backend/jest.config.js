/**
 * Jest Configuration for MuslimEEN Backend
 * 
 * Supports:
 * - TypeScript via ts-jest
 * - Module path mapping for @shared/*, @iam/*, @database
 * - Coverage collection from src/
 * - Test timeout: 10s
 * 
 * @type {import('jest').Config}
 */
module.exports = {
  // Use ts-jest for TypeScript support
  preset: 'ts-jest',
  
  // Node environment for backend
  testEnvironment: 'node',
  
  // Look for tests in these locations
  roots: ['<rootDir>/src'],
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/tests/**/*.test.ts'
  ],
  
  // Ignore these paths
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  
  // File extensions to consider
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  
  // Transform TypeScript files
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Module path mapping (must match tsconfig.json paths)
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/modules/shared/$1',
    '^@iam/(.*)$': '<rootDir>/src/modules/iam/$1',
    '^@database$': '<rootDir>/src/modules/database/pool',
    '^@types$': '<rootDir>/src/modules/shared/types'
  },
  
  // Setup file to run after jest is initialized
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/__tests__/**',
    '!src/**/__mocks__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Mock clearing between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Fail on console errors during tests
  errorOnDeprecated: true
};
