/**
 * User Model
 * Following BACKEND_README.md User interface specification
 */

const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  /**
   * Create a new user
   */
  static async create(userData) {
    const {
      email,
      password,
      firstName,
      lastName,
      role = 'muslim_unverified',
      verificationTier = 'basic'
    } = userData;

    const passwordHash = await bcrypt.hash(password, 12);

    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, role, verification_tier)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await db.query(query, [
      email.toLowerCase().trim(),
      passwordHash,
      firstName,
      lastName,
      role,
      verificationTier
    ]);

    return this.formatUser(result.rows[0]);
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email.toLowerCase().trim()]);
    
    if (result.rows.length === 0) return null;
    return this.formatUser(result.rows[0]);
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) return null;
    return this.formatUser(result.rows[0]);
  }

  /**
   * Update user
   */
  static async update(id, updates) {
    const allowedFields = [
      'first_name', 'last_name', 'bio', 'location', 'industry',
      'skills', 'role', 'verification_tier', 'trust_score',
      'is_witness_eligible', 'badges', 'last_login'
    ];

    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      const dbField = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(dbField)) {
        fields.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE users 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return this.formatUser(result.rows[0]);
  }

  /**
   * Verify password
   */
  static async verifyPassword(user, password) {
    return bcrypt.compare(password, user.passwordHash);
  }

  /**
   * Get user with full profile including work history and education
   */
  static async getFullProfile(id) {
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const workQuery = 'SELECT * FROM work_history WHERE user_id = $1 ORDER BY start_date DESC';
    const educationQuery = 'SELECT * FROM education WHERE user_id = $1 ORDER BY start_date DESC';

    const [userResult, workResult, educationResult] = await Promise.all([
      db.query(userQuery, [id]),
      db.query(workQuery, [id]),
      db.query(educationQuery, [id])
    ]);

    if (userResult.rows.length === 0) return null;

    const user = this.formatUser(userResult.rows[0]);
    user.workHistory = workResult.rows.map(row => ({
      id: row.id,
      company: row.company,
      title: row.title,
      startDate: row.start_date,
      endDate: row.end_date,
      current: row.current,
      description: row.description
    }));

    user.education = educationResult.rows.map(row => ({
      id: row.id,
      institution: row.institution,
      degree: row.degree,
      startDate: row.start_date,
      endDate: row.end_date
    }));

    return user;
  }

  /**
   * Update trust score
   */
  static async updateTrustScore(id, newScore, factors = {}) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Update user trust score
      const updateQuery = `
        UPDATE users 
        SET trust_score = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      const userResult = await client.query(updateQuery, [newScore, id]);

      // Record in history
      const historyQuery = `
        INSERT INTO trust_score_history (user_id, score, factors)
        VALUES ($1, $2, $3)
      `;
      await client.query(historyQuery, [id, newScore, JSON.stringify(factors)]);

      await client.query('COMMIT');
      
      return this.formatUser(userResult.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get trust score history
   */
  static async getTrustScoreHistory(id) {
    const query = `
      SELECT * FROM trust_score_history 
      WHERE user_id = $1 
      ORDER BY recorded_at DESC
      LIMIT 50
    `;
    const result = await db.query(query, [id]);
    
    return result.rows.map(row => ({
      date: row.recorded_at,
      score: row.score,
      factors: row.factors
    }));
  }

  /**
   * Format database row to API response format
   */
  static formatUser(row) {
    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      fullName: `${row.first_name} ${row.last_name}`,
      role: row.role,
      verificationTier: row.verification_tier,
      trustScore: row.trust_score,
      bio: row.bio,
      location: row.location,
      industry: row.industry,
      skills: row.skills || [],
      endorsements: row.endorsements,
      connections: row.connections,
      profileViews: row.profile_views,
      isWitnessEligible: row.is_witness_eligible,
      badges: row.badges || [],
      createdAt: row.created_at,
      lastLogin: row.last_login,
      // Internal use only
      passwordHash: row.password_hash
    };
  }
}

module.exports = User;
