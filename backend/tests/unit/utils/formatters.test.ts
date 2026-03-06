/**
 * Formatter Utilities Unit Tests
 */

import {
  formatUser,
  formatTimestamp,
  camelToSnake,
  snakeToCamel,
  formatCurrency,
  formatTrustScore,
  sanitizeString,
} from '../../../src/utils/formatters';
import { UserRole, VerificationTier } from '../../../src/types';

describe('Formatter Utilities', () => {
  describe('formatUser', () => {
    const mockDbRow = {
      id: 'user-123',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'muslim_verified' as UserRole,
      verification_tier: 'full' as VerificationTier,
      trust_score: 750,
      bio: 'Test bio',
      location: 'London',
      industry: 'Tech',
      skills: ['JS', 'TS'],
      endorsements: 10,
      connections: 50,
      profile_views: 100,
      is_witness_eligible: true,
      is_active: true,
      badges: ['verified'],
      created_at: new Date('2024-01-01'),
      last_login: new Date('2024-03-01'),
    };

    it('should format database row to User object', () => {
      const user = formatUser(mockDbRow);
      
      expect(user).toBeDefined();
      expect(user?.id).toBe('user-123');
      expect(user?.email).toBe('test@example.com');
      expect(user?.firstName).toBe('Test');
      expect(user?.lastName).toBe('User');
      expect(user?.fullName).toBe('Test User');
      expect(user?.trustScore).toBe(750);
    });

    it('should handle null input', () => {
      const user = formatUser(null);
      expect(user).toBeNull();
    });

    it('should handle missing optional fields', () => {
      const partialRow = { ...mockDbRow };
      delete (partialRow as any).bio;
      delete (partialRow as any).location;
      
      const user = formatUser(partialRow);
      expect(user?.bio).toBeUndefined();
      expect(user?.location).toBeUndefined();
    });

    it('should default arrays to empty arrays', () => {
      const rowWithoutArrays = { ...mockDbRow, skills: null, badges: null };
      const user = formatUser(rowWithoutArrays);
      expect(user?.skills).toEqual([]);
      expect(user?.badges).toEqual([]);
    });
  });

  describe('formatTimestamp', () => {
    it('should format Date to ISO string', () => {
      const date = new Date('2024-03-01T12:00:00Z');
      const result = formatTimestamp(date);
      expect(result).toBe(date.toISOString());
    });

    it('should format string date to ISO string', () => {
      const result = formatTimestamp('2024-03-01');
      expect(result).toBeDefined();
    });

    it('should return null for null input', () => {
      const result = formatTimestamp(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = formatTimestamp(undefined);
      expect(result).toBeNull();
    });
  });

  describe('camelToSnake', () => {
    it('should convert camelCase to snake_case', () => {
      expect(camelToSnake('firstName')).toBe('first_name');
      expect(camelToSnake('userId')).toBe('user_id');
      expect(camelToSnake('trustScore')).toBe('trust_score');
    });

    it('should handle consecutive capitals', () => {
      expect(camelToSnake('userID')).toBe('user_i_d');
    });

    it('should handle all lowercase', () => {
      expect(camelToSnake('name')).toBe('name');
    });
  });

  describe('snakeToCamel', () => {
    it('should convert snake_case to camelCase', () => {
      expect(snakeToCamel('first_name')).toBe('firstName');
      expect(snakeToCamel('user_id')).toBe('userId');
      expect(snakeToCamel('trust_score')).toBe('trustScore');
    });

    it('should handle multiple underscores', () => {
      expect(snakeToCamel('user_id_name')).toBe('userIdName');
    });

    it('should handle no underscores', () => {
      expect(snakeToCamel('name')).toBe('name');
    });
  });

  describe('formatCurrency', () => {
    it('should format GBP by default', () => {
      const result = formatCurrency(1000);
      expect(result).toContain('£');
      expect(result).toContain('1,000');
    });

    it('should format USD when specified', () => {
      const result = formatCurrency(1000, 'USD');
      expect(result).toContain('$');
    });

    it('should format EUR when specified', () => {
      const result = formatCurrency(1000, 'EUR');
      expect(result).toContain('€');
    });

    it('should handle decimal amounts', () => {
      const result = formatCurrency(1000.50);
      expect(result).toContain('1,000.50');
    });
  });

  describe('formatTrustScore', () => {
    it('should return high tier for score >= 700', () => {
      const result = formatTrustScore(750);
      expect(result.score).toBe(750);
      expect(result.tier).toBe('high');
    });

    it('should return medium tier for score 200-699', () => {
      const result = formatTrustScore(500);
      expect(result.tier).toBe('medium');
    });

    it('should return low tier for score < 200', () => {
      const result = formatTrustScore(100);
      expect(result.tier).toBe('low');
    });

    it('should handle boundary values', () => {
      expect(formatTrustScore(700).tier).toBe('high');
      expect(formatTrustScore(699).tier).toBe('medium');
      expect(formatTrustScore(200).tier).toBe('medium');
      expect(formatTrustScore(199).tier).toBe('low');
    });
  });

  describe('sanitizeString', () => {
    it('should escape HTML tags', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeString(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should escape quotes', () => {
      const input = 'value="test"';
      const result = sanitizeString(input);
      expect(result).toContain('&quot;');
    });

    it('should handle null input', () => {
      const result = sanitizeString(null);
      expect(result).toBe('');
    });

    it('should handle undefined input', () => {
      const result = sanitizeString(undefined);
      expect(result).toBe('');
    });

    it('should preserve safe text', () => {
      const input = 'Hello World 123';
      const result = sanitizeString(input);
      expect(result).toBe('Hello World 123');
    });
  });
});
