/**
 * Notification Repository
 * Database access for notifications
 */

import pool from '../database/pool';
import { Notification } from './notificationTypes';

/**
 * Create notification
 */
export const create = async (notification: Notification): Promise<void> => {
  await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, data, is_read, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      notification.userId,
      notification.type,
      notification.title,
      notification.message,
      JSON.stringify(notification.data),
      notification.isRead,
      notification.createdAt,
    ]
  );
};

/**
 * Find notifications for user
 */
export const findByUserId = async (
  userId: string,
  options: { unreadOnly?: boolean; limit?: number; offset?: number }
): Promise<any[]> => {
  const { unreadOnly = false, limit = 50, offset = 0 } = options;
  
  const result = await pool.query(
    `SELECT 
       id,
       type,
       title,
       message,
       data,
       is_read,
       created_at
     FROM notifications 
     WHERE user_id = $1 
       ${unreadOnly ? 'AND is_read = false' : ''}
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  
  return result.rows.map(row => ({
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));
};

/**
 * Count unread notifications
 */
export const countUnread = async (userId: string): Promise<number> => {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
    [userId]
  );
  
  return parseInt(result.rows[0].count);
};

/**
 * Mark notification as read
 */
export const markAsRead = async (id: string, userId: string): Promise<void> => {
  await pool.query(
    'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (userId: string): Promise<void> => {
  await pool.query(
    'UPDATE notifications SET is_read = true WHERE user_id = $1',
    [userId]
  );
};
