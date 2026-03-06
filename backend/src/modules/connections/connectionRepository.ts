/**
 * Connection Repository
 * Database access for connections
 */

import pool from '../database/pool';
import { Connection, ConnectionInput } from './connectionTypes';

/**
 * Create new connection
 */
export const create = async (input: ConnectionInput): Promise<Connection> => {
  const result = await pool.query(
    `INSERT INTO connections (requester_id, recipient_id, status, created_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING id, requester_id, recipient_id, status, created_at, updated_at`,
    [input.requesterId, input.recipientId, input.status]
  );
  
  return mapRowToConnection(result.rows[0]);
};

/**
 * Find connection by ID
 */
export const findById = async (id: string): Promise<Connection | null> => {
  const result = await pool.query(
    `SELECT id, requester_id, recipient_id, status, created_at, updated_at
     FROM connections 
     WHERE id = $1`,
    [id]
  );
  
  return result.rows[0] ? mapRowToConnection(result.rows[0]) : null;
};

/**
 * Find connection between two users
 */
export const findBetweenUsers = async (userId1: string, userId2: string): Promise<Connection | null> => {
  const result = await pool.query(
    `SELECT id, requester_id, recipient_id, status, created_at, updated_at
     FROM connections 
     WHERE (requester_id = $1 AND recipient_id = $2)
        OR (requester_id = $2 AND recipient_id = $1)`,
    [userId1, userId2]
  );
  
  return result.rows[0] ? mapRowToConnection(result.rows[0]) : null;
};

/**
 * Find active connections for user
 */
export const findActiveByUserId = async (userId: string): Promise<any[]> => {
  const result = await pool.query(
    `SELECT 
       c.id,
       c.created_at,
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
       END as connected_user
     FROM connections c
     JOIN users u1 ON c.requester_id = u1.id
     JOIN users u2 ON c.recipient_id = u2.id
     WHERE (c.requester_id = $1 OR c.recipient_id = $1)
       AND c.status = 'accepted'
     ORDER BY c.created_at DESC`,
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
     WHERE c.recipient_id = $1 AND c.status = 'pending'
     ORDER BY c.created_at DESC`,
    [userId]
  );
  
  return result.rows;
};

/**
 * Update connection status
 */
export const updateStatus = async (id: string, status: string): Promise<Connection> => {
  const result = await pool.query(
    `UPDATE connections 
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, requester_id, recipient_id, status, created_at, updated_at`,
    [status, id]
  );
  
  return mapRowToConnection(result.rows[0]);
};

/**
 * Delete connection
 */
export const deleteById = async (id: string): Promise<void> => {
  await pool.query('DELETE FROM connections WHERE id = $1', [id]);
};

/**
 * Check if user exists
 */
export const userExists = async (userId: string): Promise<boolean> => {
  const result = await pool.query(
    'SELECT 1 FROM users WHERE id = $1',
    [userId]
  );
  return result.rows.length > 0;
};

/**
 * Count mutual connections between two users
 */
export const countMutualConnections = async (userId1: string, userId2: string): Promise<number> => {
  const result = await pool.query(
    `SELECT COUNT(DISTINCT mutual_id) as count
     FROM (
       SELECT 
         CASE WHEN c1.requester_id = $1 THEN c1.recipient_id ELSE c1.requester_id END as mutual_id
       FROM connections c1
       WHERE (c1.requester_id = $1 OR c1.recipient_id = $1)
         AND c1.status = 'accepted'
       INTERSECT
       SELECT 
         CASE WHEN c2.requester_id = $2 THEN c2.recipient_id ELSE c2.requester_id END as mutual_id
       FROM connections c2
       WHERE (c2.requester_id = $2 OR c2.recipient_id = $2)
         AND c2.status = 'accepted'
     ) mutuals`,
    [userId1, userId2]
  );
  
  return parseInt(result.rows[0]?.count || 0);
};

// ============================================================================
// MAPPER
// ============================================================================

const mapRowToConnection = (row: any): Connection => ({
  id: row.id,
  requesterId: row.requester_id,
  recipientId: row.recipient_id,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
