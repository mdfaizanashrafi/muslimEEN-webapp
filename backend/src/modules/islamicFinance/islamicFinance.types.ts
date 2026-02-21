/**
 * Islamic Finance Module Types
 * MuslimEEN Backend
 */

// Sadaqah (Charity) Types
export interface SadaqahCampaign {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  raisedAmount: number;
  currency: string;
  category: string;
  imageUrl?: string;
  organizerId: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  endsAt?: Date;
}

export interface Donation {
  id: string;
  campaignId: string;
  donorId: string;
  amount: number;
  anonymous: boolean;
  message?: string;
  createdAt: Date;
}

export interface DonationInput {
  amount: number;
  anonymous: boolean;
  message?: string;
}

// Waqf Types
export interface Waqf {
  id: string;
  name: string;
  description: string;
  assetType: string;
  location: string;
  value: number;
  beneficiary: string;
  createdBy: string;
  createdAt: Date;
}

// Qard Hasan Types
export interface QardHasanLoan {
  id: string;
  borrowerId: string;
  title: string;
  description: string;
  amount: number;
  raised: number;
  repaid: number;
  currency: string;
  purpose: string;
  repaymentPeriod: number;
  status: 'pending' | 'funded' | 'repaying' | 'completed';
  lenders: LoanLender[];
  createdAt: Date;
  borrower: {
    id: string;
  };
}

export interface LoanLender {
  userId: string;
  amount: number;
  lentAt: Date;
}

export interface QardHasanCreateInput {
  title: string;
  description: string;
  amount: number;
  currency: string;
  purpose: string;
  repaymentPeriod: number;
  borrowerId: string;
}

export interface LendingInput {
  amount: number;
}

export interface RepaymentInput {
  amount: number;
}

// Zakat Calculator Types
export interface ZakatCalculationInput {
  cash: number;
  gold: number;
  silver: number;
  investments: number;
  businessAssets: number;
  receivables: number;
  liabilities: number;
  currency?: string;
}

export interface ZakatCalculationResult {
  totalAssets: number;
  totalLiabilities: number;
  netWealth: number;
  nisabThreshold: number;
  isZakatDue: boolean;
  zakatAmount: number;
  currency: string;
  calculationDate: Date;
  breakdown: {
    cash: number;
    gold: number;
    silver: number;
    investments: number;
    businessAssets: number;
    receivables: number;
    liabilities: number;
  };
}

// API Response Types
export interface IslamicFinanceResponse<T> {
  success: boolean;
  item?: T;
  items?: T[];
  donation?: Donation;
  calculation?: ZakatCalculationResult;
  message?: string;
}
