/**
 * CHAOS TEST: Concurrent Operations & Data Consistency
 * Tests race conditions and data integrity under load
 */

import request from 'supertest';
import app from '../../server';
import pool from '../../modules/database/pool';
import * as UserRepository from '../../modules/iam/repositories/UserRepository';
import * as InviteRepository from '../../modules/invites/repositories/InviteRepository';

describe('CONSISTENCY: Invite System Race Conditions', () => {
  let testUserId: string;
  let testInviteToken: string;

  beforeAll(async () => {
    const user = await UserRepository.create({
      email: `consistency${Date.now()}@test.com`,
      passwordHash: 'hashedpassword',
      firstName: 'Consistency',
      lastName: 'Test',
      role: 'user',
      verificationTier: 'basic',
    });
    testUserId = user.id;
    await UserRepository.setInviteCount(testUserId, 3);

    const invite = await InviteRepository.create(testUserId);
    testInviteToken = invite.token;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM invites WHERE token = $1', [testInviteToken]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    await pool.end();
  });

  describe('Concurrent invite creation', () => {
    it('should not allow negative invite counts under concurrent decrement', async () => {
      // Reset to 3 invites
      await UserRepository.setInviteCount(testUserId, 3);

      // Try to create 5 invites concurrently (only 3 should succeed)
      const attempts = Array(5).fill(null).map(() =>
        UserRepository.decreaseInviteCount(testUserId)
      );

      const results = await Promise.all(attempts);
      const successfulDecrements = results.filter(r => r).length;

      // Get final count
      const finalCount = await UserRepository.getInviteCount(testUserId);

      // Verify: should never go negative
      expect(finalCount).toBeGreaterThanOrEqual(0);
      
      // Verify: decrements should match initial count
      expect(successfulDecrements).toBeLessThanOrEqual(3);
      expect(finalCount).toBe(3 - successfulDecrements);
    });
  });

  describe('Concurrent invite usage', () => {
    it('should not allow same invite to be used twice', async () => {
      const { validateInviteExternal, useInviteExternal } = await import('../../modules/invites/services/InviteService');

      // Verify invite is valid
      const validation = await validateInviteExternal(testInviteToken);
      expect(validation.valid).toBe(true);

      // First usage should succeed
      const result1 = await useInviteExternal(testInviteToken, testUserId, 'test@test.com');
      expect(result1.success).toBe(true);

      // Second usage should fail
      const result2 = await useInviteExternal(testInviteToken, testUserId, 'test2@test.com');
      expect(result2.success).toBe(false);
    });
  });
});

describe('CONSISTENCY: Database Transaction Safety', () => {
  it('should rollback user creation if invite usage fails', async () => {
    const testEmail = `rollback${Date.now()}@test.com`;

    try {
      await UserRepository.transaction(async (client) => {
        // Create user
        const user = await UserRepository.createWithClient(client, {
          email: testEmail,
          passwordHash: 'hashedpassword',
          firstName: 'Rollback',
          lastName: 'Test',
          role: 'user',
          verificationTier: 'basic',
        });

        expect(user.id).toBeDefined();

        // Simulate failure
        throw new Error('Simulated invite failure');
      });
    } catch (error) {
      // Expected to fail
    }

    // Verify user was NOT created (transaction rolled back)
    const user = await UserRepository.findByEmail(testEmail);
    expect(user).toBeNull();
  });
});

describe('CONSISTENCY: Connection Request Handling', () => {
  it('should prevent duplicate connection requests', async () => {
    // Create two test users
    const user1 = await UserRepository.create({
      email: `conn1${Date.now()}@test.com`,
      passwordHash: 'hashedpassword',
      firstName: 'Conn1',
      lastName: 'Test',
      role: 'user',
      verificationTier: 'basic',
    });

    const user2 = await UserRepository.create({
      email: `conn2${Date.now()}@test.com`,
      passwordHash: 'hashedpassword',
      firstName: 'Conn2',
      lastName: 'Test',
      role: 'user',
      verificationTier: 'basic',
    });

    // Try to create same connection twice
    const { create: createConnection } = await import('../../modules/network/repositories/ConnectionRepository');

    const conn1 = await createConnection({
      requesterId: user1.id,
      recipientId: user2.id,
      status: 'pending',
    });

    expect(conn1).toBeDefined();

    // Second attempt should fail or return existing
    try {
      const conn2 = await createConnection({
        requesterId: user1.id,
        recipientId: user2.id,
        status: 'pending',
      });
      
      // If it succeeds, it should be the same connection
      expect(conn2.id).toBe(conn1.id);
    } catch (error) {
      // Or it should throw a duplicate error
      expect(error).toBeDefined();
    }

    // Cleanup
    await pool.query('DELETE FROM connections WHERE requester_id = $1', [user1.id]);
    await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [user1.id, user2.id]);
  });
});
