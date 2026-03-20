/**
 * Internal API Authentication
 * 
 * Provides secure authentication for:
 * - Service-to-service communication
 * - Background jobs
 * - CLI scripts
 * - Internal tools
 * 
 * STRATEGY: API Key based authentication
 * - NOT JWT (to avoid confusion with user auth)
 * - NOT cookies (not browser-based)
 * 
 * SECURITY:
 * - Keys are hashed in database (bcrypt)
 * - Keys have expiration dates
 * - Keys are scope-limited (read/write/admin)
 * - Audit logging for all key usage
 * 
 * DATE: 2026-03-20
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import pool from '../../database/pool';
import { logger } from '../utils/logger';
import { recordAuthError } from '../../iam/controllers/AuthHealthController';

// ============================================================================
// TYPES
// ============================================================================

export type ApiKeyScope = 'read' | 'write' | 'admin';

export interface ApiKey {
  id: string;
  name: string;
  hashedKey: string;
  scope: ApiKeyScope;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  isActive: boolean;
}

export interface InternalAuthContext {
  type: 'internal';
  keyId: string;
  keyName: string;
  scope: ApiKeyScope;
}

// ============================================================================
// API KEY GENERATION
// ============================================================================

/**
 * Generate a new API key
 * 
 * Format: `musl_<random>_<timestamp>`
 * Example: `musl_a1b2c3d4e5_1699123456`
 * 
 * @returns Object with plain key (show once) and hashed key (store)
 */
export const generateApiKey = (name: string, scope: ApiKeyScope = 'read', expiresInDays?: number): 
  { plainKey: string; hashedKey: string } => {
  
  const prefix = 'musl';
  const random = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  
  const plainKey = `${prefix}_${random}_${timestamp}`;
  const hashedKey = bcrypt.hashSync(plainKey, 12);
  
  logger.info('Generated internal API key', { name, scope, expiresInDays });
  
  return { plainKey, hashedKey };
};

/**
 * Store API key in database
 */
export const storeApiKey = async (
  name: string,
  hashedKey: string,
  scope: ApiKeyScope = 'read',
  expiresInDays?: number
): Promise<string> => {
  const expiresAt = expiresInDays 
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;
  
  const result = await pool.query(
    `INSERT INTO api_keys (name, hashed_key, scope, expires_at, is_active, created_at)
     VALUES ($1, $2, $3, $4, true, NOW())
     RETURNING id`,
    [name, hashedKey, scope, expiresAt]
  );
  
  logger.info('Stored API key', { keyId: result.rows[0].id, name, scope });
  
  return result.rows[0].id;
};

// ============================================================================
// API KEY VERIFICATION
// ============================================================================

/**
 * Verify an API key
 */
export const verifyApiKey = async (plainKey: string): Promise<ApiKey | null> => {
  // Extract key ID from prefix (for logging, not verification)
  const keyPrefix = plainKey.substring(0, 20);
  
  // Get all active keys
  const result = await pool.query(
    `SELECT id, name, hashed_key, scope, expires_at, last_used_at, created_at, is_active
     FROM api_keys
     WHERE is_active = true
       AND (expires_at IS NULL OR expires_at > NOW())`,
  );
  
  // Find matching key
  for (const row of result.rows) {
    if (await bcrypt.compare(plainKey, row.hashed_key)) {
      // Update last used
      await pool.query(
        'UPDATE api_keys SET last_used_at = NOW() WHERE id = $1',
        [row.id]
      );
      
      logger.debug('API key verified', { keyId: row.id, name: row.name });
      
      return {
        id: row.id,
        name: row.name,
        hashedKey: row.hashed_key,
        scope: row.scope,
        expiresAt: row.expires_at,
        lastUsedAt: new Date(),
        createdAt: row.created_at,
        isActive: row.is_active,
      };
    }
  }
  
  logger.warn('API key verification failed', { keyPrefix });
  return null;
};

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Internal API Authentication Middleware
 * 
 * Validates X-API-Key header for service-to-service auth
 * 
 * Usage:
 *   router.use(internalApiAuth);  // For internal routes
 *   router.get('/internal/stats', internalApiAuth, handler);
 */
export const internalApiAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    recordAuthError('API key missing', 'internal_auth_missing');
    res.status(401).json({
      success: false,
      error: {
        code: 'API_KEY_REQUIRED',
        message: 'X-API-Key header is required',
      },
    });
    return;
  }
  
  const keyData = await verifyApiKey(apiKey);
  
  if (!keyData) {
    recordAuthError('Invalid API key', 'internal_auth_invalid');
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid or expired API key',
      },
    });
    return;
  }
  
  // Attach auth context to request
  (req as any).internalAuth = {
    type: 'internal',
    keyId: keyData.id,
    keyName: keyData.name,
    scope: keyData.scope,
  } as InternalAuthContext;
  
  // Log for audit
  logger.debug('Internal API request authenticated', {
    keyId: keyData.id,
    keyName: keyData.name,
    path: req.path,
    method: req.method,
  });
  
  next();
};

/**
 * Scope-based authorization for internal APIs
 */
export const requireScope = (...allowedScopes: ApiKeyScope[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = (req as any).internalAuth as InternalAuthContext | undefined;
    
    if (!auth || auth.type !== 'internal') {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Internal authentication required' },
      });
      return;
    }
    
    // Admin scope has access to everything
    if (auth.scope === 'admin') {
      return next();
    }
    
    // Check if scope is allowed
    if (!allowedScopes.includes(auth.scope)) {
      logger.warn('Internal API scope insufficient', {
        keyId: auth.keyId,
        required: allowedScopes,
        actual: auth.scope,
      });
      
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient scope' },
      });
      return;
    }
    
    next();
  };
};

// ============================================================================
// DATABASE SETUP
// ============================================================================

/**
 * SQL to create api_keys table
 * 
 * Run this migration:
 * 
 * ```sql
 * CREATE TABLE api_keys (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   name VARCHAR(255) NOT NULL UNIQUE,
 *   hashed_key VARCHAR(255) NOT NULL,
 *   scope VARCHAR(20) NOT NULL DEFAULT 'read',
 *   expires_at TIMESTAMP,
 *   last_used_at TIMESTAMP,
 *   is_active BOOLEAN DEFAULT true,
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW()
 * );
 * 
 * CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;
 * ```
 */

// ============================================================================
// CLI UTILITIES
// ============================================================================

/**
 * Create a new API key via CLI
 * 
 * Usage:
 *   npx ts-node scripts/create-api-key.ts --name="Scheduler" --scope=write --expires=90
 */
export const createApiKeyCli = async (options: {
  name: string;
  scope: ApiKeyScope;
  expiresInDays?: number;
}): Promise<void> => {
  const { plainKey, hashedKey } = generateApiKey(options.name, options.scope, options.expiresInDays);
  const keyId = await storeApiKey(options.name, hashedKey, options.scope, options.expiresInDays);
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              API KEY CREATED - SAVE SECURELY               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log('Key ID:', keyId);
  console.log('Name:', options.name);
  console.log('Scope:', options.scope);
  if (options.expiresInDays) {
    console.log('Expires:', new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString());
  }
  console.log('\n⚠️  API KEY (copy now - will not be shown again):');
  console.log(plainKey);
  console.log('\n⚠️  Store this key securely. It cannot be retrieved later.\n');
};

export default {
  generateApiKey,
  storeApiKey,
  verifyApiKey,
  internalApiAuth,
  requireScope,
};
