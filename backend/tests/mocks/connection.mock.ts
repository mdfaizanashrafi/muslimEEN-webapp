/**
 * Connection Model Mock
 * Mock implementations of Connection model for unit testing
 */

export const mockConnection = {
  id: 'conn-123',
  requesterId: 'user-123',
  recipientId: 'user-456',
  status: 'pending',
  createdAt: new Date(),
  acceptedAt: null,
};

export const mockConnectionModel = {
  create: jest.fn(),
  accept: jest.fn(),
  reject: jest.fn(),
  getById: jest.fn(),
  getByUser: jest.fn(),
  getPendingRequests: jest.fn(),
  updateConnectionCounts: jest.fn(),
  getMutualCount: jest.fn(),
  delete: jest.fn(),
};

export const createMockConnection = (overrides = {}) => ({
  ...mockConnection,
  ...overrides,
});
