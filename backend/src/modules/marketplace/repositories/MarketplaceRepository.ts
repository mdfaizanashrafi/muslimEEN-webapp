/**
 * Marketplace Repository
 * 
 * SECURITY FIXES APPLIED:
 * - Added provider_id check to update and remove operations
 * - Added defense-in-depth ownership verification at database level
 */

import pool from '../../database/pool';

export const findByCategory = async (category: string, filters: any): Promise<any[]> => {
  const result = await pool.query(
    `SELECT m.*, u.first_name || ' ' || u.last_name as provider_name
     FROM marketplace_listings m
     JOIN users u ON m.provider_id = u.id
     WHERE m.category = $1 AND m.status = 'active'`,
    [category]
  );
  return result.rows;
};

export const findById = async (id: string): Promise<any | null> => {
  const result = await pool.query(
    `SELECT m.*, u.first_name || ' ' || u.last_name as provider_name
     FROM marketplace_listings m
     JOIN users u ON m.provider_id = u.id
     WHERE m.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

export const create = async (data: any): Promise<any> => {
  const result = await pool.query(
    `INSERT INTO marketplace_listings (category, provider_id, title, description, location, rate)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.category, data.providerId, data.title, data.description, data.location, data.rate]
  );
  return result.rows[0];
};

/**
 * Update listing with ownership verification
 * SECURITY FIX: Added providerId check to prevent unauthorized updates
 */
export const update = async (id: string, providerId: string, updates: any): Promise<any> => {
  const result = await pool.query(
    `UPDATE marketplace_listings 
     SET title = $1, description = $2, location = $3, rate = $4, updated_at = NOW()
     WHERE id = $5 AND provider_id = $6
     RETURNING *`,
    [updates.title, updates.description, updates.location, updates.rate, id, providerId]
  );
  return result.rows[0] || null;
};

/**
 * Remove listing with ownership verification
 * SECURITY FIX: Added providerId check to prevent unauthorized deletion
 */
export const remove = async (id: string, providerId: string): Promise<boolean> => {
  const result = await pool.query(
    'DELETE FROM marketplace_listings WHERE id = $1 AND provider_id = $2',
    [id, providerId]
  );
  return (result.rowCount || 0) > 0;
};

/**
 * Admin remove listing (no ownership check)
 * For admin moderation purposes
 */
export const removeAsAdmin = async (id: string): Promise<boolean> => {
  const result = await pool.query(
    'DELETE FROM marketplace_listings WHERE id = $1',
    [id]
  );
  return (result.rowCount || 0) > 0;
};

export const recordInvestment = async (listingId: string, investorId: string, amount: number): Promise<any> => {
  const result = await pool.query(
    `INSERT INTO investments (listing_id, investor_id, amount)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [listingId, investorId, amount]
  );
  return result.rows[0];
};
