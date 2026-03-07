/**
 * Zakat Calculation Service
 * Pure calculation service - no database operations
 */

import { ZakatCalculator } from '../models/islamicFinance';

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
