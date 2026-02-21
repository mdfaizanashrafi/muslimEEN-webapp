/**
 * Marketplace Model
 * Following BACKEND_README.md MarketplaceItem interface
 */

const db = require('../config/database');

class Marketplace {
  /**
   * Create marketplace item
   */
  static async create(vertical, itemData) {
    const {
      category,
      subcategory,
      providerId,
      title,
      description,
      location,
      rate,
      salary,
      seeking,
      price,
      coverage,
      units
    } = itemData;

    const query = `
      INSERT INTO marketplace_items 
        (vertical, category, subcategory, provider_id, title, description, location, rate, salary, seeking, price, coverage, units)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const result = await db.query(query, [
      vertical,
      category,
      subcategory,
      providerId,
      title,
      description,
      location,
      rate,
      salary,
      seeking,
      price,
      coverage,
      units
    ]);

    return this.formatItem(result.rows[0]);
  }

  /**
   * Get items by vertical with filtering
   */
  static async getByVertical(vertical, filters = {}) {
    const {
      category,
      location,
      trustScoreMin,
      search,
      limit = 20,
      offset = 0
    } = filters;

    let query = `
      SELECT 
        mi.*,
        u.id as provider_user_id,
        u.first_name as provider_first_name,
        u.last_name as provider_last_name,
        u.trust_score as provider_trust_score,
        u.verification_tier as provider_verification_tier,
        u.badges as provider_badges
      FROM marketplace_items mi
      JOIN users u ON mi.provider_id = u.id
      WHERE mi.vertical = $1
    `;
    const params = [vertical];
    let paramIndex = 2;

    if (category) {
      query += ` AND mi.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (location) {
      query += ` AND mi.location ILIKE $${paramIndex}`;
      params.push(`%${location}%`);
      paramIndex++;
    }

    if (trustScoreMin) {
      query += ` AND u.trust_score >= $${paramIndex}`;
      params.push(trustScoreMin);
      paramIndex++;
    }

    if (search) {
      query += ` AND (mi.title ILIKE $${paramIndex} OR mi.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY u.trust_score DESC, mi.created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows.map(row => this.formatItem(row));
  }

  /**
   * Get item by ID
   */
  static async getById(id) {
    const query = `
      SELECT 
        mi.*,
        u.id as provider_user_id,
        u.first_name as provider_first_name,
        u.last_name as provider_last_name,
        u.trust_score as provider_trust_score,
        u.verification_tier as provider_verification_tier,
        u.badges as provider_badges
      FROM marketplace_items mi
      JOIN users u ON mi.provider_id = u.id
      WHERE mi.id = $1
    `;

    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) return null;
    return this.formatItem(result.rows[0]);
  }

  /**
   * Update item
   */
  static async update(id, updates) {
    const allowedFields = [
      'category', 'subcategory', 'title', 'description', 'location',
      'rate', 'salary', 'seeking', 'raised', 'price', 'coverage', 'units'
    ];

    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE marketplace_items 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return this.formatItem(result.rows[0]);
  }

  /**
   * Delete item
   */
  static async delete(id) {
    const query = 'DELETE FROM marketplace_items WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0]?.id;
  }

  /**
   * Increment raised amount (for BUILD vertical)
   */
  static async incrementRaised(id, amount) {
    const query = `
      UPDATE marketplace_items
      SET raised = raised + $2
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [id, amount]);
    return this.formatItem(result.rows[0]);
  }

  /**
   * Format database row to API response format
   */
  static formatItem(row) {
    if (!row) return null;

    const provider = {
      id: row.provider_user_id || row.provider_id,
      name: `${row.provider_first_name || ''} ${row.provider_last_name || ''}`.trim(),
      trustScore: row.provider_trust_score,
      verified: row.provider_verification_tier !== 'basic',
      badges: row.provider_badges || []
    };

    const item = {
      id: row.id,
      vertical: row.vertical,
      category: row.category,
      subcategory: row.subcategory,
      provider,
      title: row.title,
      description: row.description,
      location: row.location,
      endorsements: row.endorsements,
      createdAt: row.created_at
    };

    // Vertical-specific fields
    if (row.rate) item.rate = row.rate;
    if (row.salary) item.salary = row.salary;
    if (row.seeking) item.seeking = row.seeking;
    if (row.raised !== undefined && row.raised !== null) item.raised = row.raised;
    if (row.price) item.price = row.price;
    if (row.coverage) item.coverage = row.coverage;
    if (row.units) item.units = row.units;

    return item;
  }
}

module.exports = Marketplace;
