/**
 * Database Configuration
 * PostgreSQL connection setup with TypeScript
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { env } from './env';

// Logger interface for database events
interface Logger {
  info: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, err?: Error | unknown) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
}

// Simple logger fallback if utils/logger is not available
const logger: Logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  error: (message: string, err?: Error | unknown) => {
    console.error(`[ERROR] ${message}`, err);
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '');
  },
};

/**
 * Database configuration from environment
 */
const dbConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

/**
 * PostgreSQL connection pool
 */
export const pool = new Pool(dbConfig);

/**
 * Handle pool errors
 */
pool.on('error', (err: Error) => {
  logger.error('Unexpected database error', err);
  process.exit(-1);
});

/**
 * Test database connection on startup
 */
pool.query('SELECT NOW()')
  .then(() => {
    logger.info('Database connected successfully');
  })
  .catch((err: Error) => {
    logger.error('Database connection failed', err);
  });

/**
 * Query helper function with generic return type
 * @param text - SQL query string
 * @param params - Query parameters
 * @returns Query result with typed rows
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

/**
 * Get a client from the pool for transactions
 * @returns PoolClient for transaction management
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Execute a transaction with automatic commit/rollback
 * @param callback - Function that receives a client and executes queries
 * @returns Result of the callback function
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  
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
}

/**
 * Database health check
 * @returns True if database is healthy
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

/**
 * Close database pool connections
 */
export async function closePool(): Promise<void> {
  await pool.end();
  logger.info('Database pool closed');
}

// Default export for backward compatibility
export default {
  query,
  getClient,
  pool,
  withTransaction,
  healthCheck,
  closePool,
};
