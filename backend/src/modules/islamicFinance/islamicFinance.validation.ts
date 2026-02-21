/**
 * Islamic Finance Validation Schemas
 * MuslimEEN Backend
 * Uses Joi/Zod-style validation objects
 */

export const zakatCalculationValidation = {
  cash: {
    type: 'number',
    required: true,
    min: 0,
    description: 'Cash on hand and in bank accounts'
  },
  gold: {
    type: 'number',
    required: true,
    min: 0,
    description: 'Value of gold holdings'
  },
  silver: {
    type: 'number',
    required: true,
    min: 0,
    description: 'Value of silver holdings'
  },
  investments: {
    type: 'number',
    required: true,
    min: 0,
    description: 'Stocks, bonds, and other investments'
  },
  businessAssets: {
    type: 'number',
    required: true,
    min: 0,
    description: 'Business inventory and assets'
  },
  receivables: {
    type: 'number',
    required: true,
    min: 0,
    description: 'Money owed to you'
  },
  liabilities: {
    type: 'number',
    required: true,
    min: 0,
    description: 'Debts and obligations'
  },
  currency: {
    type: 'string',
    required: false,
    default: 'USD',
    description: 'Currency code'
  }
};

export const donationValidation = {
  amount: {
    type: 'number',
    required: true,
    min: 1,
    description: 'Donation amount'
  },
  anonymous: {
    type: 'boolean',
    required: false,
    default: false,
    description: 'Whether to donate anonymously'
  },
  message: {
    type: 'string',
    required: false,
    maxLength: 500,
    description: 'Optional message with donation'
  }
};

export const qardHasanLoanValidation = {
  title: {
    type: 'string',
    required: true,
    minLength: 5,
    maxLength: 100,
    description: 'Loan request title'
  },
  description: {
    type: 'string',
    required: true,
    minLength: 20,
    maxLength: 2000,
    description: 'Detailed description of loan purpose'
  },
  amount: {
    type: 'number',
    required: true,
    min: 1,
    description: 'Loan amount requested'
  },
  currency: {
    type: 'string',
    required: true,
    description: 'Currency code (e.g., USD, GBP, EUR)'
  },
  purpose: {
    type: 'string',
    required: true,
    description: 'Purpose of the loan'
  },
  repaymentPeriod: {
    type: 'number',
    required: true,
    min: 1,
    max: 60,
    description: 'Repayment period in months'
  }
};

export const lendingValidation = {
  amount: {
    type: 'number',
    required: true,
    min: 1,
    description: 'Amount to lend'
  }
};

export const repaymentValidation = {
  amount: {
    type: 'number',
    required: true,
    min: 1,
    description: 'Repayment amount'
  }
};
