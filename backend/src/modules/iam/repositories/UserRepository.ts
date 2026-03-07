/**
 * User Repository
 * Data access for user identity records
 * Owns: users table (core identity fields only)
 */

import pool from '../../database/pool';
import { UserRole, VerificationTier } from '../../../types/index';

export interface UserIdentity {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  verificationTier: VerificationTier;
  trustScore: number;
  isWitnessEligible: boolean;
  isActive: boolean;
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

/**
 * Find user by ID
 */
export const findById = async (id: string): Promise<UserIdentity | null> => {
  const result = await pool.query(
    `SELECT id, email, first_name, last_name, role, verification_tier, 
            trust_score, is_witness_eligible, is_active, password_hash, 
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
            trust_score, is_witness_eligible, is_active, password_hash,
            last_login, created_at
     FROM users 
     WHERE email = $1`,
    [email.toLowerCase()]
  );
  
  if (result.rows.length === 0) return null;
  return mapToUserIdentity(result.rows[0]);
};

/**
 * Create new user
 */
export const create = async (input: CreateUserInput): Promise<UserIdentity> => {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role, verification_tier)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, first_name, last_name, role, verification_tier,
               trust_score, is_witness_eligible, is_active, last_login, created_at`,
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
  isWitnessEligible: row.is_witness_eligible || false,
  isActive: row.is_active !== false,
  passwordHash: row.password_hash,
  lastLogin: row.last_login,
  createdAt: row.created_at,
});
