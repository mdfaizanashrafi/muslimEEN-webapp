/**
 * Auth Service - Register Tests
 * Tests for registration functionality
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

describe('AuthService - register', () => {
  const MockedPasswordService = PasswordService as jest.Mocked<typeof PasswordService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validRegistration = {
    email: 'new@example.com',
    password: 'Password123',
    firstName: 'New',
    lastName: 'User',
    invitationCode: 'INVITE123',
  };

  const mockInvitation = {
    valid: true,
    invitation: { inviteeEmail: 'new@example.com' },
  };

  beforeEach(() => {
    const { validate } = require('../../../../src/models/Invitation');
    validate.mockResolvedValue(mockInvitation);
    MockedPasswordService.hashPassword.mockResolvedValue('hashedpassword');
  });

  it('should successfully register with valid data', async () => {
    mockUserModel.findByEmail.mockResolvedValue(null);
    mockUserModel.create.mockResolvedValue(mockUser);
    const { accept } = require('../../../../src/models/Invitation');
    accept.mockResolvedValue({});

    const result = await AuthService.register(validRegistration);

    expect(result).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.csrfToken).toBeDefined();
  });

  it('should throw error for invalid invitation', async () => {
    const { validate } = require('../../../../src/models/Invitation');
    validate.mockResolvedValue({ valid: false, message: 'Invalid code' });

    await expect(AuthService.register(validRegistration)).rejects.toThrow(
      new AuthService.AuthError('INVALID_INVITATION', 'Invalid code')
    );
  });

  it('should throw error for email mismatch', async () => {
    const { validate } = require('../../../../src/models/Invitation');
    validate.mockResolvedValue({
      valid: true,
      invitation: { inviteeEmail: 'different@example.com' },
    });

    await expect(AuthService.register(validRegistration)).rejects.toThrow(
      new AuthService.AuthError('EMAIL_MISMATCH', 'Email does not match the invitation')
    );
  });

  it('should throw error if user already exists', async () => {
    mockUserModel.findByEmail.mockResolvedValue(mockUser);

    await expect(AuthService.register(validRegistration)).rejects.toThrow(
      new AuthService.AuthError('USER_EXISTS', 'User already exists')
    );
  });

  it('should hash password before creating user', async () => {
    mockUserModel.findByEmail.mockResolvedValue(null);
    mockUserModel.create.mockResolvedValue(mockUser);
    const { accept } = require('../../../../src/models/Invitation');
    accept.mockResolvedValue({});

    await AuthService.register(validRegistration);

    expect(MockedPasswordService.hashPassword).toHaveBeenCalledWith(validRegistration.password);
    expect(mockUserModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        passwordHash: 'hashedpassword',
        role: 'muslim_unverified',
      })
    );
  });
});
