/**
 * Password Service Unit Tests
 */

import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateRandomPassword,
} from '../../../src/services/PasswordService';

describe('PasswordService', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'myPassword123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'myPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle long passwords', async () => {
      const password = 'a'.repeat(128);
      const hash = await hashPassword(password);
      expect(hash).toBeDefined();
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'myPassword123';
      const hash = await hashPassword(password);
      const result = await verifyPassword(password, hash);
      
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'myPassword123';
      const hash = await hashPassword(password);
      const result = await verifyPassword('wrongPassword', hash);
      
      expect(result).toBe(false);
    });

    it('should return false for empty password', async () => {
      const hash = await hashPassword('password');
      const result = await verifyPassword('', hash);
      
      expect(result).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong password', () => {
      const result = validatePasswordStrength('StrongP@ss123');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password less than 8 characters', () => {
      const result = validatePasswordStrength('Short1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should reject password without uppercase', () => {
      const result = validatePasswordStrength('lowercase123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase', () => {
      const result = validatePasswordStrength('UPPERCASE123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = validatePasswordStrength('NoNumbersHere');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password longer than 128 characters', () => {
      const result = validatePasswordStrength('A1' + 'a'.repeat(127));
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be less than 128 characters');
    });

    it('should return multiple errors for weak password', () => {
      const result = validatePasswordStrength('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('generateRandomPassword', () => {
    it('should generate password with default length', () => {
      const password = generateRandomPassword();
      expect(password.length).toBe(16);
    });

    it('should generate password with specified length', () => {
      const password = generateRandomPassword(32);
      expect(password.length).toBe(32);
    });

    it('should generate unique passwords', () => {
      const passwords = new Set();
      for (let i = 0; i < 100; i++) {
        passwords.add(generateRandomPassword());
      }
      expect(passwords.size).toBe(100);
    });

    it('should contain only allowed characters', () => {
      const password = generateRandomPassword();
      const allowedChars = /^[a-zA-Z0-9!@#$%^&*]+$/;
      expect(password).toMatch(allowedChars);
    });
  });
});
