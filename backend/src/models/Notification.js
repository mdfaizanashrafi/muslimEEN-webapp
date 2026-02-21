/**
 * Notification Model
 * Following BACKEND_README.md Notification interface
 */

const db = require('../config/database');

class Notification {
  static TYPES = {
    CONNECTION_REQUEST: 'connection_request',
    CONNECTION_ACCEPTED: 'connection_accepted',
    ENDORSEMENT_RECEIVED: 'endorsement_received',
    TRUST_SCORE_CHANGED: 'trust_score_changed',
    VERIFICATION_COMPLETED: 'verification_completed',
    MESSAGE_RECEIVED: 'message_received',
    MARKETPLACE_INTEREST: 'marketplace_interest',
    DISPUTE_RESOLUTION: 'dispute_resolution'
  };

  /**
   * Create notification
   */
  static async create(data) {
    const {
      userId,
      type,
      title,
      message,
      actorId,
      actorName,
      actorTrustScore,
      actionUrl,
      data: extraData
    } = data;

    const query = `
      INSERT INTO notifications 
        (user_id, type, title, message, actor_id, actor_name, actor_trust_score, action_url, data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await db.query(query, [
      userId,
      type,
      title,
      message,
      actorId,
      actorName,
      actorTrustScore,
      actionUrl,
      extraData ? JSON.stringify(extraData) : null
    ]);

    return this.formatNotification(result.rows[0]);
  }

  /**
   * Get notifications for user
   */
  static async getByUser(userId, options = {}) {
    const { unreadOnly = false, limit = 50, offset = 0 } = options;

    let query = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;
    const params = [userId];

    if (unreadOnly) {
      query += ' AND read = false';
    }

    query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows.map(row => this.formatNotification(row));
  }

  /**
   * Get unread count for user
   */
  static async getUnreadCount(userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND read = false
    `;
    const result = await db.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId, userId) {
    const query = `
      UPDATE notifications
      SET read = true
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await db.query(query, [notificationId, userId]);
    return this.formatNotification(result.rows[0]);
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId) {
    const query = `
      UPDATE notifications
      SET read = true
      WHERE user_id = $1 AND read = false
    `;

    await db.query(query, [userId]);
    return { success: true };
  }

  /**
   * Delete notification
   */
  static async delete(notificationId, userId) {
    const query = `
      DELETE FROM notifications
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const result = await db.query(query, [notificationId, userId]);
    return result.rows[0]?.id;
  }

  /**
   * Create connection request notification
   */
  static async createConnectionRequest(recipientId, requester) {
    return this.create({
      userId: recipientId,
      type: this.TYPES.CONNECTION_REQUEST,
      title: 'New Connection Request',
      message: `${requester.fullName} wants to connect with you`,
      actorId: requester.id,
      actorName: requester.fullName,
      actorTrustScore: requester.trustScore,
      actionUrl: '/connections'
    });
  }

  /**
   * Create endorsement notification
   */
  static async createEndorsement(recipientId, endorser, skill) {
    return this.create({
      userId: recipientId,
      type: this.TYPES.ENDORSEMENT_RECEIVED,
      title: 'New Endorsement',
      message: `${endorser.fullName} endorsed you for ${skill}`,
      actorId: endorser.id,
      actorName: endorser.fullName,
      actorTrustScore: endorser.trustScore,
      actionUrl: '/profile',
      data: { skill }
    });
  }

  /**
   * Create trust score change notification
   */
  static async createTrustScoreChange(userId, oldScore, newScore) {
    const change = newScore - oldScore;
    const direction = change > 0 ? 'increased' : 'decreased';
    
    return this.create({
      userId,
      type: this.TYPES.TRUST_SCORE_CHANGED,
      title: `Trust Score ${direction.charAt(0).toUpperCase() + direction.slice(1)}`,
      message: `Your trust score ${direction} by ${Math.abs(change)} points`,
      actionUrl: '/verification'
    });
  }

  /**
   * Create verification completed notification
   */
  static async createVerificationCompleted(userId, tier) {
    const tierLabels = {
      basic: 'Basic',
      full: 'Full',
      business: 'Business'
    };

    return this.create({
      userId,
      type: this.TYPES.VERIFICATION_COMPLETED,
      title: 'Verification Completed',
      message: `You have completed ${tierLabels[tier]} verification`,
      actionUrl: '/verification'
    });
  }

  /**
   * Format database row to API response format
   */
  static formatNotification(row) {
    if (!row) return null;

    return {
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      read: row.read,
      createdAt: row.created_at,
      actor: row.actor_id ? {
        id: row.actor_id,
        name: row.actor_name,
        trustScore: row.actor_trust_score
      } : null,
      actionUrl: row.action_url,
      data: row.data
    };
  }
}

module.exports = Notification;
