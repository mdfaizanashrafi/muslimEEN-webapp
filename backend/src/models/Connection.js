/**
 * Connection Model
 * Manages user connections/network
 */

const db = require('../config/database');

class Connection {
  /**
   * Send connection request
   */
  static async create(requesterId, recipientId) {
    // Check if connection already exists
    const existingQuery = `
      SELECT * FROM connections
      WHERE (requester_id = $1 AND recipient_id = $2)
         OR (requester_id = $2 AND recipient_id = $1)
    `;
    const existing = await db.query(existingQuery, [requesterId, recipientId]);
    
    if (existing.rows.length > 0) {
      throw new Error('Connection already exists');
    }

    const query = `
      INSERT INTO connections (requester_id, recipient_id, status)
      VALUES ($1, $2, 'pending')
      RETURNING *
    `;

    const result = await db.query(query, [requesterId, recipientId]);
    return this.formatConnection(result.rows[0]);
  }

  /**
   * Accept connection request
   */
  static async accept(connectionId, recipientId) {
    const query = `
      UPDATE connections
      SET status = 'accepted', accepted_at = NOW()
      WHERE id = $1 AND recipient_id = $2 AND status = 'pending'
      RETURNING *
    `;

    const result = await db.query(query, [connectionId, recipientId]);
    
    if (result.rows.length === 0) {
      throw new Error('Connection request not found');
    }

    // Update connection counts for both users
    await this.updateConnectionCounts(result.rows[0].requester_id);
    await this.updateConnectionCounts(result.rows[0].recipient_id);

    return this.formatConnection(result.rows[0]);
  }

  /**
   * Reject connection request
   */
  static async reject(connectionId, recipientId) {
    const query = `
      UPDATE connections
      SET status = 'rejected'
      WHERE id = $1 AND recipient_id = $2 AND status = 'pending'
      RETURNING *
    `;

    const result = await db.query(query, [connectionId, recipientId]);
    return this.formatConnection(result.rows[0]);
  }

  /**
   * Get user's connections
   */
  static async getByUser(userId) {
    const query = `
      SELECT 
        c.*,
        CASE 
          WHEN c.requester_id = $1 THEN u2.id
          ELSE u1.id
        END as connection_id,
        CASE 
          WHEN c.requester_id = $1 THEN u2.first_name
          ELSE u1.first_name
        END as connection_first_name,
        CASE 
          WHEN c.requester_id = $1 THEN u2.last_name
          ELSE u1.last_name
        END as connection_last_name,
        CASE 
          WHEN c.requester_id = $1 THEN u2.trust_score
          ELSE u1.trust_score
        END as connection_trust_score,
        CASE 
          WHEN c.requester_id = $1 THEN u2.verification_tier
          ELSE u1.verification_tier
        END as connection_verification_tier
      FROM connections c
      JOIN users u1 ON c.requester_id = u1.id
      JOIN users u2 ON c.recipient_id = u2.id
      WHERE (c.requester_id = $1 OR c.recipient_id = $1)
        AND c.status = 'accepted'
      ORDER BY c.accepted_at DESC
    `;

    const result = await db.query(query, [userId]);
    
    return result.rows.map(row => ({
      id: row.connection_id,
      name: `${row.connection_first_name} ${row.connection_last_name}`,
      trustScore: row.connection_trust_score,
      verified: row.connection_verification_tier !== 'basic',
      connectionId: row.id,
      connectedAt: row.accepted_at
    }));
  }

  /**
   * Get pending connection requests for user
   */
  static async getPendingRequests(userId) {
    const query = `
      SELECT 
        c.*,
        u.first_name as requester_first_name,
        u.last_name as requester_last_name,
        u.trust_score as requester_trust_score,
        u.verification_tier as requester_verification_tier
      FROM connections c
      JOIN users u ON c.requester_id = u.id
      WHERE c.recipient_id = $1 AND c.status = 'pending'
      ORDER BY c.created_at DESC
    `;

    const result = await db.query(query, [userId]);
    
    return result.rows.map(row => ({
      connectionId: row.id,
      requester: {
        id: row.requester_id,
        name: `${row.requester_first_name} ${row.requester_last_name}`,
        trustScore: row.requester_trust_score,
        verified: row.requester_verification_tier !== 'basic'
      },
      requestedAt: row.created_at
    }));
  }

  /**
   * Update connection count for user
   */
  static async updateConnectionCounts(userId) {
    const query = `
      UPDATE users
      SET connections = (
        SELECT COUNT(*)
        FROM connections
        WHERE (requester_id = $1 OR recipient_id = $1) AND status = 'accepted'
      )
      WHERE id = $1
    `;

    await db.query(query, [userId]);
  }

  /**
   * Get mutual connections count
   */
  static async getMutualCount(userId1, userId2) {
    const query = `
      SELECT COUNT(*) as mutual
      FROM connections c1
      JOIN connections c2 ON (
        (c1.recipient_id = c2.recipient_id OR c1.recipient_id = c2.requester_id OR
         c1.requester_id = c2.recipient_id OR c1.requester_id = c2.requester_id)
        AND c1.id != c2.id
      )
      WHERE (c1.requester_id = $1 OR c1.recipient_id = $1)
        AND (c2.requester_id = $2 OR c2.recipient_id = $2)
        AND c1.status = 'accepted'
        AND c2.status = 'accepted'
    `;

    const result = await db.query(query, [userId1, userId2]);
    return parseInt(result.rows[0].mutual) || 0;
  }

  /**
   * Format database row
   */
  static formatConnection(row) {
    if (!row) return null;

    return {
      id: row.id,
      requesterId: row.requester_id,
      recipientId: row.recipient_id,
      status: row.status,
      createdAt: row.created_at,
      acceptedAt: row.accepted_at
    };
  }
}

module.exports = Connection;
