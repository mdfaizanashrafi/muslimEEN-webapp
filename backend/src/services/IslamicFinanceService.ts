/**
 * Islamic Finance Service
 * Orchestrates Islamic finance operations
 * Coordinates Sadaqah, Qard Hasan, Waqf, and Zakat calculations
 */

import { Sadaqah, QardHasan, ZakatCalculator } from '../models/IslamicFinance';

// ============================================================================
// SADAQAH (CHARITY) OPERATIONS
// ============================================================================

/**
 * Get all active Sadaqah campaigns
 * @returns List of campaigns
 */
export const getSadaqahCampaigns = async () => {
  const campaigns = await Sadaqah.getAll();
  return campaigns;
};

/**
 * Get single Sadaqah campaign by ID
 * @param campaignId Campaign ID
 * @returns Campaign or null
 */
export const getSadaqahCampaign = async (campaignId: string) => {
  const campaign = await Sadaqah.getById(campaignId);
  return campaign;
};

export interface DonationData {
  campaignId: string;
  donorId: string;
  amount: number;
  anonymous?: boolean;
  message?: string;
}

/**
 * Process a donation to a Sadaqah campaign
 * This is a transaction that spans donations and campaigns tables
 * @param data Donation data
 * @returns Created donation
 */
export const processDonation = async (data: DonationData) => {
  const { campaignId, donorId, amount, anonymous = false, message } = data;

  // Validate amount
  if (amount <= 0) {
    throw new IslamicFinanceError('INVALID_AMOUNT', 'Donation amount must be positive', 400);
  }

  // Validate campaign exists
  const campaign = await Sadaqah.getById(campaignId);
  if (!campaign) {
    throw new IslamicFinanceError('CAMPAIGN_NOT_FOUND', 'Campaign not found', 404);
  }

  // Process donation (model handles transaction)
  const donation = await Sadaqah.recordDonation(
    campaignId,
    donorId,
    amount,
    anonymous,
    message || null
  );

  return donation;
};

// ============================================================================
// QARD HASAN (BENEVOLENT LOAN) OPERATIONS
// ============================================================================

export interface CreateLoanData {
  borrowerId: string;
  amount: number;
  purpose: string;
  term: number; // months
}

/**
 * Create a new Qard Hasan loan request
 * @param data Loan data
 * @returns Created loan
 */
export const createQardHasanLoan = async (data: CreateLoanData) => {
  const { borrowerId, amount, purpose, term } = data;

  // Validate amount
  if (amount <= 0) {
    throw new IslamicFinanceError('INVALID_AMOUNT', 'Loan amount must be positive', 400);
  }

  // Validate term
  if (term <= 0 || term > 60) {
    throw new IslamicFinanceError('INVALID_TERM', 'Loan term must be between 1 and 60 months', 400);
  }

  // Validate purpose
  if (!purpose || purpose.length < 10) {
    throw new IslamicFinanceError('INVALID_PURPOSE', 'Purpose must be at least 10 characters', 400);
  }

  const loan = await QardHasan.create({
    borrowerId,
    amount,
    purpose,
    term,
  });

  return loan;
};

/**
 * Get all active Qard Hasan loans
 * @returns List of loans
 */
export const getQardHasanLoans = async () => {
  const loans = await QardHasan.getAll();
  return loans;
};

export interface LendData {
  loanId: string;
  lenderId: string;
  amount: number;
}

/**
 * Add a lender to a Qard Hasan loan
 * If total funding reaches amount, loan status becomes 'active'
 * @param data Lending data
 * @returns Updated loan
 */
export const addLenderToLoan = async (data: LendData) => {
  const { loanId, lenderId, amount } = data;

  // Validate amount
  if (amount <= 0) {
    throw new IslamicFinanceError('INVALID_AMOUNT', 'Lending amount must be positive', 400);
  }

  // Get loan to verify it exists and is funding
  const loan: any = await QardHasan.getById(loanId);
  if (!loan) {
    throw new IslamicFinanceError('LOAN_NOT_FOUND', 'Loan not found', 404);
  }

  if (loan.status !== 'funding') {
    throw new IslamicFinanceError('LOAN_NOT_FUNDING', 'Loan is not open for funding', 400);
  }

  // Check if lender is the borrower
  if (loan.borrower && loan.borrower.id === lenderId) {
    throw new IslamicFinanceError('SELF_FUNDING', 'Cannot fund your own loan', 400);
  }

  // Process lending (model handles transaction and status update)
  const updatedLoan = await QardHasan.addLender(loanId, lenderId, amount);

  return updatedLoan;
};

export interface RepaymentData {
  loanId: string;
  amount: number;
}

/**
 * Record a repayment on a Qard Hasan loan
 * @param data Repayment data
 * @returns Updated loan
 */
export const processRepayment = async (data: RepaymentData) => {
  const { loanId, amount } = data;

  // Validate amount
  if (amount <= 0) {
    throw new IslamicFinanceError('INVALID_AMOUNT', 'Repayment amount must be positive', 400);
  }

  // Get loan
  const loan: any = await QardHasan.getById(loanId);
  if (!loan) {
    throw new IslamicFinanceError('LOAN_NOT_FOUND', 'Loan not found', 404);
  }

  if (loan.status !== 'active' && loan.status !== 'funding') {
    throw new IslamicFinanceError('LOAN_NOT_ACTIVE', 'Loan is not active', 400);
  }

  // Check if repayment exceeds remaining amount
  const remaining = loan.amount - (loan.repaid || 0);
  if (amount > remaining) {
    throw new IslamicFinanceError('OVER_REPAYMENT', `Repayment exceeds remaining amount of ${remaining}`, 400);
  }

  // Process repayment
  const updatedLoan = await QardHasan.recordRepayment(loanId, amount);

  return updatedLoan;
};

// ============================================================================
// ZAKAT CALCULATIONS
// ============================================================================

export interface ZakatInput {
  cash?: number;
  gold?: number;
  silver?: number;
  investments?: number;
  businessAssets?: number;
  debts?: number;
  nisabType?: 'gold' | 'silver';
}

export interface ZakatResult {
  totalWealth: number;
  deductibleDebts: number;
  zakatableWealth: number;
  nisabThreshold: number;
  zakatPayable: boolean;
  zakatAmount: number;
  distribution: {
    poor: number;
    needy: number;
    zakatAdministrators: number;
    thoseWhoseHearts: number;
    freeingCaptives: number;
    debtors: number;
    inCauseOfAllah: number;
    wayfarers: number;
  };
}

/**
 * Calculate Zakat obligation
 * Pure calculation - no database operations
 * @param data Zakat input data
 * @returns Zakat calculation result
 */
export const calculateZakat = (data: ZakatInput): ZakatResult => {
  const result = ZakatCalculator.calculate(data);
  
  return {
    totalWealth: result.totalWealth,
    deductibleDebts: result.deductibleDebts,
    zakatableWealth: result.zakatableWealth,
    nisabThreshold: result.nisabThreshold,
    zakatPayable: result.zakatPayable,
    zakatAmount: result.zakatAmount,
    distribution: result.distribution,
  };
};

// ============================================================================
// WAQF OPERATIONS (Read-only for now)
// ============================================================================

import { Waqf } from '../models/IslamicFinance';

/**
 * Get all Waqf listings
 * @returns List of waqf
 */
export const getWaqfListings = async () => {
  const waqf = await Waqf.getAll();
  return waqf;
};

// ============================================================================
// CUSTOM ERROR
// ============================================================================

export class IslamicFinanceError extends Error {
  public code: string;
  public statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'IslamicFinanceError';
  }
}
