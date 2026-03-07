/**
 * Islamic Finance Repository
 */

import pool from '../../database/pool';

// Sadaqah
export const getAllCampaigns = async () => {
  const result = await pool.query('SELECT * FROM sadaqah_campaigns WHERE status = active');
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
  const result = await pool.query('SELECT * FROM waqf WHERE status = active');
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

export const updateLoan = async (id: string, data: any) => {
  const fields = Object.keys(data);
  const values = Object.values(data);
  
  if (fields.length === 0) return null;
  
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
  
  const result = await pool.query(
    `UPDATE qard_hasan_loans SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0] || null;
};
