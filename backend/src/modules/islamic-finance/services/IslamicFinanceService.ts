/**
 * Islamic Finance Service
 */

import * as IslamicFinanceRepository from '../repositories/IslamicFinanceRepository';
import { eventBus, DomainEvents } from '../../shared/events/EventBus';

// Sadaqah
export const getSadaqahCampaigns = async () => IslamicFinanceRepository.getAllCampaigns();

export const processDonation = async (data: any) => {
  if (data.amount <= 0) throw new IslamicFinanceError('INVALID_AMOUNT', 'Amount must be positive');
  const donation = await IslamicFinanceRepository.createDonation(data);
  await eventBus.publish(DomainEvents.DONATION_RECORDED, { donationId: donation.id, amount: data.amount });
  return donation;
};

// Waqf
export const getWaqfListings = async () => IslamicFinanceRepository.getAllWaqf();

// Qard Hasan
export const getQardHasanLoans = async () => IslamicFinanceRepository.getAllLoans();

export const createQardHasanLoan = async (data: any) => {
  if (data.amount <= 0) throw new IslamicFinanceError('INVALID_AMOUNT', 'Amount must be positive');
  if (data.term <= 0 || data.term > 60) throw new IslamicFinanceError('INVALID_TERM', 'Term must be 1-60 months');
  return IslamicFinanceRepository.createLoan(data);
};

// Zakat Calculation (pure function)
export const calculateZakat = (data: any) => {
  const nisabGold = 85000; // Approximate gold nisab in currency units
  const assets = (data.cash || 0) + (data.gold || 0) + (data.silver || 0) + 
                 (data.investments || 0) + (data.businessAssets || 0);
  const debts = data.debts || 0;
  const netAssets = assets - debts;
  const zakatPayable = netAssets >= nisabGold;
  const zakatAmount = zakatPayable ? netAssets * 0.025 : 0;

  return {
    totalAssets: assets,
    deductibleDebts: debts,
    netAssets,
    nisabThreshold: nisabGold,
    zakatPayable,
    zakatAmount,
  };
};

// Error
export class IslamicFinanceError extends Error {
  constructor(public code: string, message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'IslamicFinanceError';
  }
}
