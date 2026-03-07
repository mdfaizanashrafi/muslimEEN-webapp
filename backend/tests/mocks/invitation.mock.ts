/**
 * Invitation Model Mock
 * Mock implementations of Invitation model for unit testing
 */

export const mockInvitation = {
  id: 'inv-123',
  code: 'ABC123XYZ',
  inviterId: 'user-123',
  inviteeEmail: 'invited@example.com',
  status: 'pending',
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  acceptedAt: null,
};

export const mockInvitationModel = {
  create: jest.fn(),
  findByCode: jest.fn(),
  validate: jest.fn(),
  accept: jest.fn(),
  getByInviter: jest.fn(),
  countPendingByInviter: jest.fn(),
  revoke: jest.fn(),
  recordOutcome: jest.fn(),
  cleanupExpired: jest.fn(),
};

export const createMockInvitation = (overrides = {}) => ({
  ...mockInvitation,
  ...overrides,
});
