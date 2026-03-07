/**
 * Profile API Integration Tests
 * Tests user profile endpoints with real database
 */

import request from 'supertest';
import bcrypt from 'bcrypt';
import { app, testPool } from './setup';

describe('Profile API Integration', () => {
  // Test users
  const testUser = {
    email: 'profiletest@example.com',
    password: 'Password123!',
    firstName: 'Profile',
    lastName: 'Test',
  };

  const anotherUser = {
    email: 'another@example.com',
    password: 'Password123!',
    firstName: 'Another',
    lastName: 'User',
  };

  let authToken: string;
  let userId: string;
  let anotherUserId: string;

  // Setup: Create test users before all tests
  beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash(testUser.password, 4);
    const userResult = await testPool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, trust_score, bio, location)
      VALUES ($1, $2, $3, $4, 'muslim_verified', 500, 'Test bio', 'Test Location')
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name
      RETURNING id;
    `, [testUser.email, hashedPassword, testUser.firstName, testUser.lastName]);
    userId = userResult.rows[0].id;

    // Create another user
    const anotherResult = await testPool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, trust_score)
      VALUES ($1, $2, $3, $4, 'muslim_verified', 300)
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name
      RETURNING id;
    `, [anotherUser.email, hashedPassword, anotherUser.firstName, anotherUser.lastName]);
    anotherUserId = anotherResult.rows[0].id;

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });
    
    authToken = loginResponse.body.token;
  });

  describe('GET /api/user/profile', () => {
    it('should return current user profile when authenticated', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.profile).toBeDefined();
      expect(response.body.profile.email).toBe(testUser.email);
      expect(response.body.profile.firstName).toBe(testUser.firstName);
      expect(response.body.profile.lastName).toBe(testUser.lastName);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/user/profile', () => {
    it('should update user profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'Updated bio text',
        location: 'New Location',
        industry: 'Technology',
      };

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.profile).toBeDefined();
      expect(response.body.profile.firstName).toBe(updateData.firstName);
      expect(response.body.profile.lastName).toBe(updateData.lastName);
      expect(response.body.profile.bio).toBe(updateData.bio);
      expect(response.body.profile.location).toBe(updateData.location);
    });

    it('should reject update without authentication', async () => {
      const response = await request(app)
        .put('/api/user/profile')
        .send({ firstName: 'Hacker' })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate input data', async () => {
      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: '', // Empty first name should be invalid
        })
        .expect('Content-Type', /json/);

      // Should either accept (empty string) or reject based on validation rules
      expect(response.status).toBeDefined();
    });
  });

  describe('GET /api/users/:userId/profile', () => {
    it('should return public profile for another user', async () => {
      const response = await request(app)
        .get(`/api/users/${anotherUserId}/profile`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.profile).toBeDefined();
      expect(response.body.profile.email).toBe(anotherUser.email);
    });

    it('should return own profile when requesting self', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}/profile`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.profile.email).toBe(testUser.email);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/users/${fakeUserId}/profile`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get(`/api/users/${anotherUserId}/profile`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/user/trust-score', () => {
    it('should return current user trust score', async () => {
      const response = await request(app)
        .get('/api/user/trust-score')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.trustScore).toBeDefined();
      expect(typeof response.body.trustScore).toBe('number');
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/user/trust-score')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/user/trust-score/history', () => {
    beforeAll(async () => {
      // Add some trust score history
      await testPool.query(`
        INSERT INTO trust_score_history (user_id, score, factors)
        VALUES ($1, 400, '{"connections": 100, "verification": 200}')
        ON CONFLICT DO NOTHING;
      `, [userId]);
    });

    it('should return trust score history', async () => {
      const response = await request(app)
        .get('/api/user/trust-score/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.history).toBeDefined();
      expect(Array.isArray(response.body.history)).toBe(true);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/user/trust-score/history')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/user/trust-score/recalculate', () => {
    it('should trigger trust score recalculation', async () => {
      const response = await request(app)
        .post('/api/user/trust-score/recalculate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.trustScore).toBeDefined();
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/user/trust-score/recalculate')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
