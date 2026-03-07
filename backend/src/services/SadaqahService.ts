/**
 * Sadaqah (Charity) Service
 * Handles Sadaqah campaign operations and donation processing
 */

import { Sadaqah } from '../models/islamicFinance';
import { IslamicFinanceError } from './IslamicFinanceError';

export interface DonationData {
  campaignId: string;
  donorId: string;
  amount: number;
  anonymous?: boolean;
  message?: string;
}

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
