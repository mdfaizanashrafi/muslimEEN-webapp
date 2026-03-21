/**
 * JWT Service
 * Token generation and verification with security hardening
 * 
 * DEPRECATED: Migrated to Clerk authentication
 * This module is kept for backward compatibility during transition
 */

import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { JWTPayload } from '../../shared/types';

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================

/**
 * JWT Secret - validated in env.ts
 * DEPRECATED: Clerk migration complete
 */
const JWT_SECRET = env.JWT_SECRET;

/**
 * Check if JWT is configured
 * Returns false if migrated to Clerk (JWT_SECRET not set)
 */
const isJwtConfigured = (): boolean => {
  return !!JWT_SECRET && JWT_SECRET.length > 0;
};

/**
 * Additional runtime validation for extra security
 * (env.ts already validates minimum length and weak patterns)
 * DEPRECATED: Only runs if JWT_SECRET is still configured
 */
const validateJwtConfig = (): void => {
  // Skip validation if not configured (Clerk migration)
  if (!isJwtConfigured()) return;
  
  // Enforce minimum secret length (256 bits = 32 bytes = 64 hex chars)
  if (JWT_SECRET!.length < 64) {
    throw new Error(
      `FATAL: JWT_SECRET is too short (${JWT_SECRET!.length} chars). ` +
      'Minimum 64 characters (256 bits) required for security. ' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
  }
};

// Validate on module load in production (only if JWT still configured)
if (env.NODE_ENV === 'production' && isJwtConfigured()) {
  validateJwtConfig();
}

/**
 * JWT Expiration time
 * DEPRECATED: Clerk manages session expiration
 */
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN || '24h';

// Maximum allowed expiration: 7 days
const MAX_EXPIRES_IN = '7d';

/**
 * Validate expiration time
 */
const validateExpiration = (expiresIn: string): boolean => {
  // Parse time string (e.g., '24h', '7d')
  const match = expiresIn.match(/^(\d+)([hdm])$/);
  if (!match) return false;
  
  const [, value, unit] = match;
  const numValue = parseInt(value, 10);
  
  // Convert to hours for comparison
  let hours: number;
  switch (unit) {
    case 'm':
      hours = numValue / 60;
      break;
    case 'h':
      hours = numValue;
      break;
    case 'd':
      hours = numValue * 24;
      break;
    default:
      return false;
  }
  
  // Max 7 days = 168 hours
  return hours <= 168;
};

// Only validate if JWT is still configured
if (isJwtConfigured() && !validateExpiration(JWT_EXPIRES_IN)) {
  throw new Error(
    `FATAL: JWT_EXPIRES_IN (${JWT_EXPIRES_IN}) exceeds maximum allowed (${MAX_EXPIRES_IN})`
  );
}

// ============================================================================
// TOKEN OPERATIONS
// ============================================================================

/**
 * Generate JWT token
 * DEPRECATED: Use Clerk authentication instead
 * @param payload User payload to encode
 * @returns Signed JWT token
 * @throws Error if JWT not configured (Clerk migration complete)
 */
export const generateToken = (payload: JWTPayload): string => {
  if (!isJwtConfigured()) {
    throw new Error(
      'JWT authentication is deprecated. ' +
      'Migration to Clerk is complete. ' +
      'Use Clerk authentication instead.'
    );
  }
  
  return jwt.sign(payload, JWT_SECRET!, {
    algorithm: 'HS256',  // SECURITY FIX: Explicitly use HMAC SHA-256
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer: 'muslimeen-api',
    audience: 'muslimeen-client',
  });
};

/**
 * Verify JWT token
 * DEPRECATED: Use Clerk authentication instead
 * @param token JWT token to verify
 * @returns Decoded payload or null if invalid
 * @throws Error if JWT not configured (Clerk migration complete)
 */
export const verifyToken = (token: string): JWTPayload | null => {
  if (!isJwtConfigured()) {
    throw new Error(
      'JWT authentication is deprecated. ' +
      'Migration to Clerk is complete. ' +
      'Use Clerk authentication instead.'
    );
  }
  
  try {
    return jwt.verify(token, JWT_SECRET!, {
      algorithms: ['HS256'],  // SECURITY FIX: Only allow HS256
      issuer: 'muslimeen-api',
      audience: 'muslimeen-client',
    }) as JWTPayload;
  } catch {
    return null;
  }
};

/**
 * Decode token without verification (for debugging only)
 * WARNING: Never use this for authorization decisions
 * @param token JWT token to decode
 * @returns Decoded payload or null
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
};

/**
 * Get token expiration time
 * @param token JWT token
 * @returns Expiration timestamp or null
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (decoded?.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Check if token is expired
 * @param token JWT token
 * @returns true if expired or invalid
 */
export const isTokenExpired = (token: string): boolean => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  return expiration < new Date();
};

// Export configuration for testing
export const jwtConfig = {
  secretLength: isJwtConfigured() ? JWT_SECRET!.length : 0,
  expiresIn: JWT_EXPIRES_IN,
  isConfigured: isJwtConfigured(),
  isDeprecated: true,  // Flag indicating Clerk migration is complete
};
