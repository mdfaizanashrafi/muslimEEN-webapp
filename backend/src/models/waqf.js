/**
 * Waqf (Endowment) Model
 * Following BACKEND_README.md Waqf interface
 */

const db = require('../config/database');

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

module.exports = { Waqf };
