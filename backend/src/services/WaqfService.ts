/**
 * Waqf (Endowment) Service
 * Handles Waqf listing operations
 */

import { Waqf } from '../models/islamicFinance';

/**
 * Get all Waqf listings
 * @returns List of waqf
 */
export const getWaqfListings = async () => {
  const waqf = await Waqf.getAll();
  return waqf;
};
