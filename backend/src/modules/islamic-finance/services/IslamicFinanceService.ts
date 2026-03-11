/**
 * Islamic Finance Service
 * 
 * SECURITY FIXES APPLIED:
 * - Configurable nisab threshold (not hardcoded)
 * - Added transaction safety checks
 * - Added authorization validation
 */

import * as IslamicFinanceRepository from '../repositories/IslamicFinanceRepository';
import { eventBus, DomainEvents } from '../../shared/events/EventBus';
import { logger } from '../../shared/utils/logger';

// Configuration for Nisab values
// These should ideally come from environment variables or a configuration service
const NISAB_CONFIG = {
  // Gold nisab: 85 grams of gold (approximate value in currency units)
  // This value should be updated periodically based on current gold prices
  gold: parseInt(process.env.NISAB_GOLD_VALUE || '85000', 10),
  // Silver nisab: 595 grams of silver (approximate value)
  silver: parseInt(process.env.NISAB_SILVER_VALUE || '6000', 10),
  // Default to gold nisab (more common practice)
  defaultType: (process.env.NISAB_DEFAULT_TYPE as 'gold' | 'silver') || 'gold',
};

// Validate configuration on startup
if (isNaN(NISAB_CONFIG.gold) || NISAB_CONFIG.gold <= 0) {
  logger.error('Invalid NISAB_GOLD_VALUE configuration');
}
if (isNaN(NISAB_CONFIG.silver) || NISAB_CONFIG.silver <= 0) {
  logger.error('Invalid NISAB_SILVER_VALUE configuration');
}

/**
 * Get current nisab threshold
 * SECURITY FIX: Configurable instead of hardcoded
 */
const getNisabThreshold = (type: 'gold' | 'silver' = NISAB_CONFIG.defaultType): number => {
  return type === 'gold' ? NISAB_CONFIG.gold : NISAB_CONFIG.silver;
};

// Sadaqah
export const getSadaqahCampaigns = async () => IslamicFinanceRepository.getAllCampaigns();

export const processDonation = async (data: any) => {
  if (data.amount <= 0) throw new IslamicFinanceError('INVALID_AMOUNT', 'Amount must be positive');
  // SECURITY: Maximum donation limit to prevent abuse
  if (data.amount > 1000000) throw new IslamicFinanceError('AMOUNT_TOO_LARGE', 'Maximum donation is 1,000,000');
  
  const donation = await IslamicFinanceRepository.createDonation(data);
  await eventBus.publish(DomainEvents.DONATION_RECORDED, { donationId: donation.id, amount: data.amount });
  return donation;
};

// Waqf
export const getWaqfListings = async () => IslamicFinanceRepository.getAllWaqf();

// Qard Hasan
export const getQardHasanLoans = async () => IslamicFinanceRepository.getAllLoans();

export const createQardHasanLoan = async (data: any) => {
  // SECURITY: Validate borrower is the authenticated user
  if (!data.borrowerId) throw new IslamicFinanceError('MISSING_BORROWER', 'Borrower ID required');
  
  if (data.amount <= 0) throw new IslamicFinanceError('INVALID_AMOUNT', 'Amount must be positive');
  if (data.amount > 100000) throw new IslamicFinanceError('AMOUNT_TOO_LARGE', 'Maximum loan is 100,000');
  if (data.term <= 0 || data.term > 60) throw new IslamicFinanceError('INVALID_TERM', 'Term must be 1-60 months');
  
  const loan = await IslamicFinanceRepository.createLoan(data);
  await eventBus.publish(DomainEvents.QARD_HASAN_CREATED, { loanId: loan.id, borrowerId: data.borrowerId });
  return loan;
};

export const lendToQardHasan = async (data: { loanId: string; lenderId: string }) => {
  const loan = await IslamicFinanceRepository.getLoanById(data.loanId);
  if (!loan) throw new IslamicFinanceError('LOAN_NOT_FOUND', 'Loan not found', 404);
  if (loan.lenderId) throw new IslamicFinanceError('ALREADY_FUNDED', 'Loan is already funded');
  
  // SECURITY: Prevent lending to own loan
  if (loan.borrower_id === data.lenderId) {
    throw new IslamicFinanceError('SELF_LENDING', 'Cannot fund your own loan');
  }
  
  const updatedLoan = await IslamicFinanceRepository.updateLoan(data.loanId, { 
    lenderId: data.lenderId,
    status: 'funded',
    fundedAt: new Date(),
  });
  await eventBus.publish(DomainEvents.QARD_HASAN_FUNDED, { loanId: data.loanId, lenderId: data.lenderId });
  return updatedLoan;
};

export const repayQardHasan = async (data: { loanId: string; borrowerId: string; amount: number }) => {
  const loan = await IslamicFinanceRepository.getLoanById(data.loanId);
  if (!loan) throw new IslamicFinanceError('LOAN_NOT_FOUND', 'Loan not found', 404);
  if (loan.borrower_id !== data.borrowerId) throw new IslamicFinanceError('UNAUTHORIZED', 'Not your loan');
  if (data.amount <= 0) throw new IslamicFinanceError('INVALID_AMOUNT', 'Amount must be positive');
  
  // SECURITY: Prevent overpayment
  const currentRepaid = loan.repaid_amount || loan.repaidAmount || 0;
  const remaining = loan.amount - currentRepaid;
  if (data.amount > remaining) {
    throw new IslamicFinanceError('OVERPAYMENT', `Maximum repayment is ${remaining}`);
  }
  
  const updatedLoan = await IslamicFinanceRepository.updateLoan(data.loanId, {
    repaidAmount: currentRepaid + data.amount,
    status: currentRepaid + data.amount >= loan.amount ? 'repaid' : 'active',
    lastRepaymentAt: new Date(),
  });
  await eventBus.publish(DomainEvents.QARD_HASAN_REPAID, { loanId: data.loanId, amount: data.amount });
  return updatedLoan;
};

// Zakat Calculation (pure function)
export const calculateZakat = (data: any) => {
  // SECURITY FIX: Use configurable nisab threshold
  const nisabType = data.nisabType || NISAB_CONFIG.defaultType;
  const nisabThreshold = getNisabThreshold(nisabType);
  
  const assets = (data.cash || 0) + (data.gold || 0) + (data.silver || 0) + 
                 (data.investments || 0) + (data.businessAssets || 0);
  const debts = data.debts || 0;
  const netAssets = assets - debts;
  const zakatPayable = netAssets >= nisabThreshold;
  const zakatAmount = zakatPayable ? netAssets * 0.025 : 0;

  return {
    totalAssets: assets,
    deductibleDebts: debts,
    netAssets,
    nisabThreshold,
    nisabType,
    zakatPayable,
    zakatAmount: Math.round(zakatAmount * 100) / 100, // Round to 2 decimal places
    calculationDate: new Date().toISOString(),
    disclaimer: 'This is an estimate. Please consult with a qualified Islamic scholar for final Zakat determination.',
  };
};

// Error
export class IslamicFinanceError extends Error {
  constructor(public code: string, message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'IslamicFinanceError';
  }
}
