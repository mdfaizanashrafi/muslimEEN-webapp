/**
 * Qard Hasan (Benevolent Loan) Service
 * Handles Qard Hasan loan operations including creation, funding, and repayment
 */

import { QardHasan } from '../models/islamicFinance';
import { IslamicFinanceError } from './IslamicFinanceError';

export interface CreateLoanData {
  borrowerId: string;
  amount: number;
  purpose: string;
  term: number; // months
}

export interface LendData {
  loanId: string;
  lenderId: string;
  amount: number;
}

export interface RepaymentData {
  loanId: string;
  amount: number;
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
