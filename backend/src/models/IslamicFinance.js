/**
 * Islamic Finance Models
 * Following BACKEND_README.md Sadaqah, Waqf, QardHasan interfaces
 */

const db = require('../config/database');

// Sadaqah (Charity) Campaigns
class Sadaqah {
  static async create(data) {
    const {
      name,
      organization,
      description,
      goal,
      startDate,
      endDate,
      category,
      imageUrl,
      verified = false
    } = data;

    const query = `
      INSERT INTO sadaqah_campaigns 
        (name, organization, description, goal, start_date, end_date, category, image_url, verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await db.query(query, [
      name, organization, description, goal, startDate, endDate, category, imageUrl, verified
    ]);

    return this.formatCampaign(result.rows[0]);
  }

  static async getAll() {
    const query = `
      SELECT *, 
        EXTRACT(DAY FROM (end_date - NOW())) as days_left
      FROM sadaqah_campaigns
      WHERE end_date > NOW() OR end_date IS NULL
      ORDER BY created_at DESC
    `;
    const result = await db.query(query);
    return result.rows.map(row => this.formatCampaign(row));
  }

  static async getById(id) {
    const query = `
      SELECT *, 
        EXTRACT(DAY FROM (end_date - NOW())) as days_left
      FROM sadaqah_campaigns
      WHERE id = $1
    `;
    const result = await db.query(query, [id]);
    if (result.rows.length === 0) return null;
    return this.formatCampaign(result.rows[0]);
  }

  static async recordDonation(campaignId, donorId, amount, anonymous = false, message = null) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Insert donation
      const donationQuery = `
        INSERT INTO donations (campaign_id, donor_id, amount, anonymous, message)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const donationResult = await client.query(donationQuery, [
        campaignId, donorId, amount, anonymous, message
      ]);

      // Update campaign totals
      const updateQuery = `
        UPDATE sadaqah_campaigns
        SET raised = raised + $2, donors = donors + 1
        WHERE id = $1
        RETURNING *
      `;
      await client.query(updateQuery, [campaignId, amount]);

      await client.query('COMMIT');
      return donationResult.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static formatCampaign(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      organization: row.organization,
      description: row.description,
      goal: row.goal,
      raised: row.raised,
      donors: row.donors,
      daysLeft: Math.max(0, Math.floor(row.days_left || 0)),
      category: row.category,
      verified: row.verified
    };
  }
}

// Waqf (Endowment)
class Waqf {
  static async create(data) {
    const { name, location, description, value, annualIncome, beneficiaries } = data;

    const query = `
      INSERT INTO waqf (name, location, description, value, annual_income, beneficiaries)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await db.query(query, [
      name, location, description, value, annualIncome, beneficiaries
    ]);

    return this.formatWaqf(result.rows[0]);
  }

  static async getAll() {
    const query = 'SELECT * FROM waqf ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows.map(row => this.formatWaqf(row));
  }

  static formatWaqf(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      location: row.location,
      description: row.description,
      value: row.value,
      annualIncome: row.annual_income,
      beneficiaries: row.beneficiaries
    };
  }
}

// Qard Hasan (Benevolent Loan)
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

// Zakat Calculator
class ZakatCalculator {
  // Current Nisab values (approximate - should be updated regularly)
  static NISAB_GOLD = 85 * 60; // 85g gold at £60/g = £5100
  static NISAB_SILVER = 595 * 0.8; // 595g silver at £0.80/g = £476
  static ZAKAT_RATE = 0.025; // 2.5%

  static calculate(data) {
    const {
      cash = 0,
      gold = 0,
      silver = 0,
      investments = 0,
      businessAssets = 0,
      debts = 0,
      nisabType = 'gold'
    } = data;

    const totalWealth = cash + gold + silver + investments + businessAssets;
    const zakatableWealth = Math.max(0, totalWealth - debts);
    const nisabThreshold = nisabType === 'gold' ? this.NISAB_GOLD : this.NISAB_SILVER;
    const zakatPayable = zakatableWealth >= nisabThreshold;
    const zakatAmount = zakatPayable ? zakatableWealth * this.ZAKAT_RATE : 0;

    // Distribution according to Quranic categories (8 categories)
    const distribution = {
      poor: zakatAmount * 0.125,
      needy: zakatAmount * 0.125,
      zakatAdministrators: zakatAmount * 0.125,
      thoseWhoseHearts: zakatAmount * 0.125,
      freeingCaptives: zakatAmount * 0.125,
      debtors: zakatAmount * 0.125,
      inCauseOfAllah: zakatAmount * 0.125,
      wayfarers: zakatAmount * 0.125
    };

    return {
      totalWealth,
      deductibleDebts: debts,
      zakatableWealth,
      nisabThreshold,
      zakatPayable,
      zakatAmount,
      distribution
    };
  }
}

module.exports = {
  Sadaqah,
  Waqf,
  QardHasan,
  ZakatCalculator
};
