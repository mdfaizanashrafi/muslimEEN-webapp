/**
 * JWT Service
 * Token generation and verification with security hardening
 */

import jwt from 'jsonwebtoken';
import { JWTPayload } from '../../shared/types';

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================

/**
 * JWT Secret - MUST be set via environment variable
 * Minimum 256 bits (32 bytes) of entropy required
 */
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Validate JWT configuration at startup
 * Fail fast if configuration is insecure
 */
const validateJwtConfig = (): void => {
  if (!JWT_SECRET) {
    throw new Error(
      'FATAL: JWT_SECRET environment variable is not set. ' +
      'Generate a secure secret with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
  }
  
  // Enforce minimum secret length (256 bits = 32 bytes = 64 hex chars)
  if (JWT_SECRET.length < 64) {
    throw new Error(
      `FATAL: JWT_SECRET is too short (${JWT_SECRET.length} chars). ` +
      'Minimum 64 characters (256 bits) required for security. ' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
  }
  
  // Warn if secret appears to be a default/weak value
  const weakPatterns = [
    'secret',
    'password',
    '123',
    'default',
    'your-secret',
    'test',
    'dev',
    'local'
  ];
  
  const lowerSecret = JWT_SECRET.toLowerCase();
  if (weakPatterns.some(pattern => lowerSecret.includes(pattern))) {
    throw new Error(
      'FATAL: JWT_SECRET appears to be a weak/default value. ' +
      'Generate a cryptographically secure secret with: ' +
      'node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
  }
};

// Validate on module load
validateJwtConfig();

/**
 * JWT Expiration time
 */
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

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

if (!validateExpiration(JWT_EXPIRES_IN)) {
  throw new Error(
    `FATAL: JWT_EXPIRES_IN (${JWT_EXPIRES_IN}) exceeds maximum allowed (${MAX_EXPIRES_IN})`
  );
}

// ============================================================================
// TOKEN OPERATIONS
// ============================================================================

/**
 * Generate JWT token
 * @param payload User payload to encode
 * @returns Signed JWT token
 */
/**
 * Generate JWT token
 * SECURITY FIX: Explicitly specify algorithm to prevent algorithm confusion attacks
 */
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET!, {
    algorithm: 'HS256',  // SECURITY FIX: Explicitly use HMAC SHA-256
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer: 'muslimeen-api',
    audience: 'muslimeen-client',
  });
};

/**
 * Verify JWT token
 * @param token JWT token to verify
 * @returns Decoded payload or null if invalid
 */
/**
 * Verify JWT token
 * SECURITY FIX: Explicitly allow only HS256 algorithm
 */
export const verifyToken = (token: string): JWTPayload | null => {
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
  secretLength: JWT_SECRET!.length,
  expiresIn: JWT_EXPIRES_IN,
  isConfigured: true,
};
