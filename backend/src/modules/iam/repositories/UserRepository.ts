/**
 * User Repository
 * 
 * Data access for user identity records
 * Owns: users table (core identity fields only)
 * 
 * TRANSACTION SUPPORT: All functions support client-based queries for transactions
 */

import pool, { transaction } from '../../database/pool';
import { PoolClient } from 'pg';
import { UserRole, VerificationTier } from '../../shared/types';

export interface UserIdentity {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  verificationTier: VerificationTier;
  trustScore: number;
  isActive: boolean;
  invitesRemaining: number;
  passwordHash?: string;
  lastLogin?: Date;
  createdAt: Date;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  verificationTier: VerificationTier;
}

// ============================================================================
// READ OPERATIONS (don't need transaction client)
// ============================================================================

/**
 * Find user by ID
 */
export const findById = async (id: string): Promise<UserIdentity | null> => {
  const result = await pool.query(
    `SELECT id, email, first_name, last_name, role, verification_tier, 
            trust_score, is_active, password_hash, invites_remaining,
            last_login, created_at
     FROM users 
     WHERE id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) return null;
  return mapToUserIdentity(result.rows[0]);
};

/**
 * Find user by email
 */
export const findByEmail = async (email: string): Promise<UserIdentity | null> => {
  const result = await pool.query(
    `SELECT id, email, first_name, last_name, role, verification_tier,
            trust_score, is_active, password_hash, invites_remaining,
            last_login, created_at
     FROM users 
     WHERE email = $1`,
    [email.toLowerCase()]
  );
  
  if (result.rows.length === 0) return null;
  return mapToUserIdentity(result.rows[0]);
};

/**
 * Find user by email (with transaction client)
 */
export const findByEmailWithClient = async (
  client: PoolClient, 
  email: string
): Promise<UserIdentity | null> => {
  const result = await client.query(
    `SELECT id, email, first_name, last_name, role, verification_tier,
            trust_score, is_active, password_hash, invites_remaining,
            last_login, created_at
     FROM users 
     WHERE email = $1`,
    [email.toLowerCase()]
  );
  
  if (result.rows.length === 0) return null;
  return mapToUserIdentity(result.rows[0]);
};

// ============================================================================
// WRITE OPERATIONS (support both pool and transaction client)
// ============================================================================

/**
 * Create new user
 */
export const create = async (input: CreateUserInput): Promise<UserIdentity> => {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role, verification_tier, invites_remaining)
     VALUES ($1, $2, $3, $4, $5, $6, 0)
     RETURNING id, email, first_name, last_name, role, verification_tier,
               trust_score, is_active, invites_remaining, last_login, created_at`,
    [input.email.toLowerCase(), input.passwordHash, input.firstName, input.lastName, input.role, input.verificationTier]
  );
  
  return mapToUserIdentity(result.rows[0]);
};

/**
 * Create new user (with transaction client)
 * Used within database transactions for atomic operations
 */
export const createWithClient = async (
  client: PoolClient, 
  input: CreateUserInput
): Promise<UserIdentity> => {
  const result = await client.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role, verification_tier, invites_remaining)
     VALUES ($1, $2, $3, $4, $5, $6, 0)
     RETURNING id, email, first_name, last_name, role, verification_tier,
               trust_score, is_active, invites_remaining, last_login, created_at`,
    [input.email.toLowerCase(), input.passwordHash, input.firstName, input.lastName, input.role, input.verificationTier]
  );
  
  return mapToUserIdentity(result.rows[0]);
};

/**
 * Update last login timestamp
 */
export const updateLastLogin = async (userId: string): Promise<void> => {
  await pool.query(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [userId]
  );
};

/**
 * Update user role
 */
export const updateRole = async (userId: string, role: UserRole): Promise<void> => {
  await pool.query(
    'UPDATE users SET role = $1 WHERE id = $2',
    [role, userId]
  );
};

// ============================================================================
// INVITE COUNT MANAGEMENT
// ============================================================================

/**
 * Set user's invite count
 */
export const setInviteCount = async (userId: string, count: number): Promise<void> => {
  await pool.query(
    'UPDATE users SET invites_remaining = $1 WHERE id = $2',
    [count, userId]
  );
};

/**
 * Set user's invite count (with transaction client)
 */
export const setInviteCountWithClient = async (
  client: PoolClient, 
  userId: string, 
  count: number
): Promise<void> => {
  await client.query(
    'UPDATE users SET invites_remaining = $1 WHERE id = $2',
    [count, userId]
  );
};

/**
 * Decrease user's remaining invite count
 * SECURITY FIX: Atomic check-and-decrement prevents race conditions
 * @returns true if decrement succeeded (user had invites), false otherwise
 */
export const decreaseInviteCount = async (userId: string): Promise<boolean> => {
  const result = await pool.query(
    `UPDATE users 
     SET invites_remaining = invites_remaining - 1 
     WHERE id = $1 AND invites_remaining > 0
     RETURNING invites_remaining`,
    [userId]
  );
  return result.rowCount !== null && result.rowCount > 0;
};

/**
 * Increase user's remaining invite count
 */
export const increaseInviteCount = async (userId: string): Promise<void> => {
  await pool.query(
    'UPDATE users SET invites_remaining = invites_remaining + 1 WHERE id = $1',
    [userId]
  );
};

/**
 * Get user's remaining invite count
 */
export const getInviteCount = async (userId: string): Promise<number> => {
  const result = await pool.query(
    'SELECT invites_remaining FROM users WHERE id = $1',
    [userId]
  );
  
  return result.rows.length > 0 ? result.rows[0].invites_remaining : 0;
};

// ============================================================================
// TRANSACTION SUPPORT
// ============================================================================

/**
 * Execute a function within a database transaction
 * This is a convenience re-export from the pool module
 */
export { transaction };

// ============================================================================
// MAPPER
// ============================================================================

const mapToUserIdentity = (row: any): UserIdentity => ({
  id: row.id,
  email: row.email,
  firstName: row.first_name,
  lastName: row.last_name,
  fullName: `${row.first_name} ${row.last_name}`,
  role: row.role,
  verificationTier: row.verification_tier,
  trustScore: row.trust_score || 0,
  isActive: row.is_active !== false,
  invitesRemaining: row.invites_remaining || 0,
  passwordHash: row.password_hash,
  lastLogin: row.last_login,
  createdAt: row.created_at,
});
