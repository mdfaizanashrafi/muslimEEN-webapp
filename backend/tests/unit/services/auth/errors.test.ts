/**
 * Auth Service - AuthError Tests
 * Tests for AuthError class
 */

import * as AuthService from '../../../../src/services/AuthService';

describe('AuthService - AuthError', () => {
  it('should create error with code and status', () => {
    const error = new AuthService.AuthError('TEST_CODE', 'Test message', 418);
    
    expect(error.code).toBe('TEST_CODE');
    expect(error.message).toBe('Test message');
    expect(error.statusCode).toBe(418);
    expect(error.name).toBe('AuthError');
  });

  it('should default status to 400', () => {
    const error = new AuthService.AuthError('TEST', 'Test');
    expect(error.statusCode).toBe(400);
  });
});
