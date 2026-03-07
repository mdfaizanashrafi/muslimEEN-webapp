/**
 * Auth Service - Response Formatters Tests
 * Tests for response formatter functions
 */

import * as AuthService from '../../../../src/services/AuthService';
import { mockUser } from '../../../mocks/user.mock';

describe('AuthService - Response Formatters', () => {
  const mockAuthResult = {
    user: mockUser,
    token: 'jwt-token',
    csrfToken: 'csrf-token',
  };

  describe('formatLoginResponse', () => {
    it('should format login response correctly', () => {
      const response = AuthService.formatLoginResponse(mockAuthResult);

      expect(response.success).toBe(true);
      expect(response.message).toBe('Login successful');
      expect(response.token).toBe('jwt-token');
      expect(response.csrfToken).toBe('csrf-token');
      expect(response.user).toEqual(mockUser);
    });
  });

  describe('formatRegisterResponse', () => {
    it('should format register response correctly', () => {
      const response = AuthService.formatRegisterResponse(mockAuthResult);

      expect(response.success).toBe(true);
      expect(response.message).toBe('Registration successful');
      expect(response.token).toBe('jwt-token');
      expect(response.csrfToken).toBe('csrf-token');
      expect(response.user).toEqual(mockUser);
    });
  });
});
