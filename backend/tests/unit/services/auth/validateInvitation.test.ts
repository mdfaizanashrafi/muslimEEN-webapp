/**
 * Auth Service - ValidateInvitation Tests
 * Tests for validateInvitation functionality
 */

import * as AuthService from '../../../../src/services/AuthService';
import { mockUserModel } from '../../../mocks/user.mock';

// Mock dependencies
jest.mock('../../../../src/models/User', () => mockUserModel);
jest.mock('../../../../src/models/Invitation', () => ({
  validate: jest.fn(),
  accept: jest.fn(),
}));

describe('AuthService - validateInvitation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return validation result', async () => {
    const { validate } = require('../../../../src/models/Invitation');
    validate.mockResolvedValue({ valid: true, invitation: {} });

    const result = await AuthService.validateInvitation('CODE123');

    expect(result.valid).toBe(true);
  });
});
