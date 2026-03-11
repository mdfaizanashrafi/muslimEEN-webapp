/**
 * Database Connection Pool
 * Central database connection with security hardening
 */

import { Pool, QueryResult } from 'pg';
import { logger } from '../shared/utils/logger';

// ============================================================================
// SECURITY CONFIGURATION VALIDATION
// ============================================================================

/**
 * Validate database configuration
 * Fail fast if security-critical configuration is missing
 */
const validateDatabaseConfig = (): void => {
  const requiredEnvVars = [
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD'
  ];
  
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `FATAL: Missing required database environment variables: ${missing.join(', ')}\n` +
      `Please set all of the following in your .env file:\n` +
      requiredEnvVars.map(v => `  ${v}=...`).join('\n')
    );
  }
  
  // Check for weak/default passwords (only in production)
  if (process.env.NODE_ENV === 'production') {
    const weakPasswords = [
      'password',
      'postgres',
      'admin',
      '123456',
      'default',
      'secret'
    ];
    
    const dbPassword = process.env.DB_PASSWORD!.toLowerCase();
    if (weakPasswords.some(weak => dbPassword.includes(weak))) {
      throw new Error(
        'FATAL: Database password appears to be weak or default. ' +
        'Please generate a strong password with at least 16 characters.'
      );
    }
    
    // Validate password length in production
    if (process.env.DB_PASSWORD!.length < 12) {
      throw new Error(
        'FATAL: Database password must be at least 12 characters long.'
      );
    }
  }
};

// Validate on module load
validateDatabaseConfig();

// ============================================================================
// DATABASE POOL CONFIGURATION
// ============================================================================

/**
 * Database connection pool
 * No default credentials - must be explicitly configured
 */
const pool = new Pool({
  host: process.env.DB_HOST!,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  
  // Connection pool settings
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Increased for production
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' 
    ? {
        rejectUnauthorized: true,
        ca: process.env.DB_SSL_CA, // Optional: CA certificate
      }
    : false,
});

// Log connection events
pool.on('connect', () => {
  logger.info('Database connected successfully');
});

pool.on('error', (err: any) => {
  logger.error('Unexpected database error', { 
    error: err.message,
    code: err.code || 'UNKNOWN'
  });
});

pool.on('acquire', () => {
  // Optional: Log when client is acquired from pool
  logger.debug('Database client acquired from pool');
});

pool.on('remove', () => {
  // Optional: Log when client is removed from pool
  logger.debug('Database client removed from pool');
});

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

/**
 * Execute a query with logging and error handling
 * @param text SQL query text
 * @param params Query parameters (use parameterized queries only!)
 * @returns Query result
 */
export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log query without sensitive data
    logger.debug('Query executed', { 
      query: text.substring(0, 100),
      duration,
      rows: result.rowCount 
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    // Log error without exposing sensitive data
    logger.error('Query error', { 
      query: text.substring(0, 100),
      duration,
      error: (error as Error).message,
      code: (error as any).code || 'UNKNOWN'
    });
    
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * Remember to release the client!
 * @returns Database client
 */
export const getClient = async () => {
  return await pool.connect();
};

/**
 * Execute a transaction with automatic rollback on error
 * @param callback Function that receives a client and performs operations
 * @returns Result from callback
 */
export const transaction = async <T>(callback: (client: any) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction failed, rolled back', { error: (error as Error).message });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Health check for database connectivity
 * @returns true if healthy, false otherwise
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    logger.error('Database health check failed', { error: (error as Error).message });
    return false;
  }
};

/**
 * Gracefully close the pool
 * Use during shutdown
 */
export const closePool = async (): Promise<void> => {
  logger.info('Closing database pool...');
  await pool.end();
  logger.info('Database pool closed');
};

export default pool;
