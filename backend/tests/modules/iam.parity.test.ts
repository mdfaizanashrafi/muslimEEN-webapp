/**
 * IAM Module Parity Tests
 * 
 * Compares legacy and modular IAM implementations to ensure identical behavior
 */

import * as legacyAuthService from '../../src/services/AuthService';
import * as modularAuthService from '../../src/modules/iam/services/AuthService';
import { testBothImplementations, overrideFeatureFlag } from '../utils/moduleTester';

describe('IAM Module Parity Tests', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    invitationCode: 'TEST-123-456',
  };

  describe('validateInvitation', () => {
    it('should have matching invitation validation logic', async () => {
      // Note: This test requires a valid invitation code in the database
      // For unit testing, we compare the function signatures and error handling
      
      expect(typeof legacyAuthService.validateInvitation).toBe('function');
      expect(typeof modularAuthService.validateInvitation).toBe('function');
      
      // Both should reject invalid codes
      await expect(legacyAuthService.validateInvitation('INVALID-CODE'))
        .rejects.toThrow();
      await expect(modularAuthService.validateInvitation('INVALID-CODE'))
        .rejects.toThrow();
    });
  });

  describe('AuthError', () => {
    it('should have consistent error types', () => {
      const legacyError = new legacyAuthService.AuthError('TEST_CODE', 'Test message', 400);
      const modularError = new modularAuthService.AuthError('TEST_CODE', 'Test message', 400);

      expect(legacyError.code).toBe(modularError.code);
      expect(legacyError.message).toBe(modularError.message);
      expect(legacyError.statusCode).toBe(modularError.statusCode);
      expect(legacyError.name).toBe('AuthError');
      expect(modularError.name).toBe('AuthError');
    });
  });

  describe('login response format', () => {
    it('should have matching response formatters', () => {
      const mockResult = {
        user: {
          id: 'test-id',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
          verificationTier: 'provisional',
          trustScore: 500,
          isWitnessEligible: false,
        },
        token: 'mock-token',
        csrfToken: 'mock-csrf-token',
      };

      const legacyFormatted = legacyAuthService.formatLoginResponse(mockResult as any);
      const modularFormatted = modularAuthService.formatLoginResponse(mockResult as any);

      expect(legacyFormatted).toEqual(modularFormatted);
      expect(legacyFormatted).toHaveProperty('success', true);
      expect(legacyFormatted).toHaveProperty('token');
      expect(legacyFormatted).toHaveProperty('csrfToken');
      expect(legacyFormatted).toHaveProperty('user');
    });
  });

  describe('feature flag behavior', () => {
    it('should toggle between implementations', () => {
      const { featureFlags } = require('../../src/modules/shared/config/featureFlags');
      
      // Default should be false (legacy) in test environment
      const originalValue = featureFlags.useModularIAM;
      
      // Toggle to modular
      const restore = overrideFeatureFlag('useModularIAM', true);
      expect(featureFlags.useModularIAM).toBe(true);
      
      // Restore
      restore();
      expect(featureFlags.useModularIAM).toBe(originalValue);
    });
  });
});
