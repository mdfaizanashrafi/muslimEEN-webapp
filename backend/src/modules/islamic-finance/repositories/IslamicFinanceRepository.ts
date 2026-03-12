/**
 * Islamic Finance Repository
 * 
 * SECURITY FIXES APPLIED:
 * - Fixed SQL injection via dynamic field names (whitelist approach)
 * - Fixed missing quotes in string literals
 * - Added input validation
 */

import pool from '../../database/pool';
import { logger } from '../../shared/utils/logger';

// SECURITY: Whitelist of allowed fields for updates
const ALLOWED_LOAN_FIELDS = ['amount', 'purpose', 'term', 'status', 'repaid'];

// Sadaqah
export const getAllCampaigns = async () => {
  // SECURITY FIX: Added quotes around 'active' string literal
  const result = await pool.query("SELECT * FROM sadaqah_campaigns WHERE status = 'active'");
  return result.rows;
};

export const createDonation = async (data: any) => {
  const result = await pool.query(
    `INSERT INTO donations (campaign_id, donor_id, amount, anonymous, message)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.campaignId, data.donorId, data.amount, data.anonymous || false, data.message]
  );
  return result.rows[0];
};

// Waqf
export const getAllWaqf = async () => {
  // SECURITY FIX: Added quotes around 'active' string literal
  const result = await pool.query("SELECT * FROM waqf WHERE status = 'active'");
  return result.rows;
};

// Qard Hasan
export const getAllLoans = async () => {
  const result = await pool.query(
    `SELECT l.*, u.first_name || ' ' || u.last_name as borrower_name
     FROM qard_hasan_loans l
     JOIN users u ON l.borrower_id = u.id
     WHERE l.status = 'pending'`
  );
  return result.rows;
};

export const createLoan = async (data: any) => {
  const result = await pool.query(
    `INSERT INTO qard_hasan_loans (borrower_id, amount, purpose, term, status)
     VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
    [data.borrowerId, data.amount, data.purpose, data.term]
  );
  return result.rows[0];
};

export const getLoanById = async (id: string) => {
  const result = await pool.query(
    `SELECT l.*, u.first_name || ' ' || u.last_name as borrower_name
     FROM qard_hasan_loans l
     JOIN users u ON l.borrower_id = u.id
     WHERE l.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Update loan with field whitelist validation
 * SECURITY FIX: Prevents SQL injection via field names
 */
export const updateLoan = async (id: string, data: any) => {
  // SECURITY FIX: Filter fields against whitelist
  const fields = Object.keys(data).filter(field => ALLOWED_LOAN_FIELDS.includes(field));
  
  // SECURITY: Log attempted injection of invalid fields
  const invalidFields = Object.keys(data).filter(field => !ALLOWED_LOAN_FIELDS.includes(field));
  if (invalidFields.length > 0) {
    logger.warn('Attempted to update invalid loan fields', { 
      loanId: id, 
      invalidFields,
      ip: 'unknown' // Will be populated by middleware
    });
  }
  
  if (fields.length === 0) {
    logger.warn('No valid fields provided for loan update', { loanId: id });
    return null;
  }
  
  const values = fields.map(field => data[field]);
  
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
  
  const result = await pool.query(
    `UPDATE qard_hasan_loans SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0] || null;
};
