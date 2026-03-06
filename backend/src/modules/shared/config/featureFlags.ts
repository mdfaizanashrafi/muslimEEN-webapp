/**
 * Feature Flags Configuration
 * Controls gradual migration from legacy to modular architecture
 * 
 * Usage:
 * - Set flags in .env file
 * - All flags default to false (legacy mode)
 * - Enable individually for gradual rollout
 */

export const featureFlags = {
  /**
   * Use modular IAM (Authentication & Identity)
   */
  useModularIAM: process.env.USE_MODULAR_IAM === 'true',

  /**
   * Use modular Profile module
   */
  useModularProfile: process.env.USE_MODULAR_PROFILE === 'true',

  /**
   * Use modular Trust & Verification
   */
  useModularTrust: process.env.USE_MODULAR_TRUST === 'true',

  /**
   * Use modular Network (Connections)
   */
  useModularNetwork: process.env.USE_MODULAR_NETWORK === 'true',

  /**
   * Use modular Notifications
   */
  useModularNotifications: process.env.USE_MODULAR_NOTIFICATIONS === 'true',

  /**
   * Use modular Invitations
   */
  useModularInvitations: process.env.USE_MODULAR_INVITATIONS === 'true',

  /**
   * Use modular Marketplace
   */
  useModularMarketplace: process.env.USE_MODULAR_MARKETPLACE === 'true',

  /**
   * Use modular Islamic Finance
   */
  useModularIslamicFinance: process.env.USE_MODULAR_ISLAMIC_FINANCE === 'true',
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
