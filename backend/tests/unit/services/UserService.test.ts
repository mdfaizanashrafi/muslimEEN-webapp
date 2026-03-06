/**
 * User Service Unit Tests
 */

import * as UserService from '../../../src/services/UserService';
import { mockUser, mockUserModel } from '../../mocks/models';

// Mock User model
jest.mock('../../../src/models/User', () => mockUserModel);

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockUserModel.getFullProfile.mockResolvedValue(mockUser);

      const result = await UserService.getProfile('user-123');

      expect(result).toEqual(mockUser);
      expect(mockUserModel.getFullProfile).toHaveBeenCalledWith('user-123');
    });

    it('should throw error if user not found', async () => {
      mockUserModel.getFullProfile.mockResolvedValue(null);

      await expect(UserService.getProfile('nonexistent')).rejects.toThrow(
        new UserService.UserServiceError('USER_NOT_FOUND', 'User not found', 404)
      );
    });
  });

  describe('updateProfile', () => {
    const validUpdates = {
      firstName: 'Updated',
      lastName: 'Name',
      bio: 'Updated bio',
      location: 'New York',
      industry: 'Finance',
      skills: ['React', 'Node'],
    };

    it('should update allowed fields', async () => {
      const updatedUser = { ...mockUser, ...validUpdates };
      mockUserModel.update.mockResolvedValue(updatedUser);

      const result = await UserService.updateProfile('user-123', validUpdates);

      expect(mockUserModel.update).toHaveBeenCalledWith('user-123', validUpdates);
      expect(result.firstName).toBe('Updated');
      expect(result.bio).toBe('Updated bio');
    });

    it('should filter out disallowed fields', async () => {
      const updatesWithDisallowed = {
        ...validUpdates,
        role: 'admin', // Should be filtered
        trustScore: 1000, // Should be filtered
        password: 'hacked', // Should be filtered
      };

      mockUserModel.update.mockResolvedValue(mockUser);

      await UserService.updateProfile('user-123', updatesWithDisallowed);

      // Should only pass allowed fields
      expect(mockUserModel.update).toHaveBeenCalledWith('user-123', {
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'Updated bio',
        location: 'New York',
        industry: 'Finance',
        skills: ['React', 'Node'],
      });
    });

    it('should throw error if update fails', async () => {
      mockUserModel.update.mockResolvedValue(null);

      await expect(UserService.updateProfile('user-123', validUpdates)).rejects.toThrow(
        new UserService.UserServiceError('UPDATE_FAILED', 'Failed to update profile', 500)
      );
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { firstName: 'UpdatedOnly' };
      const updatedUser = { ...mockUser, firstName: 'UpdatedOnly' };
      mockUserModel.update.mockResolvedValue(updatedUser);

      const result = await UserService.updateProfile('user-123', partialUpdate);

      expect(result.firstName).toBe('UpdatedOnly');
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      mockUserModel.update.mockResolvedValue(mockUser);

      await UserService.updateLastLogin('user-123');

      expect(mockUserModel.update).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({ lastLogin: expect.any(Date) })
      );
    });

    it('should not throw on error (fire and forget)', async () => {
      mockUserModel.update.mockRejectedValue(new Error('DB error'));

      await expect(UserService.updateLastLogin('user-123')).resolves.not.toThrow();
    });
  });

  describe('deactivateAccount', () => {
    it('should deactivate user account', async () => {
      const deactivatedUser = { ...mockUser, isActive: false };
      mockUserModel.update.mockResolvedValue(deactivatedUser);

      const result = await UserService.deactivateAccount('user-123');

      expect(mockUserModel.update).toHaveBeenCalledWith('user-123', { isActive: false });
      expect(result.isActive).toBe(false);
    });

    it('should throw error if update fails', async () => {
      mockUserModel.update.mockResolvedValue(null);

      await expect(UserService.deactivateAccount('user-123')).rejects.toThrow(
        new UserService.UserServiceError('UPDATE_FAILED', 'Failed to deactivate account', 500)
      );
    });
  });

  describe('reactivateAccount', () => {
    it('should reactivate user account', async () => {
      const reactivatedUser = { ...mockUser, isActive: true };
      mockUserModel.update.mockResolvedValue(reactivatedUser);

      const result = await UserService.reactivateAccount('user-123');

      expect(mockUserModel.update).toHaveBeenCalledWith('user-123', { isActive: true });
      expect(result.isActive).toBe(true);
    });

    it('should throw error if update fails', async () => {
      mockUserModel.update.mockResolvedValue(null);

      await expect(UserService.reactivateAccount('user-123')).rejects.toThrow(
        new UserService.UserServiceError('UPDATE_FAILED', 'Failed to reactivate account', 500)
      );
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await UserService.getUserStats('user-123');

      expect(result).toEqual({
        connections: 50,
        endorsements: 10,
        profileViews: 100,
      });
    });

    it('should return zeros for missing stats', async () => {
      const userWithoutStats = { ...mockUser, connections: null, endorsements: undefined };
      mockUserModel.findById.mockResolvedValue(userWithoutStats);

      const result = await UserService.getUserStats('user-123');

      expect(result.connections).toBe(0);
      expect(result.endorsements).toBe(0);
    });

    it('should throw error if user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(UserService.getUserStats('nonexistent')).rejects.toThrow(
        new UserService.UserServiceError('USER_NOT_FOUND', 'User not found', 404)
      );
    });
  });

  describe('formatProfileResponse', () => {
    it('should format profile response correctly', () => {
      const response = UserService.formatProfileResponse(mockUser);

      expect(response).toEqual({
        success: true,
        user: mockUser,
      });
    });
  });

  describe('UserServiceError', () => {
    it('should create error with code and status', () => {
      const error = new UserService.UserServiceError('TEST_CODE', 'Test message', 500);
      
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('UserServiceError');
    });

    it('should default status to 400', () => {
      const error = new UserService.UserServiceError('TEST', 'Test');
      expect(error.statusCode).toBe(400);
    });
  });
});
