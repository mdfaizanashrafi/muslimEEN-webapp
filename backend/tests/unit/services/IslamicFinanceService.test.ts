/**
 * Islamic Finance Service Unit Tests
 */

import * as IslamicFinanceService from '../../../src/services/IslamicFinanceService';
import { mockSadaqahCampaign, mockQardHasanLoan, mockSadaqahModel, mockQardHasanModel, mockZakatCalculator } from '../../mocks/models';

// Mock models
jest.mock('../../../src/models/IslamicFinance', () => ({
  Sadaqah: mockSadaqahModel,
  QardHasan: mockQardHasanModel,
  ZakatCalculator: mockZakatCalculator,
  Waqf: {
    getAll: jest.fn(),
  },
}));

describe('IslamicFinanceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Sadaqah Operations', () => {
    describe('getSadaqahCampaigns', () => {
      it('should return all campaigns', async () => {
        const mockCampaigns = [mockSadaqahCampaign, { ...mockSadaqahCampaign, id: 'campaign-2' }];
        mockSadaqahModel.getAll.mockResolvedValue(mockCampaigns);

        const result = await IslamicFinanceService.getSadaqahCampaigns();

        expect(result).toEqual(mockCampaigns);
        expect(mockSadaqahModel.getAll).toHaveBeenCalled();
      });
    });

    describe('getSadaqahCampaign', () => {
      it('should return campaign by id', async () => {
        mockSadaqahModel.getById.mockResolvedValue(mockSadaqahCampaign);

        const result = await IslamicFinanceService.getSadaqahCampaign('campaign-123');

        expect(result).toEqual(mockSadaqahCampaign);
        expect(mockSadaqahModel.getById).toHaveBeenCalledWith('campaign-123');
      });

      it('should return null for non-existent campaign', async () => {
        mockSadaqahModel.getById.mockResolvedValue(null);

        const result = await IslamicFinanceService.getSadaqahCampaign('nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('processDonation', () => {
      const validDonation = {
        campaignId: 'campaign-123',
        donorId: 'user-123',
        amount: 100,
        anonymous: false,
        message: 'Great cause!',
      };

      beforeEach(() => {
        mockSadaqahModel.getById.mockResolvedValue(mockSadaqahCampaign);
        mockSadaqahModel.recordDonation.mockResolvedValue({ id: 'donation-1', ...validDonation });
      });

      it('should process valid donation', async () => {
        const result = await IslamicFinanceService.processDonation(validDonation);

        expect(result).toBeDefined();
        expect(mockSadaqahModel.recordDonation).toHaveBeenCalledWith(
          'campaign-123',
          'user-123',
          100,
          false,
          'Great cause!'
        );
      });

      it('should throw error for invalid amount', async () => {
        await expect(IslamicFinanceService.processDonation({ ...validDonation, amount: 0 })).rejects.toThrow(
          new IslamicFinanceService.IslamicFinanceError('INVALID_AMOUNT', 'Donation amount must be positive', 400)
        );
      });

      it('should throw error for negative amount', async () => {
        await expect(IslamicFinanceService.processDonation({ ...validDonation, amount: -50 })).rejects.toThrow(
          new IslamicFinanceService.IslamicFinanceError('INVALID_AMOUNT', 'Donation amount must be positive', 400)
        );
      });

      it('should throw error if campaign not found', async () => {
        mockSadaqahModel.getById.mockResolvedValue(null);

        await expect(IslamicFinanceService.processDonation(validDonation)).rejects.toThrow(
          new IslamicFinanceService.IslamicFinanceError('CAMPAIGN_NOT_FOUND', 'Campaign not found', 404)
        );
      });
    });
  });

  describe('Qard Hasan Operations', () => {
    describe('createQardHasanLoan', () => {
      const validLoan = {
        borrowerId: 'user-123',
        amount: 5000,
        purpose: 'Business equipment purchase for halal catering',
        term: 12,
      };

      beforeEach(() => {
        mockQardHasanModel.create.mockResolvedValue(mockQardHasanLoan);
      });

      it('should create valid loan', async () => {
        const result = await IslamicFinanceService.createQardHasanLoan(validLoan);

        expect(result).toEqual(mockQardHasanLoan);
        expect(mockQardHasanModel.create).toHaveBeenCalledWith(validLoan);
      });

      it('should throw error for invalid amount', async () => {
        await expect(IslamicFinanceService.createQardHasanLoan({ ...validLoan, amount: 0 })).rejects.toThrow(
          new IslamicFinanceService.IslamicFinanceError('INVALID_AMOUNT', 'Loan amount must be positive', 400)
        );
      });

      it('should throw error for invalid term', async () => {
        await expect(IslamicFinanceService.createQardHasanLoan({ ...validLoan, term: 0 })).rejects.toThrow(
          new IslamicFinanceService.IslamicFinanceError('INVALID_TERM', 'Loan term must be between 1 and 60 months', 400)
        );
      });

      it('should throw error for term > 60', async () => {
        await expect(IslamicFinanceService.createQardHasanLoan({ ...validLoan, term: 61 })).rejects.toThrow(
          new IslamicFinanceService.IslamicFinanceError('INVALID_TERM', 'Loan term must be between 1 and 60 months', 400)
        );
      });

      it('should throw error for short purpose', async () => {
        await expect(IslamicFinanceService.createQardHasanLoan({ ...validLoan, purpose: 'Short' })).rejects.toThrow(
          new IslamicFinanceService.IslamicFinanceError('INVALID_PURPOSE', 'Purpose must be at least 10 characters', 400)
        );
      });
    });

    describe('getQardHasanLoans', () => {
      it('should return all loans', async () => {
        const mockLoans = [mockQardHasanLoan, { ...mockQardHasanLoan, id: 'loan-2' }];
        mockQardHasanModel.getAll.mockResolvedValue(mockLoans);

        const result = await IslamicFinanceService.getQardHasanLoans();

        expect(result).toEqual(mockLoans);
      });
    });

    describe('addLenderToLoan', () => {
      const validLending = {
        loanId: 'loan-123',
        lenderId: 'user-456',
        amount: 1000,
      };

      beforeEach(() => {
        mockQardHasanModel.getById.mockResolvedValue(mockQardHasanLoan);
        mockQardHasanModel.addLender.mockResolvedValue({ ...mockQardHasanLoan, lenders: 1 });
      });

      it('should add lender to loan', async () => {
        const result = await IslamicFinanceService.addLenderToLoan(validLending);

        expect(result).toBeDefined();
        expect(mockQardHasanModel.addLender).toHaveBeenCalledWith('loan-123', 'user-456', 1000);
      });

      it('should throw error for invalid amount', async () => {
        await expect(IslamicFinanceService.addLenderToLoan({ ...validLending, amount: 0 })).rejects.toThrow(
          new IslamicFinanceService.IslamicFinanceError('INVALID_AMOUNT', 'Lending amount must be positive', 400)
        );
      });

      it('should throw error if loan not found', async () => {
        mockQardHasanModel.getById.mockResolvedValue(null);

        await expect(IslamicFinanceService.addLenderToLoan(validLending)).rejects.toThrow(
          new IslamicFinanceService.IslamicFinanceError('LOAN_NOT_FOUND', 'Loan not found', 404)
        );
      });

      it('should throw error if loan not funding', async () => {
        mockQardHasanModel.getById.mockResolvedValue({ ...mockQardHasanLoan, status: 'active' });

        await expect(IslamicFinanceService.addLenderToLoan(validLending)).rejects.toThrow(
          new IslamicFinanceService.IslamicFinanceError('LOAN_NOT_FUNDING', 'Loan is not open for funding', 400)
        );
      });

      it('should throw error if lender is borrower', async () => {
        await expect(IslamicFinanceService.addLenderToLoan({ ...validLending, lenderId: 'user-123' })).rejects.toThrow(
          new IslamicFinanceService.IslamicFinanceError('SELF_FUNDING', 'Cannot fund your own loan', 400)
        );
      });
    });

    describe('processRepayment', () => {
      const validRepayment = {
        loanId: 'loan-123',
        amount: 500,
      };

      beforeEach(() => {
        mockQardHasanModel.getById.mockResolvedValue({ ...mockQardHasanLoan, status: 'active', repaid: 0 });
        mockQardHasanModel.recordRepayment.mockResolvedValue({ ...mockQardHasanLoan, repaid: 500 });
      });

      it('should process valid repayment', async () => {
        const result = await IslamicFinanceService.processRepayment(validRepayment);

        expect(result).toBeDefined();
        expect(mockQardHasanModel.recordRepayment).toHaveBeenCalledWith('loan-123', 500);
      });

      it('should throw error for invalid amount', async () => {
        await expect(IslamicFinanceService.processRepayment({ ...validRepayment, amount: 0 })).rejects.toThrow(
          new IslamicFinanceService.IslamicFinanceError('INVALID_AMOUNT', 'Repayment amount must be positive', 400)
        );
      });

      it('should throw error if loan not found', async () => {
        mockQardHasanModel.getById.mockResolvedValue(null);

        await expect(IslamicFinanceService.processRepayment(validRepayment)).rejects.toThrow(
          new IslamicFinanceService.IslamicFinanceError('LOAN_NOT_FOUND', 'Loan not found', 404)
        );
      });

      it('should throw error if repayment exceeds remaining', async () => {
        await expect(IslamicFinanceService.processRepayment({ ...validRepayment, amount: 6000 })).rejects.toThrow(
          new IslamicFinanceService.IslamicFinanceError('OVER_REPAYMENT', 'Repayment exceeds remaining amount of 5000', 400)
        );
      });
    });
  });

  describe('Zakat Calculation', () => {
    beforeEach(() => {
      mockZakatCalculator.calculate.mockReturnValue({
        totalWealth: 36000,
        deductibleDebts: 5000,
        zakatableWealth: 31000,
        nisabThreshold: 5100,
        zakatPayable: true,
        zakatAmount: 775,
        distribution: {
          poor: 96.875,
          needy: 96.875,
          zakatAdministrators: 96.875,
          thoseWhoseHearts: 96.875,
          freeingCaptives: 96.875,
          debtors: 96.875,
          inCauseOfAllah: 96.875,
          wayfarers: 96.875,
        },
      });
    });

    it('should calculate zakat', () => {
      const input = {
        cash: 10000,
        gold: 5000,
        silver: 1000,
        investments: 20000,
        debts: 5000,
      };

      const result = IslamicFinanceService.calculateZakat(input);

      expect(result.zakatPayable).toBe(true);
      expect(result.zakatAmount).toBe(775);
      expect(result.distribution).toBeDefined();
    });

    it('should handle default values', () => {
      const result = IslamicFinanceService.calculateZakat({});

      expect(mockZakatCalculator.calculate).toHaveBeenCalledWith({
        cash: 0,
        gold: 0,
        silver: 0,
        investments: 0,
        businessAssets: 0,
        debts: 0,
        nisabType: 'gold',
      });
    });

    it('should use silver nisab when specified', () => {
      IslamicFinanceService.calculateZakat({ nisabType: 'silver' });

      expect(mockZakatCalculator.calculate).toHaveBeenCalledWith(
        expect.objectContaining({ nisabType: 'silver' })
      );
    });
  });

  describe('getWaqfListings', () => {
    it('should return waqf listings', async () => {
      const { Waqf } = require('../../../src/models/IslamicFinance');
      const mockWaqf = [{ id: 'waqf-1', name: 'Community Center' }];
      Waqf.getAll.mockResolvedValue(mockWaqf);

      const result = await IslamicFinanceService.getWaqfListings();

      expect(result).toEqual(mockWaqf);
    });
  });

  describe('IslamicFinanceError', () => {
    it('should create error with code and status', () => {
      const error = new IslamicFinanceService.IslamicFinanceError('TEST_CODE', 'Test message', 500);
      
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('IslamicFinanceError');
    });

    it('should default status to 400', () => {
      const error = new IslamicFinanceService.IslamicFinanceError('TEST', 'Test');
      expect(error.statusCode).toBe(400);
    });
  });
});
