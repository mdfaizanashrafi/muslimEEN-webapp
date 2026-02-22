/**
 * Database Configuration
 * PostgreSQL connection using node-pg
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'muslimeen',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Log connection events
pool.on('connect', () => {
  logger.info('Database connected');
});

pool.on('error', (err) => {
  logger.error('Unexpected database error', err);
});

/**
 * Execute a query
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Query executed', { text: text.substring(0, 100), duration, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Query error', { text: text.substring(0, 100), error: error.message });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 */
const getClient = async () => {
  return await pool.connect();
};

/**
 * Execute a transaction
 */
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  getClient,
  transaction
};
