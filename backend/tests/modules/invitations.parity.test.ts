/**
 * Invitations Module Parity Tests
 * 
 * Compares legacy and modular Invitations implementations
 */

import * as legacyInvitationService from '../../src/services/InvitationService';
import * as modularInvitationService from '../../src/modules/invitations/services/InvitationService';
import { overrideFeatureFlag } from '../utils/moduleTester';

describe('Invitations Module Parity Tests', () => {
  const testInvitation = {
    inviterId: 'test-inviter-id',
    inviteeEmail: 'test@example.com',
  };

  describe('InvitationError', () => {
    it('should have consistent error types', () => {
      const legacyError = new legacyInvitationService.InvitationError('TEST_CODE', 'Test message', 400);
      const modularError = new modularInvitationService.InvitationError('TEST_CODE', 'Test message', 400);

      expect(legacyError.code).toBe(modularError.code);
      expect(legacyError.message).toBe(modularError.message);
      expect(legacyError.statusCode).toBe(modularError.statusCode);
      expect(legacyError.name).toBe('InvitationError');
      expect(modularError.name).toBe('InvitationError');
    });
  });

  describe('validateInvitation', () => {
    it('should have matching function signatures', () => {
      expect(typeof legacyInvitationService.validateInvitation).toBe('function');
      expect(typeof modularInvitationService.validateInvitation).toBe('function');
    });

    it('should reject invalid codes consistently', async () => {
      await expect(legacyInvitationService.validateInvitation('INVALID-CODE'))
        .rejects.toThrow();
      await expect(modularInvitationService.validateInvitation('INVALID-CODE'))
        .rejects.toThrow();
    });
  });

  describe('createInvitation', () => {
    it('should validate email format consistently', async () => {
      const invalidData = { ...testInvitation, inviteeEmail: 'invalid-email' };

      await expect(legacyInvitationService.createInvitation(invalidData))
        .rejects.toThrow();
      await expect(modularInvitationService.createInvitation(invalidData))
        .rejects.toThrow();
    });
  });

  describe('Service Methods', () => {
    it('should have matching method signatures', () => {
      expect(typeof legacyInvitationService.getInvitationsByInviter).toBe('function');
      expect(typeof modularInvitationService.getInvitationsByInviter).toBe('function');

      expect(typeof legacyInvitationService.getPendingInvitationCount).toBe('function');
      expect(typeof modularInvitationService.getPendingInvitationCount).toBe('function');

      expect(typeof legacyInvitationService.revokeInvitation).toBe('function');
      expect(typeof modularInvitationService.revokeInvitation).toBe('function');

      expect(typeof legacyInvitationService.acceptInvitation).toBe('function');
      expect(typeof modularInvitationService.acceptInvitation).toBe('function');
    });
  });

  describe('Feature Flag Toggle', () => {
    it('should toggle between implementations', () => {
      const { featureFlags } = require('../../src/modules/shared/config/featureFlags');
      
      const originalValue = featureFlags.useModularInvitations;
      
      const restore = overrideFeatureFlag('useModularInvitations', !originalValue);
      expect(featureFlags.useModularInvitations).toBe(!originalValue);
      
      restore();
      expect(featureFlags.useModularInvitations).toBe(originalValue);
    });
  });
});
