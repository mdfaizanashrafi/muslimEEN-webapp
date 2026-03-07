/**
 * Auth API Integration Tests
 * Tests authentication endpoints with real database
 */

import request from 'supertest';
import bcrypt from 'bcrypt';
import { app, testPool } from './setup';

describe('Auth API Integration', () => {
  // Test data
  const validUser = {
    email: 'newuser@example.com',
    password: 'SecurePass123!',
    firstName: 'New',
    lastName: 'User',
  };

  const existingUser = {
    email: 'existing@example.com',
    password: 'Password123!',
    firstName: 'Existing',
    lastName: 'User',
  };

  // Setup: Create existing user before tests
  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(existingUser.password, 4);
    await testPool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, trust_score)
      VALUES ($1, $2, $3, $4, 'muslim_verified', 500)
      ON CONFLICT (email) DO NOTHING;
    `, [existingUser.email, hashedPassword, existingUser.firstName, existingUser.lastName]);

    // Create a valid invitation
    await testPool.query(`
      INSERT INTO invitations (code, invitee_email, status, expires_at)
      VALUES ('TESTINV001', $1, 'pending', NOW() + INTERVAL '30 days')
      ON CONFLICT (code) DO NOTHING;
    `, [validUser.email]);
  });

  describe('POST /api/auth/validate-invitation', () => {
    it('should validate a valid invitation code', async () => {
      const response = await request(app)
        .post('/api/auth/validate-invitation')
        .send({ invitationCode: 'TESTINV001' })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid invitation code', async () => {
      const response = await request(app)
        .post('/api/auth/validate-invitation')
        .send({ invitationCode: 'INVALID-CODE' })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.valid).toBe(false);
    });

    it('should return 400 for missing invitation code', async () => {
      const response = await request(app)
        .post('/api/auth/validate-invitation')
        .send({})
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid invitation', async () => {
      // Create a fresh invitation for this test
      await testPool.query(`
        INSERT INTO invitations (code, invitee_email, status, expires_at)
        VALUES ('NEWUSER001', $1, 'pending', NOW() + INTERVAL '30 days')
        ON CONFLICT (code) DO NOTHING;
      `, [`new${Date.now()}@example.com`]);

      const uniqueEmail = `new${Date.now()}@example.com`;

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: uniqueEmail,
          password: validUser.password,
          firstName: validUser.firstName,
          lastName: validUser.lastName,
          invitationCode: 'NEWUSER001',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(uniqueEmail);
    });

    it('should reject registration without invitation', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'noinvite@example.com',
          password: validUser.password,
          firstName: validUser.firstName,
          lastName: validUser.lastName,
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'weakpass@example.com',
          password: '123',
          firstName: validUser.firstName,
          lastName: validUser.lastName,
          invitationCode: 'TESTINV001',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject duplicate email registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: existingUser.email,
          password: validUser.password,
          firstName: validUser.firstName,
          lastName: validUser.lastName,
          invitationCode: 'TESTINV001',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate valid user and return token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: existingUser.email,
          password: existingUser.password,
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(existingUser.email);
    });

    it('should reject invalid credentials (wrong password)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: existingUser.email,
          password: 'WrongPassword123!',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123!',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: existingUser.password })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;

    beforeAll(async () => {
      // Login to get token
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: existingUser.email,
          password: existingUser.password,
        });
      authToken = response.body.token;
    });

    it('should return current user when authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(existingUser.email);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: existingUser.email,
          password: existingUser.password,
        });
      authToken = response.body.token;
    });

    it('should logout authenticated user', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject unauthenticated logout', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
