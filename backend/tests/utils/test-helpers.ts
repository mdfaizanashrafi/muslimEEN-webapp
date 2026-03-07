/**
 * Test Helpers
 * Utility functions for integration and unit tests
 */

import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

/**
 * Create a test user in the database
 */
export async function createTestUser(
  pool: Pool,
  userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
    trustScore?: number;
  }
): Promise<string> {
  const hashedPassword = await bcrypt.hash(userData.password, 4);
  
  const result = await pool.query(`
    INSERT INTO users (email, password_hash, first_name, last_name, role, trust_score, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    ON CONFLICT (email) DO UPDATE SET 
      password_hash = EXCLUDED.password_hash,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      role = EXCLUDED.role,
      trust_score = EXCLUDED.trust_score
    RETURNING id;
  `, [
    userData.email,
    hashedPassword,
    userData.firstName,
    userData.lastName,
    userData.role || 'muslim_verified',
    userData.trustScore || 500,
  ]);

  return result.rows[0].id;
}

/**
 * Create a test invitation
 */
export async function createTestInvitation(
  pool: Pool,
  invitationData: {
    code: string;
    inviteeEmail: string;
    status?: string;
    inviterId?: string;
  }
): Promise<void> {
  await pool.query(`
    INSERT INTO invitations (code, invitee_email, status, expires_at, inviter_id)
    VALUES ($1, $2, $3, NOW() + INTERVAL '30 days', $4)
    ON CONFLICT (code) DO UPDATE SET 
      invitee_email = EXCLUDED.invitee_email,
      status = EXCLUDED.status;
  `, [
    invitationData.code,
    invitationData.inviteeEmail,
    invitationData.status || 'pending',
    invitationData.inviterId || null,
  ]);
}

/**
 * Create a test marketplace item
 */
export async function createTestMarketplaceItem(
  pool: Pool,
  itemData: {
    vertical: string;
    title: string;
    description: string;
    providerId: string;
    category?: string;
  }
): Promise<string> {
  const result = await pool.query(`
    INSERT INTO marketplace_items (vertical, title, description, provider_id, category, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING id;
  `, [
    itemData.vertical,
    itemData.title,
    itemData.description,
    itemData.providerId,
    itemData.category || 'General',
  ]);

  return result.rows[0].id;
}

/**
 * Create a connection between two users
 */
export async function createTestConnection(
  pool: Pool,
  requesterId: string,
  recipientId: string,
  status: 'pending' | 'accepted' | 'rejected' = 'pending'
): Promise<string> {
  const result = await pool.query(`
    INSERT INTO connections (requester_id, recipient_id, status, created_at, accepted_at)
    VALUES ($1, $2, $3, NOW(), ${status === 'accepted' ? 'NOW()' : 'NULL'})
    ON CONFLICT (requester_id, recipient_id) DO UPDATE SET 
      status = EXCLUDED.status,
      accepted_at = ${status === 'accepted' ? 'NOW()' : 'NULL'}
    RETURNING id;
  `, [requesterId, recipientId, status]);

  return result.rows[0].id;
}

/**
 * Clear specific table data
 */
export async function clearTable(pool: Pool, tableName: string): Promise<void> {
  await pool.query(`TRUNCATE TABLE ${tableName} CASCADE;`);
}

/**
 * Generate a unique email for testing
 */
export function generateUniqueEmail(prefix: string = 'test'): string {
  return `${prefix}${Date.now()}${Math.random().toString(36).substring(2, 7)}@example.com`;
}

/**
 * Generate a unique invitation code
 */
export function generateUniqueInvitationCode(): string {
  return `INV${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
}

/**
 * Verify JWT token structure (not signature)
 */
export function isValidJWT(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Try to decode header and payload
    JSON.parse(Buffer.from(parts[0], 'base64').toString());
    JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for a specified duration
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; delay?: number } = {}
): Promise<T> {
  const { retries = 3, delay = 1000 } = options;
  
  let lastError: Error;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < retries - 1) {
        await wait(delay * Math.pow(2, i));
      }
    }
  }
  
  throw lastError!;
}
