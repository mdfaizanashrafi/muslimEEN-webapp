/**
 * Qard Hasan (Benevolent Loan) Model
 * Following BACKEND_README.md QardHasan interface
 */

const db = require('../config/database');

class QardHasan {
  static async create(data) {
    const { borrowerId, amount, purpose, term } = data;

    const query = `
      INSERT INTO qard_hasan_loans (borrower_id, amount, purpose, term, status)
      VALUES ($1, $2, $3, $4, 'funding')
      RETURNING *
    `;

    const result = await db.query(query, [borrowerId, amount, purpose, term]);
    return this.formatLoan(result.rows[0]);
  }

  static async getAll() {
    const query = `
      SELECT 
        qh.*,
        u.first_name as borrower_first_name,
        u.last_name as borrower_last_name,
        u.trust_score as borrower_trust_score,
        u.verification_tier as borrower_verification_tier,
        COUNT(DISTINCT qhl.lender_id) as lender_count
      FROM qard_hasan_loans qh
      JOIN users u ON qh.borrower_id = u.id
      LEFT JOIN qard_hasan_lenders qhl ON qh.id = qhl.loan_id
      WHERE qh.status IN ('funding', 'active')
      GROUP BY qh.id, u.first_name, u.last_name, u.trust_score, u.verification_tier
      ORDER BY qh.created_at DESC
    `;
    const result = await db.query(query);
    return result.rows.map(row => this.formatLoan(row));
  }

  static async addLender(loanId, lenderId, amount) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Add lender
      const lenderQuery = `
        INSERT INTO qard_hasan_lenders (loan_id, lender_id, amount)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      await client.query(lenderQuery, [loanId, lenderId, amount]);

      // Update loan status if fully funded
      const loanQuery = `
        SELECT amount, (
          SELECT COALESCE(SUM(amount), 0) FROM qard_hasan_lenders WHERE loan_id = $1
        ) as funded
        FROM qard_hasan_loans WHERE id = $1
      `;
      const loanResult = await client.query(loanQuery, [loanId]);
      const { amount, funded } = loanResult.rows[0];

      if (parseFloat(funded) >= parseFloat(amount)) {
        await client.query(
          "UPDATE qard_hasan_loans SET status = 'active' WHERE id = $1",
          [loanId]
        );
      }

      await client.query('COMMIT');
      return this.getById(loanId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async recordRepayment(loanId, amount) {
    const query = `
      UPDATE qard_hasan_loans
      SET repaid = repaid + $2,
          status = CASE 
            WHEN repaid + $2 >= amount THEN 'repaid'
            ELSE status
          END
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [loanId, amount]);
    return this.formatLoan(result.rows[0]);
  }

  static async getById(id) {
    const query = `
      SELECT 
        qh.*,
        u.first_name as borrower_first_name,
        u.last_name as borrower_last_name,
        u.trust_score as borrower_trust_score,
        u.verification_tier as borrower_verification_tier,
        COUNT(DISTINCT qhl.lender_id) as lender_count
      FROM qard_hasan_loans qh
      JOIN users u ON qh.borrower_id = u.id
      LEFT JOIN qard_hasan_lenders qhl ON qh.id = qhl.loan_id
      WHERE qh.id = $1
      GROUP BY qh.id, u.first_name, u.last_name, u.trust_score, u.verification_tier
    `;
    const result = await db.query(query, [id]);
    if (result.rows.length === 0) return null;
    return this.formatLoan(result.rows[0]);
  }

  static formatLoan(row) {
    if (!row) return null;

    return {
      id: row.id,
      borrower: {
        id: row.borrower_id,
        name: `${row.borrower_first_name} ${row.borrower_last_name}`,
        trustScore: row.borrower_trust_score,
        verified: row.borrower_verification_tier !== 'basic'
      },
      amount: row.amount,
      purpose: row.purpose,
      term: row.term,
      repaid: row.repaid,
      lenders: parseInt(row.lender_count) || 0,
      status: row.status
    };
  }
}

module.exports = { QardHasan };
