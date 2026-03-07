/**
 * Invitation Model
 * Following BACKEND_README.md Invitation interface
 */

const db = require('../config/database');
const crypto = require('crypto');

class Invitation {
  /**
   * Generate a 12-character alphanumeric invitation code
   */
  static generateCode() {
    return crypto.randomBytes(9).toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 12)
      .toUpperCase();
  }

  /**
   * Create a new invitation
   */
  static async create(inviterId, inviteeEmail) {
    const code = this.generateCode();
    
    const query = `
      INSERT INTO invitations (code, inviter_id, invitee_email, status, expires_at)
      VALUES ($1, $2, $3, 'pending', NOW() + INTERVAL '30 days')
      RETURNING *
    `;

    const result = await db.query(query, [
      code,
      inviterId,
      inviteeEmail.toLowerCase().trim()
    ]);

    return this.formatInvitation(result.rows[0]);
  }

  /**
   * Find invitation by code
   */
  static async findByCode(code) {
    const query = `
      SELECT i.*, u.email as inviter_email, u.first_name as inviter_first_name, u.last_name as inviter_last_name
      FROM invitations i
      LEFT JOIN users u ON i.inviter_id = u.id
      WHERE i.code = $1
    `;
    const result = await db.query(query, [code.toUpperCase()]);
    
    if (result.rows.length === 0) return null;
    return this.formatInvitation(result.rows[0]);
  }

  /**
   * Validate invitation code
   */
  static async validate(code) {
    const invitation = await this.findByCode(code);
    
    if (!invitation) {
      return { valid: false, message: 'Invalid invitation code' };
    }

    if (invitation.status !== 'pending') {
      return { valid: false, message: `Invitation is ${invitation.status}` };
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      await this.updateStatus(invitation.id, 'expired');
      return { valid: false, message: 'Invitation has expired' };
    }

    return { valid: true, invitation };
  }

  /**
   * Mark invitation as accepted
   */
  static async accept(code, inviteeId) {
    const query = `
      UPDATE invitations
      SET status = 'accepted', accepted_at = NOW(), invitee_id = $2
      WHERE code = $1
      RETURNING *
    `;

    const result = await db.query(query, [code.toUpperCase(), inviteeId]);
    
    if (result.rows.length === 0) return null;

    // Record successful outcome for trust score
    const invitation = result.rows[0];
    await this.recordOutcome(invitation.id, invitation.inviter_id, 'success', 10);

    return this.formatInvitation(result.rows[0]);
  }

  /**
   * Update invitation status
   */
  static async updateStatus(id, status) {
    const query = `
      UPDATE invitations
      SET status = $2
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [id, status]);
    return this.formatInvitation(result.rows[0]);
  }

  /**
   * Record invitation outcome for trust score
   */
  static async recordOutcome(invitationId, inviterId, outcome, trustImpact) {
    const query = `
      INSERT INTO invitation_outcomes (invitation_id, inviter_id, outcome, trust_impact)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
    `;

    await db.query(query, [invitationId, inviterId, outcome, trustImpact]);

    // Recalculate inviter's trust score
    const TrustScore = require('./trustScore');
    await TrustScore.recalculate(inviterId);
  }

  /**
   * Get invitations by inviter
   */
  static async getByInviter(inviterId, status = null) {
    let query = `
      SELECT i.*, u.email as invitee_email_used
      FROM invitations i
      LEFT JOIN users u ON i.invitee_id = u.id
      WHERE i.inviter_id = $1
    `;
    const params = [inviterId];

    if (status) {
      query += ' AND i.status = $2';
      params.push(status);
    }

    query += ' ORDER BY i.created_at DESC';

    const result = await db.query(query, params);
    return result.rows.map(row => this.formatInvitation(row));
  }

  /**
   * Count pending invitations for user
   */
  static async countPendingByInviter(inviterId) {
    const query = `
      SELECT COUNT(*) as count
      FROM invitations
      WHERE inviter_id = $1 AND status = 'pending'
    `;
    const result = await db.query(query, [inviterId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Revoke invitation
   */
  static async revoke(id, inviterId) {
    const query = `
      UPDATE invitations
      SET status = 'revoked'
      WHERE id = $1 AND inviter_id = $2 AND status = 'pending'
      RETURNING *
    `;

    const result = await db.query(query, [id, inviterId]);
    return this.formatInvitation(result.rows[0]);
  }

  /**
   * Clean up expired invitations
   */
  static async cleanupExpired() {
    const query = `
      UPDATE invitations
      SET status = 'expired'
      WHERE status = 'pending' AND expires_at < NOW()
      RETURNING id, inviter_id
    `;

    const result = await db.query(query);
    
    // Record expired outcomes
    for (const row of result.rows) {
      await this.recordOutcome(row.id, row.inviter_id, 'expired', 0);
    }

    return result.rows.length;
  }

  /**
   * Format database row to API response format
   */
  static formatInvitation(row) {
    if (!row) return null;

    return {
      id: row.id,
      code: row.code,
      inviterId: row.inviter_id,
      inviter: row.inviter_email ? {
        email: row.inviter_email,
        name: `${row.inviter_first_name} ${row.inviter_last_name}`.trim()
      } : null,
      inviteeEmail: row.invitee_email,
      inviteeId: row.invitee_id,
      status: row.status,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      acceptedAt: row.accepted_at
    };
  }
}

module.exports = Invitation;
