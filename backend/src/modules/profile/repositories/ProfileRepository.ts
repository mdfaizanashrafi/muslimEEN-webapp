/**
 * Profile Repository
 * Data access for user profile data
 * Owns: user profile fields (bio, location, skills, endorsements)
 */

import pool from '../../database/pool';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  bio?: string;
  location?: string;
  industry?: string;
  skills: string[];
  endorsements: number;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Find profile by user ID
 */
export const findById = async (userId: string): Promise<UserProfile | null> => {
  const result = await pool.query(
    `SELECT u.id, u.email, u.first_name, u.last_name, 
            u.bio, u.location, u.industry, u.skills,
            u.endorsements, u.created_at, u.updated_at
     FROM users u
     WHERE u.id = $1`,
    [userId]
  );
  
  if (result.rows.length === 0) return null;
  return mapToProfile(result.rows[0]);
};

/**
 * Update profile
 */
export const update = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.firstName) {
    fields.push(`first_name = $${paramIndex++}`);
    values.push(updates.firstName);
  }
  if (updates.lastName) {
    fields.push(`last_name = $${paramIndex++}`);
    values.push(updates.lastName);
  }
  if (updates.bio !== undefined) {
    fields.push(`bio = $${paramIndex++}`);
    values.push(updates.bio);
  }
  if (updates.location !== undefined) {
    fields.push(`location = $${paramIndex++}`);
    values.push(updates.location);
  }
  if (updates.industry !== undefined) {
    fields.push(`industry = $${paramIndex++}`);
    values.push(updates.industry);
  }
  if (updates.skills) {
    fields.push(`skills = $${paramIndex++}`);
    values.push(updates.skills);
  }

  if (fields.length === 0) {
    return findById(userId);
  }

  fields.push(`updated_at = NOW()`);
  values.push(userId);

  const result = await pool.query(
    `UPDATE users 
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, email, first_name, last_name, bio, location, industry, 
               skills, endorsements, created_at, updated_at`,
    values
  );

  if (result.rows.length === 0) return null;
  return mapToProfile(result.rows[0]);
};

/**
 * Add endorsement for a skill
 */
export const addEndorsement = async (
  userId: string,
  skill: string,
  endorserId: string
): Promise<void> => {
  // Insert endorsement record (if table exists)
  await pool.query(
    `INSERT INTO endorsements (user_id, skill, endorser_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, skill, endorser_id) DO NOTHING`,
    [userId, skill, endorserId]
  );

  // Update denormalized count
  await pool.query(
    `UPDATE users 
     SET endorsements = endorsements + 1
     WHERE id = $1`,
    [userId]
  );
};

// ============================================================================
// MAPPER
// ============================================================================

const mapToProfile = (row: any): UserProfile => ({
  id: row.id,
  email: row.email,
  firstName: row.first_name,
  lastName: row.last_name,
  fullName: `${row.first_name} ${row.last_name}`,
  bio: row.bio,
  location: row.location,
  industry: row.industry,
  skills: row.skills || [],
  endorsements: row.endorsements || 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
