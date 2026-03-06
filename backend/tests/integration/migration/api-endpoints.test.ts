/**
 * API Endpoints Migration Integration Tests
 * 
 * Tests the actual HTTP endpoints to verify both legacy and modular
 * implementations work correctly through the routing layer.
 */

import request from 'supertest';
import app from '../../../src/server';
import { featureFlags } from '../../../src/modules/shared/config/featureFlags';
import { overrideFeatureFlag } from '../../utils/moduleTester';

describe('API Endpoints Migration Tests', () => {
  let authToken: string;
  let csrfToken: string;

  // Helper to get auth tokens
  beforeAll(async () => {
    // This would normally authenticate and get tokens
    // For now, we'll test unauthenticated endpoints
  });

  describe('GET /api/migration-status', () => {
    it('should return migration status with all modules listed', async () => {
      const response = await request(app)
        .get('/api/migration-status')
        .expect(200);

      expect(response.body).toHaveProperty('name', 'MuslimEEN API');
      expect(response.body).toHaveProperty('migration');
      expect(response.body.migration).toHaveProperty('status');
      expect(response.body.migration).toHaveProperty('featureFlags');
      expect(response.body.migration).toHaveProperty('modules');
      
      // Verify all modules are listed
      const modules = response.body.migration.modules;
      expect(modules).toHaveProperty('iam');
      expect(modules).toHaveProperty('profile');
      expect(modules).toHaveProperty('trust');
      expect(modules).toHaveProperty('network');
      expect(modules).toHaveProperty('notifications');
      expect(modules).toHaveProperty('invitations');
      expect(modules).toHaveProperty('marketplace');
      expect(modules).toHaveProperty('islamicFinance');
    });

    it('should reflect correct module status (legacy or modular)', async () => {
      const response = await request(app)
        .get('/api/migration-status')
        .expect(200);

      const modules = response.body.migration.modules;
      
      // Each module should be either 'legacy' or 'modular'
      Object.values(modules).forEach((status: any) => {
        expect(['legacy', 'modular']).toContain(status);
      });
    });
  });

  describe('POST /api/auth/validate-invitation', () => {
    it('should work with legacy implementation', async () => {
      // Ensure legacy mode
      const restore = overrideFeatureFlag('useModularIAM', false);

      try {
        const response = await request(app)
          .post('/api/auth/validate-invitation')
          .send({ invitationCode: 'INVALID-CODE' })
          .expect(200);

        // Should return valid: false for invalid code
        expect(response.body).toHaveProperty('success');
      } finally {
        restore();
      }
    });

    it('should work with modular implementation', async () => {
      // Enable modular mode
      const restore = overrideFeatureFlag('useModularIAM', true);

      try {
        const response = await request(app)
          .post('/api/auth/validate-invitation')
          .send({ invitationCode: 'INVALID-CODE' })
          .expect(200);

        // Should return valid: false for invalid code
        expect(response.body).toHaveProperty('success');
      } finally {
        restore();
      }
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Feature Flag Configuration', () => {
    it('should allow runtime toggling of feature flags', () => {
      const originalValue = featureFlags.useModularProfile;
      
      // Toggle
      const restore = overrideFeatureFlag('useModularProfile', !originalValue);
      expect(featureFlags.useModularProfile).toBe(!originalValue);
      
      // Restore
      restore();
      expect(featureFlags.useModularProfile).toBe(originalValue);
    });
  });
});
