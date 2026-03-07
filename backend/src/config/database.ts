/**
 * Database Configuration
 * PostgreSQL connection using node-pg
 */

import { Pool, PoolConfig, QueryResult, PoolClient } from 'pg';
import logger from '../utils/logger';

// Database connection configuration
const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'muslimeen',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
};

// Database connection pool
const pool = new Pool(poolConfig);

// Log connection events
pool.on('connect', () => {
  logger.info('Database connected');
});

pool.on('error', (err: Error) => {
  logger.error('Unexpected database error', err);
});

/**
 * Execute a query
 * @param text - SQL query text
 * @param params - Query parameters
 * @returns Query result
 */
const query = async <T = unknown>(text: string, params?: unknown[]): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    logger.debug('Query executed', { text: text.substring(0, 100), duration, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Query error', { text: text.substring(0, 100), error: (error as Error).message });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns Pool client
 */
const getClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};

/**
 * Transaction callback type
 */
type TransactionCallback<T> = (client: PoolClient) => Promise<T>;

/**
 * Execute a transaction
 * @param callback - Function to execute within the transaction
 * @returns Result from the callback
 */
const transaction = async <T>(callback: TransactionCallback<T>): Promise<T> => {
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

export { pool, query, getClient, transaction };
export type { TransactionCallback };
