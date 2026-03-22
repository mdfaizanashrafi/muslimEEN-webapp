/**
 * Invite Token Service - ELITE PRODUCTION GRADE
 * 
 * SECURITY FEATURES:
 * - JWT with HS256 (HMAC-SHA256) signing
 * - 10-minute expiry (prevents replay)
 * - Unique JWT ID (nonce) for traceability
 * - Constant-time signature verification
 * - Strict secret validation (no fallbacks)
 * 
 * DATE: 2026-03-21
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { logger } from '../../shared/utils/logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

const TOKEN_EXPIRY_MINUTES = 10;
const ALGORITHM = 'HS256';

// ============================================================================
// TYPES
// ============================================================================

export interface InviteTokenPayload {
  code: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface SignedInviteToken {
  token: string;
  expiresAt: Date;
  jti: string;
}

export interface TokenVerificationResult {
  valid: boolean;
  code?: string;
  jti?: string;
  error?: string;
}

// ============================================================================
// SECRET MANAGEMENT
// ============================================================================

/**
 * Get invite token secret with strict validation
 * CRITICAL: No fallback - system fails secure
 */
const getTokenSecret = (): string => {
  const secret = env.INVITE_TOKEN_SECRET;
  
  if (!secret) {
    throw new Error(
      'SECURITY CRITICAL: INVITE_TOKEN_SECRET is not configured. ' +
      'Set a cryptographically secure secret (>= 32 chars).'
    );
  }
  
  if (secret.length < 32) {
    throw new Error(
      `SECURITY CRITICAL: INVITE_TOKEN_SECRET must be >= 32 chars. ` +
      `Current: ${secret.length}`
    );
  }
  
  return secret;
};

// ============================================================================
// JWT TOKEN OPERATIONS
// ============================================================================

/**
 * Generate a cryptographically secure JWT invite token
 * 
 * @param inviteCode - The normalized invite code
 * @returns Signed JWT with expiry and nonce
 */
export const generateInviteJWT = (inviteCode: string): SignedInviteToken => {
  const secret = getTokenSecret();
  const normalizedCode = inviteCode.toUpperCase().trim();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (TOKEN_EXPIRY_MINUTES * 60);
  const jti = crypto.randomBytes(16).toString('hex');
  
  const payload: InviteTokenPayload = {
    code: normalizedCode,
    iat: now,
    exp,
    jti,
  };
  
  const token = jwt.sign(payload, secret, { 
    algorithm: ALGORITHM,
    jwtid: jti,
  });
  
  logger.info('INVITE_TOKEN_ISSUED', {
    code: `${normalizedCode.substring(0, 4)}...`,
    jti: `${jti.substring(0, 8)}...`,
    exp: new Date(exp * 1000).toISOString(),
  });
  
  return {
    token,
    expiresAt: new Date(exp * 1000),
    jti,
  };
};

/**
 * Verify a signed JWT invite token
 * 
 * SECURITY:
 * - Verifies signature (constant-time)
 * - Checks expiry
 * - Validates payload structure
 * - Returns generic errors (no info leakage)
 * 
 * @param token - The JWT token string
 * @returns Verification result
 */
export const verifyInviteJWT = (token: string): TokenVerificationResult => {
  try {
    const secret = getTokenSecret();
    
    const decoded = jwt.verify(token, secret, {
      algorithms: [ALGORITHM],
    }) as InviteTokenPayload;
    
    // Validate payload structure
    if (!decoded.code || typeof decoded.code !== 'string') {
      logger.warn('JWT missing code', { tags: { module: 'invites', type: 'security' } });
      return { valid: false, error: 'INVALID_TOKEN' };
    }
    
    if (!decoded.jti || typeof decoded.jti !== 'string') {
      logger.warn('JWT missing jti', { tags: { module: 'invites', type: 'security' } });
      return { valid: false, error: 'INVALID_TOKEN' };
    }
    
    return {
      valid: true,
      code: decoded.code,
      jti: decoded.jti,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.info('JWT expired', { tags: { module: 'invites', type: 'security' } });
      return { valid: false, error: 'TOKEN_EXPIRED' };
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('JWT verification failed', { 
        error: error.message,
        tags: { module: 'invites', type: 'security' }
      });
      return { valid: false, error: 'INVALID_TOKEN' };
    }
    
    logger.error('JWT unexpected error', {
      error: (error as Error).message,
      tags: { module: 'invites', type: 'error' }
    });
    return { valid: false, error: 'INVALID_TOKEN' };
  }
};

// ============================================================================
// CODE GENERATION & HASHING
// ============================================================================

/**
 * Generate a cryptographically secure invite code
 * Format: MUSLIM-XXXXXX (no ambiguous characters)
 */
export const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0, O, 1, I
  const length = 8;
  const bytes = crypto.randomBytes(length);
  
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  
  return `MUSLIM-${code}`;
};

/**
 * Hash invite code for database storage
 * Uses HMAC-SHA256 with the invite token secret
 */
export const hashInviteCode = (code: string): string => {
  const secret = getTokenSecret();
  return crypto
    .createHmac('sha256', secret)
    .update(code.toUpperCase().trim())
    .digest('hex');
};

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export const checkRateLimit = (
  identifier: string,
  maxRequests: number = 5,
  windowMinutes: number = 1
): { allowed: boolean; remaining: number; resetAt?: number } => {
  const now = Math.floor(Date.now() / 1000);
  const windowSeconds = windowMinutes * 60;
  const entry = rateLimitStore.get(identifier);
  
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowSeconds,
    });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowSeconds };
  }
  
  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  
  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
};

// Cleanup every 5 minutes
setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ============================================================================
// BACKWARD COMPATIBILITY
// ============================================================================

export const generateSignedToken = generateInviteJWT;
export const verifySignedToken = verifyInviteJWT;
