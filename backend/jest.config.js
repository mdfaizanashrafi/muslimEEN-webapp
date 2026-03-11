/**
 * Jest Configuration
 * MuslimEEN Backend Test Configuration
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
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
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/types.ts',
    '!src/**/routes.ts',
    '!src/server.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 30000,
};
