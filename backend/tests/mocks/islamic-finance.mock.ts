/**
 * Islamic Finance Models Mock
 * Mock implementations of Islamic Finance models for unit testing
 */

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
