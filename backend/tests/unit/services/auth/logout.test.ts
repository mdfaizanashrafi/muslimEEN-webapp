/**
 * Auth Service - Logout Tests
 * Tests for logout functionality
 */

import * as AuthService from '../../../../src/services/AuthService';
import { mockUserModel } from '../../../mocks/user.mock';

// Mock dependencies
jest.mock('../../../../src/models/User', () => mockUserModel);
jest.mock('../../../../src/models/Invitation', () => ({
  validate: jest.fn(),
  accept: jest.fn(),
}));

describe('AuthService - logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve without error', async () => {
    await expect(AuthService.logout('user-123')).resolves.not.toThrow();
  });

  it('should be stateless (no database operation)', async () => {
    await AuthService.logout('user-123');
    expect(mockUserModel.findById).not.toHaveBeenCalled();
  });
});
