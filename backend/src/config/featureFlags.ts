/**
 * Feature Flags Configuration
 * 
 * Controls gradual rollout of new features.
 * Allows safe testing and rollback capability.
 * 
 * DATE: 2026-03-20
 */

import { logger } from '../modules/shared/utils/logger';

// ============================================================================
// FLAG DEFINITIONS
// ============================================================================

export interface FeatureFlags {
  /** Enable Clerk authentication (gradual rollout) */
  USE_CLERK_AUTH: boolean;
  
  /** Enable Clerk webhooks processing */
  USE_CLERK_WEBHOOKS: boolean;
  
  /** Enable magic link authentication for migrated users */
  USE_MAGIC_LINKS: boolean;
  
  /** Enable dual-auth mode (both old and Clerk work) */
  DUAL_AUTH_MODE: boolean;
  
  /** Percentage of users using Clerk (0-100) for gradual rollout */
  CLERK_ROLLOUT_PERCENTAGE: number;
  
  /** CRITICAL: Disable legacy auth completely - ONLY after full migration */
  DISABLE_LEGACY_AUTH: boolean;
  
  /** Enable legacy auth detection middleware */
  ENABLE_LEGACY_AUTH_DETECTION: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_FLAGS: FeatureFlags = {
  USE_CLERK_AUTH: process.env.USE_CLERK_AUTH === 'true',
  USE_CLERK_WEBHOOKS: process.env.USE_CLERK_WEBHOOKS === 'true',
  USE_MAGIC_LINKS: process.env.USE_MAGIC_LINKS !== 'false', // Default true
  DUAL_AUTH_MODE: process.env.DUAL_AUTH_MODE === 'true',
  CLERK_ROLLOUT_PERCENTAGE: parseInt(process.env.CLERK_ROLLOUT_PERCENTAGE || '0', 10),
  DISABLE_LEGACY_AUTH: process.env.DISABLE_LEGACY_AUTH === 'true',
  ENABLE_LEGACY_AUTH_DETECTION: process.env.ENABLE_LEGACY_AUTH_DETECTION !== 'false', // Default true
};

// ============================================================================
// FLAG MANAGEMENT
// ============================================================================

class FeatureFlagManager {
  private flags: FeatureFlags;
  private userClerkEnabled: Set<string> = new Set(); // Cache for gradual rollout

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
   * Check if Clerk auth is enabled for a specific user
   * Supports gradual rollout by user ID
   */
  isClerkEnabledForUser(userId: string): boolean {
    // If fully enabled, all users use Clerk
    if (this.flags.USE_CLERK_AUTH) {
      return true;
    }

    // If dual mode, check if this user is in the rollout
    if (this.flags.DUAL_AUTH_MODE) {
      // Check cache first
      if (this.userClerkEnabled.has(userId)) {
        return true;
      }

      // Check if user ID hash falls within rollout percentage
      const hash = this.hashUserId(userId);
      const inRollout = hash % 100 < this.flags.CLERK_ROLLOUT_PERCENTAGE;
      
      if (inRollout) {
        this.userClerkEnabled.add(userId);
      }
      
      return inRollout;
    }

    return false;
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
   * Set rollout percentage at runtime
   */
  setRolloutPercentage(percentage: number): void {
    this.flags.CLERK_ROLLOUT_PERCENTAGE = Math.max(0, Math.min(100, percentage));
    this.userClerkEnabled.clear(); // Reset cache
    logger.info(`Clerk rollout percentage set to ${this.flags.CLERK_ROLLOUT_PERCENTAGE}%`);
  }

  /**
   * Hash user ID for consistent rollout decisions
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
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

export const isClerkAuthEnabled = (): boolean => featureFlags.isEnabled('USE_CLERK_AUTH');
export const isDualAuthMode = (): boolean => featureFlags.isEnabled('DUAL_AUTH_MODE');
export const isMagicLinksEnabled = (): boolean => featureFlags.isEnabled('USE_MAGIC_LINKS');
export const isClerkWebhooksEnabled = (): boolean => featureFlags.isEnabled('USE_CLERK_WEBHOOKS');
