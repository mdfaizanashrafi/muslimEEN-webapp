/**
 * CHAOS TEST: Rapid User Actions
 * Simulates double-clicks, spam, and refresh storms
 */

import request from 'supertest';
import app from '../../server';
import pool from '../../modules/database/pool';

describe('CHAOS: Rapid Actions', () => {
  const TEST_EMAIL = `rapid${Date.now()}@test.com`;
  
  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
    await pool.end();
  });

  describe('Double-submit login attempts', () => {
    it('should handle concurrent login requests without crashing', async () => {
      // Simulate double-click: two requests sent simultaneously
      const loginRequests = Array(2).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@test.com',
            password: 'WrongPass123!',
          })
      );

      const responses = await Promise.all(loginRequests);
      
      // Both should complete (not crash)
      responses.forEach(response => {
        expect([401, 423, 429]).toContain(response.status);
      });
    });

    it('should handle rapid sequential requests', async () => {
      const results: number[] = [];
      
      // Send 10 requests as fast as possible
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: `test${i}@test.com`,
            password: 'TestPass123!',
          });
        results.push(response.status);
      }

      // Should not crash - all requests complete
      expect(results.length).toBe(10);
      
      // Most should be rate limited after a few
      const rateLimitedCount = results.filter(s => s === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });

  describe('API call during token refresh', () => {
    it('should handle concurrent protected route requests', async () => {
      // Multiple requests to protected endpoint without auth
      const requests = Array(5).fill(null).map(() =>
        request(app)
          .get('/api/users/me')
      );

      const responses = await Promise.all(requests);
      
      // All should return 401 (not crash)
      responses.forEach(response => {
        expect(response.status).toBe(401);
      });
    });
  });
});

describe('CHAOS: Invalid Inputs', () => {
  describe('Extremely long strings', () => {
    it('should reject emails that are too long', async () => {
      const longEmail = 'a'.repeat(300) + '@test.com';
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: longEmail,
          password: 'TestPass123!',
        });

      expect([400, 429]).toContain(response.status);
    });

    it('should handle payload size limits', async () => {
      const hugePayload = {
        email: 'test@test.com',
        password: 'A1!'.repeat(10000),
      };
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(hugePayload);

      expect([413, 400, 500]).toContain(response.status);
    });
  });

  describe('Malformed inputs', () => {
    it('should handle null values gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: null,
          password: null,
        });

      expect([400, 429]).toContain(response.status);
    });

    it('should handle empty JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
    });
  });
});
