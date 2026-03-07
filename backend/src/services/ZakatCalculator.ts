/**
 * Zakat Calculator Service
 * Pure calculation service - no database dependencies
 */

// Nisab type definition
export type NisabType = 'gold' | 'silver';

// Zakat input interface
export interface ZakatInput {
  cash?: number;
  gold?: number;
  silver?: number;
  investments?: number;
  businessAssets?: number;
  debts?: number;
  nisabType?: NisabType;
}

// Zakat distribution interface
export interface ZakatDistribution {
  poor: number;
  needy: number;
  zakatAdministrators: number;
  thoseWhoseHearts: number;
  freeingCaptives: number;
  debtors: number;
  inCauseOfAllah: number;
  wayfarers: number;
}

// Zakat result interface
export interface ZakatResult {
  totalWealth: number;
  deductibleDebts: number;
  zakatableWealth: number;
  nisabThreshold: number;
  zakatPayable: boolean;
  zakatAmount: number;
  distribution: ZakatDistribution;
}

class ZakatCalculator {
  // Current Nisab values (approximate - should be updated regularly)
  public static readonly NISAB_GOLD: number = 85 * 60; // 85g gold at £60/g = £5100
  public static readonly NISAB_SILVER: number = 595 * 0.8; // 595g silver at £0.80/g = £476
  public static readonly ZAKAT_RATE: number = 0.025; // 2.5%

  /**
   * Calculate Zakat based on input data
   * @param data - Zakat input data
   * @returns Zakat calculation result
   */
  public static calculate(data: ZakatInput): ZakatResult {
    const {
      cash = 0,
      gold = 0,
      silver = 0,
      investments = 0,
      businessAssets = 0,
      debts = 0,
      nisabType = 'gold'
    } = data;

    const totalWealth: number = cash + gold + silver + investments + businessAssets;
    const zakatableWealth: number = Math.max(0, totalWealth - debts);
    const nisabThreshold: number = nisabType === 'gold' ? this.NISAB_GOLD : this.NISAB_SILVER;
    const zakatPayable: boolean = zakatableWealth >= nisabThreshold;
    const zakatAmount: number = zakatPayable ? zakatableWealth * this.ZAKAT_RATE : 0;

    // Distribution according to Quranic categories (8 categories)
    const distribution: ZakatDistribution = {
      poor: zakatAmount * 0.125,
      needy: zakatAmount * 0.125,
      zakatAdministrators: zakatAmount * 0.125,
      thoseWhoseHearts: zakatAmount * 0.125,
      freeingCaptives: zakatAmount * 0.125,
      debtors: zakatAmount * 0.125,
      inCauseOfAllah: zakatAmount * 0.125,
      wayfarers: zakatAmount * 0.125
    };

    return {
      totalWealth,
      deductibleDebts: debts,
      zakatableWealth,
      nisabThreshold,
      zakatPayable,
      zakatAmount,
      distribution
    };
  }
}

export { ZakatCalculator };
export default ZakatCalculator;
