/**
 * Security Utilities
 * Pure functions for security operations - No side effects
 */

import crypto from 'crypto';

/**
 * Generate a cryptographically secure CSRF token
 * @returns Hex string token
 */
export const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate a secure random string of specified length
 * @param length Length of string in bytes
 * @returns Base64url encoded string
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('base64url');
};

/**
 * Generate invitation code (12 character alphanumeric)
 * @returns Uppercase alphanumeric code
 */
export const generateInvitationCode = (): string => {
  return crypto.randomBytes(9)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 12)
    .toUpperCase();
};

/**
 * Generate WebAuthn challenge
 * @returns Base64 encoded challenge
 */
export const generateBiometricChallenge = (): string => {
  return crypto.randomBytes(32).toString('base64');
};

/**
 * Hash sensitive data (one-way)
 * @param data Data to hash
 * @returns SHA-256 hash
 */
export const hashData = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Constant time comparison to prevent timing attacks
 * @param a First string
 * @param b Second string
 * @returns boolean
 */
export const secureCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};
