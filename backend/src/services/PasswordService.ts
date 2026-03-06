/**
 * Password Service
 * Handles password hashing and verification
 * Pure service - No database operations
 */

import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

/**
 * Hash a plaintext password
 * @param password Plaintext password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};

/**
 * Verify a password against a hash
 * @param password Plaintext password
 * @param hash Stored password hash
 * @returns True if password matches
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Check if password meets strength requirements
 * @param password Password to check
 * @returns Validation result
 */
export const validatePasswordStrength = (password: string): { 
  valid: boolean; 
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Generate a secure random password
 * @param length Password length
 * @returns Random password
 */
export const generateRandomPassword = (length: number = 16): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
};
