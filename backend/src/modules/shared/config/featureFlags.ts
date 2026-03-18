/**
 * Feature Flags Configuration
 * Controls gradual migration from legacy to modular architecture
 * 
 * Usage:
 * - Set flags in .env file
 * - All flags default to false (legacy mode)
 * - Enable individually for gradual rollout
 */

import { env } from '../../../config/env';

export const featureFlags = {
  /**
   * Use modular IAM (Authentication & Identity)
   */
  useModularIAM: env.USE_MODULAR_IAM,

  /**
   * Use modular Profile module
   */
  useModularProfile: env.USE_MODULAR_PROFILE,

  /**
   * Use modular Trust & Verification
   */
  useModularTrust: env.USE_MODULAR_TRUST,

  /**
   * Use modular Network (Connections)
   */
  useModularNetwork: env.USE_MODULAR_NETWORK,

  /**
   * Use modular Notifications
   */
  useModularNotifications: env.USE_MODULAR_NOTIFICATIONS,

  /**
   * Use modular Invitations
   */
  useModularInvitations: env.USE_MODULAR_INVITATIONS,

  /**
   * Use modular Marketplace
   */
  useModularMarketplace: env.USE_MODULAR_MARKETPLACE,

  /**
   * Use modular Islamic Finance
   */
  useModularIslamicFinance: env.USE_MODULAR_ISLAMIC_FINANCE,
};

/**
 * Check if all modules are migrated (for cleanup verification)
 */
export const isFullyMigrated = (): boolean => {
  return Object.values(featureFlags).every(flag => flag === true);
};

/**
 * Get migration status report
 */
export const getMigrationStatus = (): Record<string, boolean> => {
  return { ...featureFlags };
};
