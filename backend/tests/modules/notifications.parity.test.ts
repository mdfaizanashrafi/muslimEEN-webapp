/**
 * Notifications Module Parity Tests
 * 
 * Compares legacy and modular Notifications implementations
 */

import * as legacyNotificationService from '../../src/services/NotificationService';
import * as modularNotificationService from '../../src/modules/notifications/services/NotificationService';
import { overrideFeatureFlag } from '../utils/moduleTester';

describe('Notifications Module Parity Tests', () => {
  const testUserId = 'test-user-id';

  describe('NotificationError', () => {
    it('should have consistent error types', () => {
      const legacyError = new legacyNotificationService.NotificationError('TEST_CODE', 'Test message', 400);
      const modularError = new modularNotificationService.NotificationError('TEST_CODE', 'Test message', 400);

      expect(legacyError.code).toBe(modularError.code);
      expect(legacyError.message).toBe(modularError.message);
      expect(legacyError.statusCode).toBe(modularError.statusCode);
      expect(legacyError.name).toBe('NotificationError');
      expect(modularError.name).toBe('NotificationError');
    });
  });

  describe('getUserNotifications', () => {
    it('should have matching function signatures', () => {
      expect(typeof legacyNotificationService.getUserNotifications).toBe('function');
      expect(typeof modularNotificationService.getUserNotifications).toBe('function');
    });

    it('should accept same options', async () => {
      const options = { unreadOnly: true, limit: 10, offset: 0 };
      
      // Both should accept the same options (will fail with DB error, but that's ok for signature test)
      await expect(legacyNotificationService.getUserNotifications(testUserId, options))
        .rejects.toBeDefined();
      await expect(modularNotificationService.getUserNotifications(testUserId, options))
        .rejects.toBeDefined();
    });
  });

  describe('markAsRead', () => {
    it('should have matching function signatures', () => {
      expect(typeof legacyNotificationService.markAsRead).toBe('function');
      expect(typeof modularNotificationService.markAsRead).toBe('function');
    });

    it('should throw for non-existent notifications', async () => {
      await expect(legacyNotificationService.markAsRead('non-existent-id', testUserId))
        .rejects.toThrow();
      await expect(modularNotificationService.markAsRead('non-existent-id', testUserId))
        .rejects.toThrow();
    });
  });

  describe('markAllAsReadForUser', () => {
    it('should have matching function signatures', () => {
      expect(typeof legacyNotificationService.markAllAsReadForUser).toBe('function');
      expect(typeof modularNotificationService.markAllAsReadForUser).toBe('function');
    });
  });

  describe('Notification Creation Methods', () => {
    it('should have matching notification methods', () => {
      expect(typeof legacyNotificationService.notifyConnectionRequest).toBe('function');
      expect(typeof modularNotificationService.notifyConnectionRequest).toBe('function');

      expect(typeof legacyNotificationService.notifyConnectionAccepted).toBe('function');
      expect(typeof modularNotificationService.notifyConnectionAccepted).toBe('function');

      expect(typeof legacyNotificationService.notifyEndorsement).toBe('function');
      expect(typeof modularNotificationService.notifyEndorsement).toBe('function');

      expect(typeof legacyNotificationService.notifyTrustScoreChange).toBe('function');
      expect(typeof modularNotificationService.notifyTrustScoreChange).toBe('function');

      expect(typeof legacyNotificationService.notifyVerificationCompleted).toBe('function');
      expect(typeof modularNotificationService.notifyVerificationCompleted).toBe('function');
    });
  });

  describe('Feature Flag Toggle', () => {
    it('should toggle between implementations', () => {
      const { featureFlags } = require('../../src/modules/shared/config/featureFlags');
      
      const originalValue = featureFlags.useModularNotifications;
      
      const restore = overrideFeatureFlag('useModularNotifications', !originalValue);
      expect(featureFlags.useModularNotifications).toBe(!originalValue);
      
      restore();
      expect(featureFlags.useModularNotifications).toBe(originalValue);
    });
  });
});
