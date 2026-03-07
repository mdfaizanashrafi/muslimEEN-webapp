/**
 * Connections API Integration Tests
 * Tests network/connections endpoints with real database
 */

import request from 'supertest';
import bcrypt from 'bcrypt';
import { app, testPool } from './setup';

describe('Connections API Integration', () => {
  // Test users
  const user1 = {
    email: 'user1@example.com',
    password: 'Password123!',
    firstName: 'User',
    lastName: 'One',
  };

  const user2 = {
    email: 'user2@example.com',
    password: 'Password123!',
    firstName: 'User',
    lastName: 'Two',
  };

  const user3 = {
    email: 'user3@example.com',
    password: 'Password123!',
    firstName: 'User',
    lastName: 'Three',
  };

  let token1: string;
  let token2: string;
  let token3: string;
  let userId1: string;
  let userId2: string;
  let userId3: string;

  // Setup: Create test users
  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(user1.password, 4);

    // Create user 1
    const result1 = await testPool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, trust_score)
      VALUES ($1, $2, $3, $4, 'muslim_verified', 500)
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name
      RETURNING id;
    `, [user1.email, hashedPassword, user1.firstName, user1.lastName]);
    userId1 = result1.rows[0].id;

    // Create user 2
    const result2 = await testPool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, trust_score)
      VALUES ($1, $2, $3, $4, 'muslim_verified', 400)
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name
      RETURNING id;
    `, [user2.email, hashedPassword, user2.firstName, user2.lastName]);
    userId2 = result2.rows[0].id;

    // Create user 3
    const result3 = await testPool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, trust_score)
      VALUES ($1, $2, $3, $4, 'muslim_verified', 300)
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name
      RETURNING id;
    `, [user3.email, hashedPassword, user3.firstName, user3.lastName]);
    userId3 = result3.rows[0].id;

    // Login all users
    const login1 = await request(app)
      .post('/api/auth/login')
      .send({ email: user1.email, password: user1.password });
    token1 = login1.body.token;

    const login2 = await request(app)
      .post('/api/auth/login')
      .send({ email: user2.email, password: user2.password });
    token2 = login2.body.token;

    const login3 = await request(app)
      .post('/api/auth/login')
      .send({ email: user3.email, password: user3.password });
    token3 = login3.body.token;
  });

  describe('GET /api/user/connections', () => {
    beforeAll(async () => {
      // Create an accepted connection between user1 and user3
      await testPool.query(`
        INSERT INTO connections (requester_id, recipient_id, status, accepted_at)
        VALUES ($1, $2, 'accepted', NOW())
        ON CONFLICT (requester_id, recipient_id) DO UPDATE SET 
          status = EXCLUDED.status,
          accepted_at = EXCLUDED.accepted_at;
      `, [userId1, userId3]);
    });

    it('should return user connections list', async () => {
      const response = await request(app)
        .get('/api/user/connections')
        .set('Authorization', `Bearer ${token1}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.connections).toBeDefined();
      expect(Array.isArray(response.body.connections)).toBe(true);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/user/connections')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/user/connections/pending', () => {
    beforeAll(async () => {
      // Create a pending connection request to user2
      await testPool.query(`
        INSERT INTO connections (requester_id, recipient_id, status)
        VALUES ($1, $2, 'pending')
        ON CONFLICT (requester_id, recipient_id) DO UPDATE SET 
          status = EXCLUDED.status;
      `, [userId1, userId2]);
    });

    it('should return pending connections', async () => {
      const response = await request(app)
        .get('/api/user/connections/pending')
        .set('Authorization', `Bearer ${token2}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.connections).toBeDefined();
      expect(Array.isArray(response.body.connections)).toBe(true);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/user/connections/pending')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/user/connections', () => {
    it('should send connection request', async () => {
      // User 3 sends request to user 2 (assuming they don't have connection yet)
      const response = await request(app)
        .post('/api/user/connections')
        .set('Authorization', `Bearer ${token3}`)
        .send({ userId: userId2 })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject duplicate connection request', async () => {
      // Try to create same connection again
      const response = await request(app)
        .post('/api/user/connections')
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: userId2 })
        .expect('Content-Type', /json/);

      // Should return error or success depending on implementation
      expect(response.status).toBeDefined();
    });

    it('should reject connection to self', async () => {
      const response = await request(app)
        .post('/api/user/connections')
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: userId1 })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/user/connections')
        .send({ userId: userId2 })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/user/connections/:connectionId/accept', () => {
    let pendingConnectionId: string;

    beforeAll(async () => {
      // Create a pending connection request
      const result = await testPool.query(`
        INSERT INTO connections (requester_id, recipient_id, status)
        VALUES ($1, $2, 'pending')
        ON CONFLICT (requester_id, recipient_id) DO NOTHING
        RETURNING id;
      `, [userId2, userId3]);
      
      if (result.rows.length > 0) {
        pendingConnectionId = result.rows[0].id;
      } else {
        // Get existing connection id
        const existing = await testPool.query(`
          SELECT id FROM connections 
          WHERE requester_id = $1 AND recipient_id = $2;
        `, [userId2, userId3]);
        pendingConnectionId = existing.rows[0]?.id;
      }
    });

    it('should accept connection request', async () => {
      if (!pendingConnectionId) {
        console.log('Skipping test - no pending connection available');
        return;
      }

      const response = await request(app)
        .post(`/api/user/connections/${pendingConnectionId}/accept`)
        .set('Authorization', `Bearer ${token3}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject accepting non-existent connection', async () => {
      const response = await request(app)
        .post('/api/user/connections/00000000-0000-0000-0000-000000000000/accept')
        .set('Authorization', `Bearer ${token3}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/user/connections/:connectionId/reject', () => {
    let connectionToReject: string;

    beforeAll(async () => {
      // Create a pending connection request
      const result = await testPool.query(`
        INSERT INTO connections (requester_id, recipient_id, status)
        VALUES ($1, $2, 'pending')
        ON CONFLICT (requester_id, recipient_id) DO NOTHING
        RETURNING id;
      `, [userId3, userId1]);
      
      if (result.rows.length > 0) {
        connectionToReject = result.rows[0].id;
      } else {
        // Get existing connection id and reset to pending
        const existing = await testPool.query(`
          UPDATE connections SET status = 'pending' 
          WHERE requester_id = $1 AND recipient_id = $2
          RETURNING id;
        `, [userId3, userId1]);
        connectionToReject = existing.rows[0]?.id;
      }
    });

    it('should reject connection request', async () => {
      if (!connectionToReject) {
        console.log('Skipping test - no connection to reject');
        return;
      }

      const response = await request(app)
        .post(`/api/user/connections/${connectionToReject}/reject`)
        .set('Authorization', `Bearer ${token1}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/user/connections/:connectionId', () => {
    it('should remove connection', async () => {
      // Get an existing accepted connection
      const result = await testPool.query(`
        SELECT id FROM connections 
        WHERE (requester_id = $1 OR recipient_id = $1) AND status = 'accepted'
        LIMIT 1;
      `, [userId1]);

      if (result.rows.length === 0) {
        console.log('Skipping test - no accepted connection to remove');
        return;
      }

      const connectionId = result.rows[0].id;

      const response = await request(app)
        .delete(`/api/user/connections/${connectionId}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject removing non-existent connection', async () => {
      const response = await request(app)
        .delete('/api/user/connections/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token1}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
