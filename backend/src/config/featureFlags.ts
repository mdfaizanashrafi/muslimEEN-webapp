/**
 * Feature Flags Configuration
 * 
 * SIMPLIFIED: Clerk is now the only authentication method.
 * Legacy authentication has been completely removed.
 * 
 * DATE: 2026-03-20
 */

import { logger } from '../modules/shared/utils/logger';

// ============================================================================
// FLAG DEFINITIONS
// ============================================================================

export interface FeatureFlags {
  /** Enable Clerk webhooks processing */
  USE_CLERK_WEBHOOKS: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_FLAGS: FeatureFlags = {
  USE_CLERK_WEBHOOKS: process.env.USE_CLERK_WEBHOOKS === 'true',
};

// ============================================================================
// FLAG MANAGEMENT
// ============================================================================

class FeatureFlagManager {
  private flags: FeatureFlags;

  constructor() {
    this.flags = { ...DEFAULT_FLAGS };
    this.logFlags();
  }

  /**
   * Get current feature flags
   */
  getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Check if a flag is enabled
   */
  isEnabled(flagName: keyof FeatureFlags): boolean {
    return this.flags[flagName] as boolean;
  }

  /**
   * Enable a flag at runtime
   */
  enable(flagName: keyof FeatureFlags): void {
    (this.flags as any)[flagName] = true;
    logger.info(`Feature flag enabled: ${flagName}`);
  }

  /**
   * Disable a flag at runtime
   */
  disable(flagName: keyof FeatureFlags): void {
    (this.flags as any)[flagName] = false;
    logger.info(`Feature flag disabled: ${flagName}`);
  }

  /**
   * Log current flag states
   */
  private logFlags(): void {
    logger.info('Feature Flags Configuration:', this.flags as unknown as Record<string, unknown>);
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const featureFlags = new FeatureFlagManager();

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const isClerkWebhooksEnabled = (): boolean => featureFlags.isEnabled('USE_CLERK_WEBHOOKS');
