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
