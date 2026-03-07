/**
 * Notification Repository
 * Data access for notifications
 */

import pool from '../../database/pool';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actorId?: string;
  actorName?: string;
  actorTrustScore?: number;
  actionUrl?: string;
  data?: any;
}

/**
 * Get notifications for a user
 */
export const getByUser = async (
  userId: string,
  options: { unreadOnly?: boolean; limit?: number; offset?: number }
): Promise<Notification[]> => {
  const { unreadOnly = false, limit = 50, offset = 0 } = options;

  let query = `
    SELECT * FROM notifications 
    WHERE user_id = $1
  `;
  const params: any[] = [userId];

  if (unreadOnly) {
    query += ' AND read = false';
  }

  query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows.map(mapToNotification);
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  const result = await pool.query(
    'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false',
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
};

/**
 * Get total notification count
 */
export const getTotalCount = async (userId: string): Promise<number> => {
  const result = await pool.query(
    'SELECT COUNT(*) FROM notifications WHERE user_id = $1',
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (notificationId: string, userId: string): Promise<boolean> => {
  const result = await pool.query(
    `UPDATE notifications 
     SET read = true, read_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [notificationId, userId]
  );
  return result.rowCount > 0;
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId: string): Promise<void> => {
  await pool.query(
    `UPDATE notifications 
     SET read = true, read_at = NOW()
     WHERE user_id = $1 AND read = false`,
    [userId]
  );
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string, userId: string): Promise<boolean> => {
  const result = await pool.query(
    'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
    [notificationId, userId]
  );
  return result.rowCount > 0;
};

/**
 * Create a notification
 */
export const create = async (data: Partial<Notification>): Promise<Notification> => {
  const result = await pool.query(
    `INSERT INTO notifications 
     (user_id, type, title, message, actor_id, actor_name, actor_trust_score, action_url, data, read)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)
     RETURNING *`,
    [
      data.userId,
      data.type,
      data.title,
      data.message,
      data.actorId,
      data.actorName,
      data.actorTrustScore,
      data.actionUrl,
      data.data ? JSON.stringify(data.data) : null,
    ]
  );
  return mapToNotification(result.rows[0]);
};

// ============================================================================
// MAPPER
// ============================================================================

const mapToNotification = (row: any): Notification => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  title: row.title,
  message: row.message,
  read: row.read,
  createdAt: row.created_at,
  actorId: row.actor_id,
  actorName: row.actor_name,
  actorTrustScore: row.actor_trust_score,
  actionUrl: row.action_url,
  data: row.data ? JSON.parse(row.data) : undefined,
});
