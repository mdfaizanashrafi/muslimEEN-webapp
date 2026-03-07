/**
 * Test Mocks Index
 * Barrel exports for all mock modules
 */

// User mocks
export {
  mockUser,
  mockUserModel,
  createMockUser,
} from './user.mock';

// Connection mocks
export {
  mockConnection,
  mockConnectionModel,
  createMockConnection,
} from './connection.mock';

// Invitation mocks
export {
  mockInvitation,
  mockInvitationModel,
  createMockInvitation,
} from './invitation.mock';

// Notification mocks
export {
  mockNotification,
  mockNotificationModel,
  createMockNotification,
} from './notification.mock';

// Trust score mocks
export {
  mockTrustScoreModel,
} from './trust-score.mock';

// Islamic finance mocks
export {
  mockSadaqahCampaign,
  mockSadaqahModel,
  mockQardHasanLoan,
  mockQardHasanModel,
  mockZakatCalculator,
} from './islamic-finance.mock';
