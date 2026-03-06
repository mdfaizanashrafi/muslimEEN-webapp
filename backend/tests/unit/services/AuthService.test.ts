/**
 * Auth Service Unit Tests
 */

import * as AuthService from '../../../src/services/AuthService';
import * as PasswordService from '../../../src/services/PasswordService';
import { mockUser, mockUserModel } from '../../mocks/models';

// Mock dependencies
jest.mock('../../../src/models/User', () => mockUserModel);
jest.mock('../../../src/models/Invitation', () => ({
  validate: jest.fn(),
  accept: jest.fn(),
}));
jest.mock('../../../src/services/PasswordService');

describe('AuthService', () => {
  const MockedPasswordService = PasswordService as jest.Mocked<typeof PasswordService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
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

  describe('register', () => {
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
      const { validate } = require('../../../src/models/Invitation');
      validate.mockResolvedValue(mockInvitation);
      MockedPasswordService.hashPassword.mockResolvedValue('hashedpassword');
    });

    it('should successfully register with valid data', async () => {
      mockUserModel.findByEmail.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);
      const { accept } = require('../../../src/models/Invitation');
      accept.mockResolvedValue({});

      const result = await AuthService.register(validRegistration);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.csrfToken).toBeDefined();
    });

    it('should throw error for invalid invitation', async () => {
      const { validate } = require('../../../src/models/Invitation');
      validate.mockResolvedValue({ valid: false, message: 'Invalid code' });

      await expect(AuthService.register(validRegistration)).rejects.toThrow(
        new AuthService.AuthError('INVALID_INVITATION', 'Invalid code')
      );
    });

    it('should throw error for email mismatch', async () => {
      const { validate } = require('../../../src/models/Invitation');
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
      const { accept } = require('../../../src/models/Invitation');
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

  describe('logout', () => {
    it('should resolve without error', async () => {
      await expect(AuthService.logout('user-123')).resolves.not.toThrow();
    });

    it('should be stateless (no database operation)', async () => {
      await AuthService.logout('user-123');
      expect(mockUserModel.findById).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user profile', async () => {
      mockUserModel.getFullProfile.mockResolvedValue(mockUser);

      const result = await AuthService.getCurrentUser('user-123');

      expect(result).toEqual(mockUser);
      expect(mockUserModel.getFullProfile).toHaveBeenCalledWith('user-123');
    });

    it('should throw error if user not found', async () => {
      mockUserModel.getFullProfile.mockResolvedValue(null);

      await expect(AuthService.getCurrentUser('nonexistent')).rejects.toThrow(
        new AuthService.AuthError('USER_NOT_FOUND', 'User not found')
      );
    });
  });

  describe('validateInvitation', () => {
    it('should return validation result', async () => {
      const { validate } = require('../../../src/models/Invitation');
      validate.mockResolvedValue({ valid: true, invitation: {} });

      const result = await AuthService.validateInvitation('CODE123');

      expect(result.valid).toBe(true);
    });
  });

  describe('AuthError', () => {
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

  describe('Response Formatters', () => {
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
});
