/**
 * Sadaqah (Charity) Campaigns Model
 * Following BACKEND_README.md Sadaqah interface
 */

const db = require('../config/database');

class Sadaqah {
  static async create(data) {
    const {
      name,
      organization,
      description,
      goal,
      startDate,
      endDate,
      category,
      imageUrl,
      verified = false
    } = data;

    const query = `
      INSERT INTO sadaqah_campaigns 
        (name, organization, description, goal, start_date, end_date, category, image_url, verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await db.query(query, [
      name, organization, description, goal, startDate, endDate, category, imageUrl, verified
    ]);

    return this.formatCampaign(result.rows[0]);
  }

  static async getAll() {
    const query = `
      SELECT *, 
        EXTRACT(DAY FROM (end_date - NOW())) as days_left
      FROM sadaqah_campaigns
      WHERE end_date > NOW() OR end_date IS NULL
      ORDER BY created_at DESC
    `;
    const result = await db.query(query);
    return result.rows.map(row => this.formatCampaign(row));
  }

  static async getById(id) {
    const query = `
      SELECT *, 
        EXTRACT(DAY FROM (end_date - NOW())) as days_left
      FROM sadaqah_campaigns
      WHERE id = $1
    `;
    const result = await db.query(query, [id]);
    if (result.rows.length === 0) return null;
    return this.formatCampaign(result.rows[0]);
  }

  static async recordDonation(campaignId, donorId, amount, anonymous = false, message = null) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Insert donation
      const donationQuery = `
        INSERT INTO donations (campaign_id, donor_id, amount, anonymous, message)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const donationResult = await client.query(donationQuery, [
        campaignId, donorId, amount, anonymous, message
      ]);

      // Update campaign totals
      const updateQuery = `
        UPDATE sadaqah_campaigns
        SET raised = raised + $2, donors = donors + 1
        WHERE id = $1
        RETURNING *
      `;
      await client.query(updateQuery, [campaignId, amount]);

      await client.query('COMMIT');
      return donationResult.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static formatCampaign(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      organization: row.organization,
      description: row.description,
      goal: row.goal,
      raised: row.raised,
      donors: row.donors,
      daysLeft: Math.max(0, Math.floor(row.days_left || 0)),
      category: row.category,
      verified: row.verified
    };
  }
}

module.exports = { Sadaqah };
