/**
 * Auth Service - Login Tests
 * Tests for login functionality
 */

import * as AuthService from '../../../../src/services/AuthService';
import * as PasswordService from '../../../../src/services/PasswordService';
import { mockUser, mockUserModel } from '../../../mocks/user.mock';

// Mock dependencies
jest.mock('../../../../src/models/User', () => mockUserModel);
jest.mock('../../../../src/models/Invitation', () => ({
  validate: jest.fn(),
  accept: jest.fn(),
}));
jest.mock('../../../../src/services/PasswordService');

describe('AuthService - login', () => {
  const MockedPasswordService = PasswordService as jest.Mocked<typeof PasswordService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validCredentials = {
    email: 'test@example.com',
    password: 'Password123',
  };

  it('should successfully login with valid credentials', async () => {
    const userWithPassword = { ...mockUser, passwordHash: 'hashedpassword' };
    mockUserModel.findByEmail.mockResolvedValue(userWithPassword);
    MockedPasswordService.verifyPassword.mockResolvedValue(true);
    mockUserModel.update.mockResolvedValue(userWithPassword);

    const result = await AuthService.login(validCredentials);

    expect(result).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.csrfToken).toBeDefined();
    expect(result.user.email).toBe(validCredentials.email);
  });

  it('should throw error for non-existent user', async () => {
    mockUserModel.findByEmail.mockResolvedValue(null);

    await expect(AuthService.login(validCredentials)).rejects.toThrow(
      new AuthService.AuthError('INVALID_CREDENTIALS', 'Invalid email or password')
    );
  });

  it('should throw error for incorrect password', async () => {
    const userWithPassword = { ...mockUser, passwordHash: 'hashedpassword' };
    mockUserModel.findByEmail.mockResolvedValue(userWithPassword);
    MockedPasswordService.verifyPassword.mockResolvedValue(false);

    await expect(AuthService.login(validCredentials)).rejects.toThrow(
      new AuthService.AuthError('INVALID_CREDENTIALS', 'Invalid email or password')
    );
  });

  it('should throw error for inactive account', async () => {
    const inactiveUser = { ...mockUser, passwordHash: 'hashedpassword', isActive: false };
    mockUserModel.findByEmail.mockResolvedValue(inactiveUser);
    MockedPasswordService.verifyPassword.mockResolvedValue(true);

    await expect(AuthService.login(validCredentials)).rejects.toThrow(
      new AuthService.AuthError('ACCOUNT_DISABLED', 'Account has been disabled')
    );
  });

  it('should update last login on successful login', async () => {
    const userWithPassword = { ...mockUser, passwordHash: 'hashedpassword' };
    mockUserModel.findByEmail.mockResolvedValue(userWithPassword);
    MockedPasswordService.verifyPassword.mockResolvedValue(true);
    mockUserModel.update.mockResolvedValue(userWithPassword);

    await AuthService.login(validCredentials);

    expect(mockUserModel.update).toHaveBeenCalledWith(
      mockUser.id,
      expect.objectContaining({ lastLogin: expect.any(Date) })
    );
  });

  it('should not expose password hash in result', async () => {
    const userWithPassword = { ...mockUser, passwordHash: 'hashedpassword' };
    mockUserModel.findByEmail.mockResolvedValue(userWithPassword);
    MockedPasswordService.verifyPassword.mockResolvedValue(true);
    mockUserModel.update.mockResolvedValue(userWithPassword);

    const result = await AuthService.login(validCredentials);

    expect(result.user).not.toHaveProperty('passwordHash');
  });
});
