/**
 * Islamic Finance Service
 * Handles Sadaqah, Waqf, Qard Hasan, and Zakat
 */

import {
  DonationInput,
  QardHasanCreateInput,
  LendingInput,
  RepaymentInput,
  ZakatCalculationInput,
  ZakatCalculationResult
} from './islamicFinance.types';

// Models will be imported from the models directory
const { Sadaqah, Waqf, QardHasan, ZakatCalculator } = require('../../models/IslamicFinance');
const logger = require('../../utils/logger');

export class IslamicFinanceService {
  // ==================== Sadaqah (Charity) ====================

  /**
   * Get all Sadaqah campaigns
   */
  static async getSadaqahCampaigns() {
    return await Sadaqah.getAll();
  }

  /**
   * Get single Sadaqah campaign by ID
   */
  static async getSadaqahCampaign(id: string) {
    return await Sadaqah.getById(id);
  }

  /**
   * Donate to Sadaqah campaign
   */
  static async donate(campaignId: string, userId: string, input: DonationInput) {
    const { amount, anonymous, message } = input;

    const campaign = await Sadaqah.getById(campaignId);

    if (!campaign) {
      throw new CampaignNotFoundError('Campaign not found');
    }

    const donation = await Sadaqah.recordDonation(
      campaignId,
      userId,
      amount,
      anonymous,
      message
    );

    logger.info(`Donation: ${amount} to campaign ${campaignId} by ${userId}`);

    return { donation, campaign };
  }

  // ==================== Waqf ====================

  /**
   * Get all Waqf listings
   */
  static async getWaqf() {
    return await Waqf.getAll();
  }

  // ==================== Qard Hasan ====================

  /**
   * Get all Qard Hasan loans
   */
  static async getQardHasanLoans() {
    return await QardHasan.getAll();
  }

  /**
   * Create Qard Hasan loan request
   */
  static async createQardHasanLoan(input: QardHasanCreateInput) {
    const loanData = {
      ...input,
      borrowerId: input.borrowerId
    };

    const loan = await QardHasan.create(loanData);

    logger.info(`Qard Hasan loan created: ${loan.id} by ${input.borrowerId}`);

    return loan;
  }

  /**
   * Lend to Qard Hasan loan
   */
  static async lendToQardHasan(loanId: string, userId: string, input: LendingInput) {
    const { amount } = input;

    const loan = await QardHasan.getById(loanId);

    if (!loan) {
      throw new LoanNotFoundError('Loan not found');
    }

    // Check if user is trying to lend to own loan
    if (loan.borrower.id === userId) {
      throw new InvalidRequestError('Cannot lend to your own loan');
    }

    // Check if fully funded
    const remaining = loan.amount - (loan.repaid || 0);
    if (amount > remaining) {
      throw new AmountExceedsNeedError('Lend amount exceeds remaining need');
    }

    const updated = await QardHasan.addLender(loanId, userId, amount);

    logger.info(`Lend: ${amount} to loan ${loanId} by ${userId}`);

    return updated;
  }

  /**
   * Record repayment for Qard Hasan
   */
  static async repayQardHasan(loanId: string, userId: string, input: RepaymentInput) {
    const { amount } = input;

    const loan = await QardHasan.getById(loanId);

    if (!loan) {
      throw new LoanNotFoundError('Loan not found');
    }

    // Check ownership
    if (loan.borrower.id !== userId) {
      throw new ForbiddenError('Only borrower can make repayments');
    }

    const updated = await QardHasan.recordRepayment(loanId, amount);

    logger.info(`Repayment: ${amount} on loan ${loanId} by ${userId}`);

    return updated;
  }

  // ==================== Zakat Calculator ====================

  /**
   * Calculate Zakat
   */
  static calculateZakat(input: ZakatCalculationInput): ZakatCalculationResult {
    return ZakatCalculator.calculate(input);
  }
}

// Custom Error Classes
export class CampaignNotFoundError extends Error {
  code = 'NOT_FOUND';
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'CampaignNotFoundError';
  }
}

export class LoanNotFoundError extends Error {
  code = 'NOT_FOUND';
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'LoanNotFoundError';
  }
}

export class InvalidRequestError extends Error {
  code = 'INVALID_REQUEST';
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRequestError';
  }
}

export class AmountExceedsNeedError extends Error {
  code = 'AMOUNT_EXCEEDS_NEED';
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'AmountExceedsNeedError';
  }
}

export class ForbiddenError extends Error {
  code = 'FORBIDDEN';
  statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}
