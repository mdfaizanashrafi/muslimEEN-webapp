/**
 * Jest Configuration for MuslimEEN Backend
 * 
 * Supports:
 * - TypeScript via ts-jest
 * - Module path mapping for all aliases (@shared, @iam, etc.)
 * - Coverage collection from src/
 * - Coverage thresholds (70% minimum)
 * - Test timeout: 30s
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
    '**/tests/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
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
    '^@profile/(.*)$': '<rootDir>/src/modules/profile/$1',
    '^@trust/(.*)$': '<rootDir>/src/modules/trust/$1',
    '^@network/(.*)$': '<rootDir>/src/modules/network/$1',
    '^@marketplace/(.*)$': '<rootDir>/src/modules/marketplace/$1',
    '^@islamic-finance/(.*)$': '<rootDir>/src/modules/islamic-finance/$1',
    '^@invites/(.*)$': '<rootDir>/src/modules/invites/$1',
    '^@database$': '<rootDir>/src/modules/database/pool',
    '^@types$': '<rootDir>/src/modules/shared/types',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
  },
  
  // Setup file to run after jest is initialized
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  
  // Coverage thresholds - 70% minimum
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/types.ts',
    '!src/**/routes.ts',
    '!src/server.ts',
    '!src/__tests__/**',
    '!src/**/__mocks__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Test timeout: 30 seconds
  testTimeout: 30000,
  
  // Mock clearing between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Fail on console errors during tests
  errorOnDeprecated: true
};
