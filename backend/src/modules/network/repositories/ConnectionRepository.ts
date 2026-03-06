/**
 * Connection Repository
 * Data access for connections
 */

import pool from '../../database/pool';

export interface ConnectionInput {
  requesterId: string;
  recipientId: string;
  status: string;
}

/**
 * Create connection
 */
export const create = async (input: ConnectionInput): Promise<any> => {
  const result = await pool.query(
    `INSERT INTO connections (requester_id, recipient_id, status)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [input.requesterId, input.recipientId, input.status]
  );
  return result.rows[0];
};

/**
 * Find connection by ID
 */
export const findById = async (id: string): Promise<any | null> => {
  const result = await pool.query(
    'SELECT * FROM connections WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Find existing connection between users
 */
export const findExisting = async (userId1: string, userId2: string): Promise<any | null> => {
  const result = await pool.query(
    `SELECT * FROM connections 
     WHERE (requester_id = $1 AND recipient_id = $2)
        OR (requester_id = $2 AND recipient_id = $1)`,
    [userId1, userId2]
  );
  return result.rows[0] || null;
};

/**
 * Find connections by user ID
 */
export const findByUserId = async (userId: string): Promise<any[]> => {
  const result = await pool.query(
    `SELECT 
       c.id,
       c.created_at as connected_at,
       CASE 
         WHEN c.requester_id = $1 THEN json_build_object(
           'id', u2.id,
           'fullName', u2.first_name || ' ' || u2.last_name,
           'trustScore', u2.trust_score
         )
         ELSE json_build_object(
           'id', u1.id,
           'fullName', u1.first_name || ' ' || u1.last_name,
           'trustScore', u1.trust_score
         )
       END as other_user
     FROM connections c
     JOIN users u1 ON c.requester_id = u1.id
     JOIN users u2 ON c.recipient_id = u2.id
     WHERE (c.requester_id = $1 OR c.recipient_id = $1)
       AND c.status = 'accepted'`,
    [userId]
  );
  return result.rows;
};

/**
 * Find pending requests for user
 */
export const findPendingForUser = async (userId: string): Promise<any[]> => {
  const result = await pool.query(
    `SELECT 
       c.id,
       c.created_at,
       json_build_object(
         'id', u.id,
         'fullName', u.first_name || ' ' || u.last_name,
         'trustScore', u.trust_score
       ) as requester
     FROM connections c
     JOIN users u ON c.requester_id = u.id
     WHERE c.recipient_id = $1 AND c.status = 'pending'`,
    [userId]
  );
  return result.rows;
};

/**
 * Update connection status
 */
export const updateStatus = async (id: string, status: string): Promise<any> => {
  const result = await pool.query(
    `UPDATE connections 
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );
  return result.rows[0];
};

/**
 * Remove connection
 */
export const remove = async (id: string): Promise<void> => {
  await pool.query('DELETE FROM connections WHERE id = $1', [id]);
};

/**
 * Count mutual connections
 */
export const countMutual = async (userId1: string, userId2: string): Promise<number> => {
  const result = await pool.query(
    `SELECT COUNT(*) as count
     FROM connections c1
     JOIN connections c2 ON (
       (c1.recipient_id = c2.recipient_id AND c1.recipient_id != $1 AND c1.recipient_id != $2)
       OR (c1.recipient_id = c2.requester_id AND c1.recipient_id != $1 AND c1.recipient_id != $2)
       OR (c1.requester_id = c2.recipient_id AND c1.requester_id != $1 AND c1.requester_id != $2)
       OR (c1.requester_id = c2.requester_id AND c1.requester_id != $1 AND c1.requester_id != $2)
     )
     WHERE (c1.requester_id = $1 OR c1.recipient_id = $1)
       AND c1.status = 'accepted'
       AND (c2.requester_id = $2 OR c2.recipient_id = $2)
       AND c2.status = 'accepted'`,
    [userId1, userId2]
  );
  return parseInt(result.rows[0]?.count || 0);
};
