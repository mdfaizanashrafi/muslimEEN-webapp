/**
 * Notification Model Mock
 * Mock implementations of Notification model for unit testing
 */

export const mockNotification = {
  id: 'notif-123',
  userId: 'user-123',
  type: 'connection_request',
  title: 'New Connection Request',
  message: 'Someone wants to connect',
  read: false,
  createdAt: new Date(),
  actor: null,
  actionUrl: '/connections',
  data: null,
};

export const mockNotificationModel = {
  create: jest.fn(),
  getByUser: jest.fn(),
  getUnreadCount: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  delete: jest.fn(),
  createConnectionRequest: jest.fn(),
  createEndorsement: jest.fn(),
  createTrustScoreChange: jest.fn(),
  createVerificationCompleted: jest.fn(),
  TYPES: {
    CONNECTION_REQUEST: 'connection_request',
    CONNECTION_ACCEPTED: 'connection_accepted',
    ENDORSEMENT_RECEIVED: 'endorsement_received',
    TRUST_SCORE_CHANGED: 'trust_score_changed',
    VERIFICATION_COMPLETED: 'verification_completed',
    MESSAGE_RECEIVED: 'message_received',
    MARKETPLACE_INTEREST: 'marketplace_interest',
    DISPUTE_RESOLUTION: 'dispute_resolution',
  },
};

export const createMockNotification = (overrides = {}) => ({
  ...mockNotification,
  ...overrides,
});
