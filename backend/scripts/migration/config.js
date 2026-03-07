/**
 * Migration configuration
 * Module definitions and phase configurations
 */

// Module definitions with risk levels
const modules = {
  iam: {
    flag: 'USE_MODULAR_IAM',
    risk: 'low',
    description: 'Authentication & Identity',
    order: 1,
  },
  profile: {
    flag: 'USE_MODULAR_PROFILE',
    risk: 'low',
    description: 'User Profiles',
    order: 2,
  },
  trust: {
    flag: 'USE_MODULAR_TRUST',
    risk: 'medium',
    description: 'Trust Scores & Verification',
    order: 3,
  },
  network: {
    flag: 'USE_MODULAR_NETWORK',
    risk: 'medium',
    description: 'Network Connections',
    order: 4,
  },
  marketplace: {
    flag: 'USE_MODULAR_MARKETPLACE',
    risk: 'medium',
    description: 'Marketplace Listings',
    order: 5,
  },
  islamicFinance: {
    flag: 'USE_MODULAR_ISLAMIC_FINANCE',
    risk: 'medium',
    description: 'Islamic Finance Tools',
    order: 6,
  },
  invitations: {
    flag: 'USE_MODULAR_INVITATIONS',
    risk: 'low',
    description: 'Invitation Management',
    order: 7,
  },
  notifications: {
    flag: 'USE_MODULAR_NOTIFICATIONS',
    risk: 'high',
    description: 'Notification Delivery',
    order: 8,
  },
};

// Phase configurations
const phases = {
  phase0: {
    name: 'Verification',
    description: 'Verify migration readiness without enabling any modules',
    modules: {},
  },
  phase1: {
    name: 'Phase 1: Core Auth',
    description: 'Enable IAM module only (lowest risk)',
    modules: { iam: true },
  },
  phase2: {
    name: 'Phase 2: User Data',
    description: 'Enable Profile and Trust modules',
    modules: { iam: true, profile: true, trust: true },
  },
  phase3: {
    name: 'Phase 3: Social & Commerce',
    description: 'Enable Network and Marketplace',
    modules: { iam: true, profile: true, trust: true, network: true, marketplace: true },
  },
  phase4: {
    name: 'Phase 4: Finance & Invitations',
    description: 'Enable Islamic Finance and Invitations',
    modules: {
      iam: true, profile: true, trust: true, network: true, marketplace: true,
      islamicFinance: true, invitations: true,
    },
  },
  phase5: {
    name: 'Phase 5: Notifications',
    description: 'Enable Notifications (highest risk)',
    modules: {
      iam: true, profile: true, trust: true, network: true, marketplace: true,
      islamicFinance: true, invitations: true, notifications: true,
    },
  },
  full: {
    name: 'Full Migration',
    description: 'Enable all modules',
    modules: {
      iam: true, profile: true, trust: true, network: true, marketplace: true,
      islamicFinance: true, invitations: true, notifications: true,
    },
  },
  reset: {
    name: 'Reset to Legacy',
    description: 'Disable all modular implementations',
    modules: {
      iam: false, profile: false, trust: false, network: false, marketplace: false,
      islamicFinance: false, invitations: false, notifications: false,
    },
  },
};

module.exports = {
  modules,
  phases,
};
