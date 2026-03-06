/**
 * Model Mocks
 * Mock implementations of database models for unit testing
 */

// ============================================================================
// USER MODEL MOCK
// ============================================================================

export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  passwordHash: 'hashedpassword123',
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
  role: 'muslim_verified',
  verificationTier: 'full',
  trustScore: 750,
  bio: 'Test bio',
  location: 'London, UK',
  industry: 'Technology',
  skills: ['JavaScript', 'TypeScript'],
  endorsements: 10,
  connections: 50,
  profileViews: 100,
  isWitnessEligible: true,
  isActive: true,
  badges: ['biometric', 'two_witness'],
  createdAt: new Date('2024-01-01'),
  lastLogin: new Date('2024-03-01'),
};

export const mockUserModel = {
  create: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  getFullProfile: jest.fn(),
  updateTrustScore: jest.fn(),
  getTrustScoreHistory: jest.fn(),
  verifyPassword: jest.fn(),
};

// ============================================================================
// CONNECTION MODEL MOCK
// ============================================================================

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

// ============================================================================
// INVITATION MODEL MOCK
// ============================================================================

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

// ============================================================================
// NOTIFICATION MODEL MOCK
// ============================================================================

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

// ============================================================================
// TRUST SCORE MODEL MOCK
// ============================================================================

export const mockTrustScoreModel = {
  calculate: jest.fn(),
  calculateProfileCompleteness: jest.fn(),
  getVerificationPoints: jest.fn(),
  recalculate: jest.fn(),
  getUserMetrics: jest.fn(),
  MAX_SCORE: 1000,
  MIN_SCORE: 0,
  POINTS: {
    PROFILE_COMPLETENESS_MAX: 100,
    CONNECTION_QUALITY_MAX: 50,
    COMMUNITY_CONTRIBUTIONS_MAX: 50,
    VERIFICATION_BASIC: 50,
    VERIFICATION_FULL: 100,
    VERIFICATION_BUSINESS: 150,
    ENDORSEMENT_MAX: 100,
    SUCCESSFUL_INVITE: 10,
    FAILED_INVITE: -50,
  },
};

// ============================================================================
// ISLAMIC FINANCE MODELS MOCK
// ============================================================================

export const mockSadaqahCampaign = {
  id: 'campaign-123',
  name: 'Emergency Relief',
  organization: 'Muslim Aid',
  description: 'Helping those in need',
  goal: 100000,
  raised: 50000,
  donors: 100,
  daysLeft: 15,
  category: 'emergency',
  verified: true,
};

export const mockSadaqahModel = {
  create: jest.fn(),
  getAll: jest.fn(),
  getById: jest.fn(),
  recordDonation: jest.fn(),
};

export const mockQardHasanLoan = {
  id: 'loan-123',
  borrower: {
    id: 'user-123',
    name: 'Test User',
    trustScore: 750,
    verified: true,
  },
  amount: 5000,
  purpose: 'Business equipment',
  term: 12,
  repaid: 0,
  lenders: 0,
  status: 'funding',
};

export const mockQardHasanModel = {
  create: jest.fn(),
  getAll: jest.fn(),
  getById: jest.fn(),
  addLender: jest.fn(),
  recordRepayment: jest.fn(),
};

export const mockZakatCalculator = {
  calculate: jest.fn(),
  NISAB_GOLD: 5100,
  NISAB_SILVER: 476,
  ZAKAT_RATE: 0.025,
};

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export const createMockUser = (overrides = {}) => ({
  ...mockUser,
  ...overrides,
});

export const createMockConnection = (overrides = {}) => ({
  ...mockConnection,
  ...overrides,
});

export const createMockInvitation = (overrides = {}) => ({
  ...mockInvitation,
  ...overrides,
});

export const createMockNotification = (overrides = {}) => ({
  ...mockNotification,
  ...overrides,
});
