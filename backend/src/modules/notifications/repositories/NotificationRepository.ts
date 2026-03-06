/**
 * Notification Repository
 */

import pool from '../../database/pool';

export const create = async (input: any): Promise<void> => {
  await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, data)
     VALUES ($1, $2, $3, $4, $5)`,
    [input.userId, input.type, input.title, input.message, JSON.stringify(input.data || {})]
  );
};

export const findByUser = async (userId: string, options: any): Promise<any> => {
  const { unreadOnly = false, limit = 50, offset = 0 } = options;
  
  const result = await pool.query(
    `SELECT * FROM notifications 
     WHERE user_id = $1 
     ${unreadOnly ? 'AND is_read = false' : ''}
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  const unreadResult = await pool.query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
    [userId]
  );

  return {
    success: true,
    notifications: result.rows,
    unreadCount: parseInt(unreadResult.rows[0].count),
  };
};

export const markAsRead = async (id: string, userId: string): Promise<void> => {
  await pool.query(
    'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
};

export const markAllAsRead = async (userId: string): Promise<void> => {
  await pool.query(
    'UPDATE notifications SET is_read = true WHERE user_id = $1',
    [userId]
  );
};
