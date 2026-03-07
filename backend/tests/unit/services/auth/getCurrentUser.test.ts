/**
 * Auth Service - GetCurrentUser Tests
 * Tests for getCurrentUser functionality
 */

import * as AuthService from '../../../../src/services/AuthService';
import { mockUser, mockUserModel } from '../../../mocks/user.mock';

// Mock dependencies
jest.mock('../../../../src/models/User', () => mockUserModel);
jest.mock('../../../../src/models/Invitation', () => ({
  validate: jest.fn(),
  accept: jest.fn(),
}));

describe('AuthService - getCurrentUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
