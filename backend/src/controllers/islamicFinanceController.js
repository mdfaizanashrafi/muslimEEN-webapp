/**
 * Islamic Finance Controller
 * Handles Sadaqah, Waqf, Qard Hasan, and Zakat
 */

const { Sadaqah, Waqf, QardHasan, ZakatCalculator } = require('../models/IslamicFinance');
const logger = require('../utils/logger');

/**
 * Get Sadaqah campaigns
 * GET /api/islamic-finance/sadaqah
 */
const getSadaqahCampaigns = async (req, res, next) => {
  try {
    const campaigns = await Sadaqah.getAll();

    res.json({
      success: true,
      items: campaigns
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single Sadaqah campaign
 * GET /api/islamic-finance/sadaqah/:id
 */
const getSadaqahCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;

    const campaign = await Sadaqah.getById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Campaign not found'
        }
      });
    }

    res.json({
      success: true,
      item: campaign
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Donate to Sadaqah campaign
 * POST /api/islamic-finance/sadaqah/:id/donate
 */
const donate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, anonymous, message } = req.body;

    const campaign = await Sadaqah.getById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Campaign not found'
        }
      });
    }

    const donation = await Sadaqah.recordDonation(
      id,
      req.user.id,
      amount,
      anonymous,
      message
    );

    logger.info(`Donation: ${amount} to campaign ${id} by ${req.user.id}`);

    res.json({
      success: true,
      donation,
      message: 'Donation recorded successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Waqf listings
 * GET /api/islamic-finance/waqf
 */
const getWaqf = async (req, res, next) => {
  try {
    const waqf = await Waqf.getAll();

    res.json({
      success: true,
      items: waqf
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Qard Hasan loans
 * GET /api/islamic-finance/qardhasan
 */
const getQardHasanLoans = async (req, res, next) => {
  try {
    const loans = await QardHasan.getAll();

    res.json({
      success: true,
      items: loans
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Qard Hasan loan request
 * POST /api/islamic-finance/qardhasan
 */
const createQardHasanLoan = async (req, res, next) => {
  try {
    const loanData = {
      ...req.body,
      borrowerId: req.user.id
    };

    const loan = await QardHasan.create(loanData);

    logger.info(`Qard Hasan loan created: ${loan.id} by ${req.user.id}`);

    res.status(201).json({
      success: true,
      item: loan,
      message: 'Loan request created'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lend to Qard Hasan loan
 * POST /api/islamic-finance/qardhasan/:id/lend
 */
const lendToQardHasan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const loan = await QardHasan.getById(id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Loan not found'
        }
      });
    }

    // Check if user is trying to lend to own loan
    if (loan.borrower.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Cannot lend to your own loan'
        }
      });
    }

    // Check if fully funded
    const remaining = loan.amount - (loan.repaid || 0);
    if (amount > remaining) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'AMOUNT_EXCEEDS_NEED',
          message: 'Lend amount exceeds remaining need'
        }
      });
    }

    const updated = await QardHasan.addLender(id, req.user.id, amount);

    logger.info(`Lend: ${amount} to loan ${id} by ${req.user.id}`);

    res.json({
      success: true,
      item: updated,
      message: 'Lending recorded'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record repayment for Qard Hasan
 * POST /api/islamic-finance/qardhasan/:id/repay
 */
const repayQardHasan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const loan = await QardHasan.getById(id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Loan not found'
        }
      });
    }

    // Check ownership
    if (loan.borrower.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only borrower can make repayments'
        }
      });
    }

    const updated = await QardHasan.recordRepayment(id, amount);

    logger.info(`Repayment: ${amount} on loan ${id} by ${req.user.id}`);

    res.json({
      success: true,
      item: updated,
      message: 'Repayment recorded'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate Zakat
 * POST /api/islamic-finance/zakat/calculate
 */
const calculateZakat = async (req, res, next) => {
  try {
    const calculation = ZakatCalculator.calculate(req.body);

    res.json({
      success: true,
      calculation
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSadaqahCampaigns,
  getSadaqahCampaign,
  donate,
  getWaqf,
  getQardHasanLoans,
  createQardHasanLoan,
  lendToQardHasan,
  repayQardHasan,
  calculateZakat
};
