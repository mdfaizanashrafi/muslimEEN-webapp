/**
 * Islamic Finance Service
 * Barrel exports for backward compatibility
 * 
 * This file has been refactored to follow Single Responsibility Principle (SRP).
 * Each service is now in its own file:
 * - SadaqahService.ts - Sadaqah (charity) operations
 * - QardHasanService.ts - Qard Hasan (benevolent loan) operations
 * - WaqfService.ts - Waqf (endowment) operations
 * - ZakatService.ts - Zakat calculation operations
 * - IslamicFinanceError.ts - Shared error class
 */

// Barrel exports for backward compatibility
export * from './SadaqahService';
export * from './QardHasanService';
export * from './WaqfService';
export * from './ZakatService';
export { IslamicFinanceError } from './IslamicFinanceError';
