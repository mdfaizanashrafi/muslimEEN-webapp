/**
 * User Model Mock
 * Mock implementations of User model for unit testing
 */

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

export const createMockUser = (overrides = {}) => ({
  ...mockUser,
  ...overrides,
});
