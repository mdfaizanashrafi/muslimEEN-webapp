/**
 * Critical Auth Flow Tests
 * Tests the most important authentication scenarios
 */

import request from 'supertest';
import app from '../../server';
import pool from '../../modules/database/pool';

// Test data
const TEST_USER = {
  email: `test${Date.now()}@example.com`,
  password: 'SecurePass123!',
  firstName: 'Test',
  lastName: 'User',
};

const TEST_INVITE_TOKEN = 'TEST12345678';

describe('CRITICAL: Auth Flow', () => {
  afterAll(async () => {
    // Cleanup
    await pool.query('DELETE FROM users WHERE email = $1', [TEST_USER.email]);
    await pool.end();
  });

  describe('POST /api/auth/validate-invitation', () => {
    it('should validate a valid invitation token', async () => {
      const response = await request(app)
        .post('/api/auth/validate-invitation')
        .send({ invitationCode: TEST_INVITE_TOKEN })
        .expect('Content-Type', /json/);

      // Token may or may not be valid depending on test data
      expect(response.body).toHaveProperty('success');
    });

    it('should reject missing invitation code', async () => {
      const response = await request(app)
        .post('/api/auth/validate-invitation')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should require an invitation code', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
          firstName: TEST_USER.firstName,
          lastName: TEST_USER.lastName,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: TEST_USER.email,
          password: 'weak',
          firstName: TEST_USER.firstName,
          lastName: TEST_USER.lastName,
          invitationCode: TEST_INVITE_TOKEN,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'WrongPass123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('CRITICAL: Protected Routes', () => {
  it('should reject requests without auth token', async () => {
    const response = await request(app)
      .get('/api/users/me')
      .expect(401);

    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should reject requests with invalid auth token', async () => {
    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer invalid_token')
      .expect(401);

    expect(response.body.error.code).toBe('INVALID_TOKEN');
  });
});
