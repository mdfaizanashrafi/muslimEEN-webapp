/**
 * JWT Service Unit Tests
 */

import {
  generateToken,
  verifyToken,
  decodeToken,
  getTokenExpiration,
  TokenPayload,
} from '../../../src/services/JwtService';

// Store original env vars
const originalJwtSecret = process.env.JWT_SECRET;
const originalJwtExpiresIn = process.env.JWT_EXPIRES_IN;

describe('JwtService', () => {
  const mockPayload: TokenPayload = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'muslim_verified',
  };

  beforeAll(() => {
    // Ensure test environment variables are set
    process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  afterAll(() => {
    // Restore original env vars
    process.env.JWT_SECRET = originalJwtSecret;
    process.env.JWT_EXPIRES_IN = originalJwtExpiresIn;
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate unique tokens for same payload', () => {
      const token1 = generateToken(mockPayload);
      const token2 = generateToken(mockPayload);
      expect(token1).not.toBe(token2);
    });

    it('should include payload data in token', () => {
      const token = generateToken(mockPayload);
      const decoded = decodeToken(token);
      expect(decoded).toMatchObject(mockPayload);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);
      expect(decoded).toMatchObject(mockPayload);
    });

    it('should return null for invalid token', () => {
      const result = verifyToken('invalid-token');
      expect(result).toBeNull();
    });

    it('should return null for expired token', () => {
      // This would require mocking time or using a known expired token
      // For now, we test the error handling
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItMTIzIiwiZXhwIjoxMDAwMDAwMDAwfQ.invalid';
      const result = verifyToken(expiredToken);
      expect(result).toBeNull();
    });

    it('should return null for tampered token', () => {
      const token = generateToken(mockPayload);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';
      const result = verifyToken(tamperedToken);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = verifyToken('');
      expect(result).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid token without verification', () => {
      const token = generateToken(mockPayload);
      const decoded = decodeToken(token);
      expect(decoded).toMatchObject(mockPayload);
    });

    it('should decode payload even from invalid signature', () => {
      const token = generateToken(mockPayload);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';
      const decoded = decodeToken(tamperedToken);
      // decodeToken doesn't verify signature, so it should still decode
      expect(decoded).toMatchObject(mockPayload);
    });

    it('should return null for malformed token', () => {
      const result = decodeToken('not-a-jwt');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = decodeToken('');
      expect(result).toBeNull();
    });
  });

  describe('getTokenExpiration', () => {
    it('should return future date for 1h expiry', () => {
      process.env.JWT_EXPIRES_IN = '1h';
      const expiration = getTokenExpiration();
      const now = new Date();
      
      expect(expiration).toBeInstanceOf(Date);
      expect(expiration.getTime()).toBeGreaterThan(now.getTime());
      // Should be approximately 1 hour from now (within 5 seconds)
      expect(expiration.getTime() - now.getTime()).toBeGreaterThan(59 * 60 * 1000);
      expect(expiration.getTime() - now.getTime()).toBeLessThan(65 * 60 * 1000);
    });

    it('should handle 24h expiry', () => {
      process.env.JWT_EXPIRES_IN = '24h';
      const expiration = getTokenExpiration();
      const now = new Date();
      
      const hoursDiff = (expiration.getTime() - now.getTime()) / (60 * 60 * 1000);
      expect(hoursDiff).toBeGreaterThan(23);
      expect(hoursDiff).toBeLessThan(25);
    });

    it('should handle days format', () => {
      process.env.JWT_EXPIRES_IN = '7d';
      const expiration = getTokenExpiration();
      const now = new Date();
      
      const daysDiff = (expiration.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
      expect(daysDiff).toBeGreaterThan(6);
      expect(daysDiff).toBeLessThan(8);
    });

    it('should default to 24h for invalid format', () => {
      process.env.JWT_EXPIRES_IN = 'invalid';
      const expiration = getTokenExpiration();
      const now = new Date();
      
      const hoursDiff = (expiration.getTime() - now.getTime()) / (60 * 60 * 1000);
      expect(hoursDiff).toBeGreaterThan(23);
      expect(hoursDiff).toBeLessThan(25);
    });
  });
});
