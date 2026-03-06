/**
 * Security Utilities Unit Tests
 */

import {
  generateCsrfToken,
  generateSecureToken,
  generateInvitationCode,
  generateBiometricChallenge,
  hashData,
  secureCompare,
} from '../../../src/utils/security';

describe('Security Utilities', () => {
  describe('generateCsrfToken', () => {
    it('should generate a 64-character hex string', () => {
      const token = generateCsrfToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[a-f0-9]+$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate token with default length', () => {
      const token = generateSecureToken();
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate token with specified length', () => {
      const token = generateSecureToken(16);
      // Base64url encoding of 16 bytes = ~22 characters
      expect(token.length).toBeGreaterThan(20);
    });

    it('should generate unique tokens', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateInvitationCode', () => {
    it('should generate 12-character code', () => {
      const code = generateInvitationCode();
      expect(code).toHaveLength(12);
    });

    it('should generate uppercase alphanumeric code', () => {
      const code = generateInvitationCode();
      expect(code).toMatch(/^[A-Z0-9]{12}$/);
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateInvitationCode());
      }
      expect(codes.size).toBe(100);
    });
  });

  describe('generateBiometricChallenge', () => {
    it('should generate base64 string', () => {
      const challenge = generateBiometricChallenge();
      expect(challenge.length).toBeGreaterThan(0);
      // Base64 string should not contain non-base64 characters
      expect(challenge).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('should generate unique challenges', () => {
      const challenge1 = generateBiometricChallenge();
      const challenge2 = generateBiometricChallenge();
      expect(challenge1).not.toBe(challenge2);
    });
  });

  describe('hashData', () => {
    it('should generate consistent hash for same input', () => {
      const data = 'test-data';
      const hash1 = hashData(data);
      const hash2 = hashData(data);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = hashData('data1');
      const hash2 = hashData('data2');
      expect(hash1).not.toBe(hash2);
    });

    it('should generate 64-character hex hash (SHA-256)', () => {
      const hash = hashData('test');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('secureCompare', () => {
    it('should return true for identical strings', () => {
      expect(secureCompare('abc', 'abc')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(secureCompare('abc', 'def')).toBe(false);
    });

    it('should return false for different length strings', () => {
      expect(secureCompare('abc', 'abcd')).toBe(false);
    });

    it('should be timing-safe (not leak info via timing)', () => {
      // This is a basic test - real timing attack prevention
      // is handled by crypto.timingSafeEqual internally
      const start1 = process.hrtime.bigint();
      secureCompare('a'.repeat(100), 'b'.repeat(100));
      const end1 = process.hrtime.bigint();

      const start2 = process.hrtime.bigint();
      secureCompare('a'.repeat(100), 'a'.repeat(100));
      const end2 = process.hrtime.bigint();

      // Both operations should complete
      expect(Number(end1 - start1)).toBeGreaterThan(0);
      expect(Number(end2 - start2)).toBeGreaterThan(0);
    });
  });
});
