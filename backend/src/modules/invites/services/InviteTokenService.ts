/**
 * Invite Token Service
 * 
 * SECURITY: Generates and verifies signed invite tokens.
 * Uses HMAC-SHA256 for token signing to prevent tampering.
 * 
 * Token format: base64(payload.signature)
 * Payload: { code: string, exp: number }
 */

import crypto from 'crypto';
import { env } from '../../../config/env';
import { logger } from '../../shared/utils/logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

const TOKEN_VERSION = 'v1';
const TOKEN_EXPIRY_MINUTES = 10; // Signed token valid for 10 minutes

/**
 * Get the token secret from environment - RUNTIME CHECK
 * CRITICAL: This ensures the same secret is used for signing AND verification
 * NO FALLBACK - App will crash if secret is missing (security feature)
 */
const getTokenSecret = (): string => {
  if (!env.INVITE_TOKEN_SECRET) {
    throw new Error(
      'SECURITY ERROR: INVITE_TOKEN_SECRET is required but not set. ' +
      'Please set INVITE_TOKEN_SECRET in your environment. ' +
      'This secret must be identical across all services (API, webhook, workers).'
    );
  }
  
  // Debug log (temporary) - helps verify secret is available
  logger.debug('Invite token secret check', {
    hasSecret: true,
    length: env.INVITE_TOKEN_SECRET.length,
    prefix: env.INVITE_TOKEN_SECRET.substring(0, 4) + '...',
  });
  
  return env.INVITE_TOKEN_SECRET;
};

// ============================================================================
// TYPES
// ============================================================================

interface TokenPayload {
  code: string;
  exp: number; // Unix timestamp
  v: string;   // Version
}

interface SignedInviteToken {
  token: string;
  expiresAt: Date;
}

interface TokenVerificationResult {
  valid: boolean;
  code?: string;
  error?: string;
}

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generate a signed invite token
 * 
 * SECURITY: The token is signed with HMAC-SHA256 and includes expiry.
 * This prevents:
 * - Token tampering (signature verification fails)
 * - Token replay (expiry time embedded)
 * - Token forgery (requires secret key)
 */
export const generateSignedToken = (inviteCode: string): SignedInviteToken => {
  // CRITICAL: Get secret at runtime - ensures consistency with verification
  const secret = getTokenSecret();
  
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (TOKEN_EXPIRY_MINUTES * 60);
  
  const payload: TokenPayload = {
    code: inviteCode,
    exp,
    v: TOKEN_VERSION,
  };
  
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('base64url');
  
  const token = `${payloadBase64}.${signature}`;
  
  return {
    token,
    expiresAt: new Date(exp * 1000),
  };
};

// ============================================================================
// TOKEN VERIFICATION
// ============================================================================

/**
 * Verify a signed invite token
 * 
 * SECURITY: Always verify before trusting token contents.
 * Returns generic error messages to prevent information leakage.
 */
export const verifySignedToken = (token: string): TokenVerificationResult => {
  try {
    // CRITICAL: Get secret at runtime - ensures consistency with generation
    const secret = getTokenSecret();
    
    // Basic format check
    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    const [payloadBase64, providedSignature] = parts;
    
    // Verify signature using SAME secret as generation
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadBase64)
      .digest('base64url');
    
    if (!crypto.timingSafeEqual(
      Buffer.from(providedSignature),
      Buffer.from(expectedSignature)
    )) {
      logger.warn('Invite token signature mismatch', { 
        tags: { module: 'invites', type: 'security' } 
      });
      return { valid: false, error: 'Invalid token' };
    }
    
    // Parse payload
    let payload: TokenPayload;
    try {
      payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString());
    } catch {
      return { valid: false, error: 'Invalid token payload' };
    }
    
    // Check version
    if (payload.v !== TOKEN_VERSION) {
      return { valid: false, error: 'Invalid token version' };
    }
    
    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { valid: false, error: 'Token expired' };
    }
    
    return {
      valid: true,
      code: payload.code,
    };
  } catch (error) {
    logger.error('Token verification error', { 
      error: (error as Error).message,
      tags: { module: 'invites', type: 'security' }
    });
    return { valid: false, error: 'Invalid token' };
  }
};

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

/**
 * Generate a cryptographically secure invite code
 * Format: MUSLIM-XXXXXX (alphanumeric, uppercase)
 */
export const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0, O, 1, I to avoid confusion
  const length = 8;
  
  const bytes = crypto.randomBytes(length);
  let code = '';
  
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  
  return `MUSLIM-${code}`;
};

/**
 * Hash an invite code for database storage
 * Used to prevent database leaks from revealing raw codes
 * 
 * CRITICAL: Uses same secret as token signing for consistency
 */
export const hashInviteCode = (code: string): string => {
  const secret = getTokenSecret();
  return crypto
    .createHmac('sha256', secret)
    .update(code.toUpperCase())
    .digest('hex');
};

/**
 * Compare invite code with hash (constant-time)
 */
export const compareInviteCode = (code: string, hash: string): boolean => {
  try {
    const computedHash = hashInviteCode(code);
    return crypto.timingSafeEqual(
      Buffer.from(computedHash),
      Buffer.from(hash)
    );
  } catch {
    return false;
  }
};

// ============================================================================
// RATE LIMITING HELPERS
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check rate limit for an identifier (IP or userId)
 * 
 * SECURITY: Prevents brute force attacks on invite validation
 */
export const checkRateLimit = (
  identifier: string,
  maxRequests: number = 5,
  windowMinutes: number = 1
): { allowed: boolean; remaining: number; resetAt?: number } => {
  const now = Math.floor(Date.now() / 1000);
  const windowSeconds = windowMinutes * 60;
  
  const entry = rateLimitStore.get(identifier);
  
  // No entry or expired window
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowSeconds,
    });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowSeconds };
  }
  
  // Check limit
  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  
  // Increment and allow
  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
};

/**
 * Clean up expired rate limit entries
 */
export const cleanupRateLimits = (): void => {
  const now = Math.floor(Date.now() / 1000);
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
};

// Periodic cleanup every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);
