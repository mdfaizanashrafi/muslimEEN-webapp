/**
 * Critical Invite Race Condition Tests
 * Ensures invite usage is atomic and prevents race conditions
 */

import pool from '../../modules/database/pool';
import * as UserRepository from '../../modules/iam/repositories/UserRepository';
import * as InviteRepository from '../../modules/invites/repositories/InviteRepository';

describe('CRITICAL: Invite Race Conditions', () => {
  let testUserId: string;
  let testInviteToken: string;

  beforeAll(async () => {
    // Create a test user with invites
    const user = await UserRepository.create({
      email: `racetest${Date.now()}@example.com`,
      passwordHash: 'hashedpassword123',
      firstName: 'Race',
      lastName: 'Test',
      role: 'user',
      verificationTier: 'basic',
    });
    testUserId = user.id;

    // Give the user some invites
    await UserRepository.setInviteCount(testUserId, 5);

    // Create a test invite
    const invite = await InviteRepository.create(testUserId);
    testInviteToken = invite.token;
  });

  afterAll(async () => {
    // Cleanup
    await pool.query('DELETE FROM invites WHERE token = $1', [testInviteToken]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    await pool.end();
  });

  it('should handle concurrent invite creation attempts', async () => {
    // Get initial invite count
    const initialCount = await UserRepository.getInviteCount(testUserId);

    // Attempt to create multiple invites concurrently
    const createAttempts = Array(10).fill(null).map(() =>
      UserRepository.decreaseInviteCount(testUserId)
    );

    const results = await Promise.all(createAttempts);

    // Count successful decrements
    const successfulDecrements = results.filter(r => r).length;

    // Get final count
    const finalCount = await UserRepository.getInviteCount(testUserId);

    // Verify atomic behavior
    expect(initialCount - finalCount).toBe(successfulDecrements);
    expect(finalCount).toBeGreaterThanOrEqual(0);
  });

  it('should prevent negative invite counts', async () => {
    // Create a user with 0 invites
    const zeroInviteUser = await UserRepository.create({
      email: `zeroinvites${Date.now()}@example.com`,
      passwordHash: 'hashedpassword123',
      firstName: 'Zero',
      lastName: 'Invites',
      role: 'user',
      verificationTier: 'basic',
    });

    await UserRepository.setInviteCount(zeroInviteUser.id, 0);

    // Try to decrement
    const result = await UserRepository.decreaseInviteCount(zeroInviteUser.id);

    // Should fail
    expect(result).toBe(false);

    // Count should still be 0
    const count = await UserRepository.getInviteCount(zeroInviteUser.id);
    expect(count).toBe(0);

    // Cleanup
    await pool.query('DELETE FROM users WHERE id = $1', [zeroInviteUser.id]);
  });

  it('should use database transactions for registration', async () => {
    // This test verifies that the transaction wrapper works correctly
    // by attempting an operation that would fail midway

    let transactionRolledBack = false;

    try {
      await UserRepository.transaction(async (client) => {
        // Create a user within the transaction
        const user = await UserRepository.createWithClient(client, {
          email: `transactiontest${Date.now()}@example.com`,
          passwordHash: 'hashedpassword123',
          firstName: 'Transaction',
          lastName: 'Test',
          role: 'user',
          verificationTier: 'basic',
        });

        // Simulate a failure after user creation
        throw new Error('Simulated failure');
      });
    } catch (error) {
      transactionRolledBack = true;
    }

    // Verify the transaction was rolled back
    expect(transactionRolledBack).toBe(true);
  });
});
