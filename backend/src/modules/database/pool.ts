/**
 * Database Connection Pool
 * Centralized PostgreSQL connection manager
 * Optimized for Neon serverless Postgres
 */

import { Pool, PoolClient, QueryResult } from "pg";
import { logger } from "../shared/utils/logger";

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

/**
 * Validate required environment variables
 */
const validateDatabaseConfig = (): void => {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "FATAL: DATABASE_URL environment variable is missing.\n" +
      "Example:\n" +
      "DATABASE_URL=postgresql://user:password@host/db?sslmode=require"
    );
  }
};

// Run validation immediately
validateDatabaseConfig();

// ============================================================================
// GLOBAL POOL (Prevents multiple connections during reloads)
// ============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __dbPool: Pool | undefined;
}

/**
 * Create a new PostgreSQL connection pool
 */
const createPool = (): Pool => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    // Pool configuration
    max: parseInt(process.env.DB_POOL_MAX || "20", 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,

    // Neon / cloud Postgres requires SSL
    ssl: {
      rejectUnauthorized: false
    }
  });

  // --------------------------------------------------------------------------
  // Pool event logging
  // --------------------------------------------------------------------------

  pool.on("connect", () => {
    logger.info("Database connected successfully");
  });

  pool.on("error", (err: any) => {
    logger.error("Unexpected database error", {
      error: err.message,
      code: err.code || "UNKNOWN"
    });
  });

  pool.on("acquire", () => {
    logger.debug("Database client acquired from pool");
  });

  pool.on("remove", () => {
    logger.debug("Database client removed from pool");
  });

  return pool;
};

// Reuse existing pool if available
const pool: Pool = global.__dbPool || createPool();

// Save pool globally
if (!global.__dbPool) {
  global.__dbPool = pool;
}

// ============================================================================
// QUERY EXECUTION
// ============================================================================

/**
 * Execute SQL query safely
 */
export const query = async (
  text: string,
  params?: any[]
): Promise<QueryResult> => {
  const start = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    logger.debug("Query executed", {
      query: text.substring(0, 100),
      duration,
      rows: result.rowCount
    });

    return result;
  } catch (error) {
    const duration = Date.now() - start;

    logger.error("Query error", {
      query: text.substring(0, 100),
      duration,
      error: (error as Error).message,
      code: (error as any).code || "UNKNOWN"
    });

    throw error;
  }
};

// ============================================================================
// CLIENT ACCESS
// ============================================================================

/**
 * Get raw client from pool
 */
export const getClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};

// ============================================================================
// TRANSACTION SUPPORT
// ============================================================================

/**
 * Execute a database transaction
 */
export const transaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await callback(client);

    await client.query("COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");

    logger.error("Transaction failed — rolled back", {
      error: (error as Error).message
    });

    throw error;
  } finally {
    client.release();
  }
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Check database connectivity
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (error) {
    logger.error("Database health check failed", {
      error: (error as Error).message
    });

    return false;
  }
};

// ============================================================================
// SHUTDOWN HANDLER
// ============================================================================

/**
 * Gracefully close the pool
 */
export const closePool = async (): Promise<void> => {
  logger.info("Closing database pool...");

  await pool.end();

  logger.info("Database pool closed");
};

export default pool;