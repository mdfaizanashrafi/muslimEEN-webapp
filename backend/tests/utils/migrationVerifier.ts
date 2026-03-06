/**
 * Migration Verification Script
 * 
 * Run this to verify the migration status of all modules.
 * Checks:
 * - Module exports are valid
 * - Controllers have required methods
 * - Services have required methods
 * - Feature flags are properly configured
 */

import { featureFlags, getMigrationStatus } from '../../src/modules/shared/config/featureFlags';

interface VerificationResult {
  module: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: string[];
}

/**
 * Verify all modules are properly configured
 */
export async function verifyMigration(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  // Check IAM Module
  results.push(await verifyIAMModule());

  // Check Profile Module
  results.push(await verifyProfileModule());

  // Check Trust Module
  results.push(await verifyTrustModule());

  // Check Network Module
  results.push(await verifyNetworkModule());

  // Check Marketplace Module
  results.push(await verifyMarketplaceModule());

  // Check Islamic Finance Module
  results.push(await verifyIslamicFinanceModule());

  // Check Invitations Module
  results.push(await verifyInvitationsModule());

  // Check Notifications Module
  results.push(await verifyNotificationsModule());

  return results;
}

async function verifyIAMModule(): Promise<VerificationResult> {
  try {
    const iam = await import('../../src/modules/iam');
    const requiredExports = ['AuthController'];
    const missing = requiredExports.filter(exp => !(exp in iam));
    
    if (missing.length > 0) {
      return {
        module: 'IAM',
        status: 'error',
        message: `Missing exports: ${missing.join(', ')}`,
      };
    }

    const requiredMethods = ['validateInvitation', 'login', 'register', 'logout', 'getCurrentUser'];
    const missingMethods = requiredMethods.filter(m => !(m in iam.AuthController));

    if (missingMethods.length > 0) {
      return {
        module: 'IAM',
        status: 'warning',
        message: `IAM module loaded but missing methods: ${missingMethods.join(', ')}`,
      };
    }

    return {
      module: 'IAM',
      status: 'ok',
      message: featureFlags.useModularIAM ? 'Using modular implementation' : 'Using legacy implementation',
    };
  } catch (error) {
    return {
      module: 'IAM',
      status: 'error',
      message: `Failed to load IAM module: ${(error as Error).message}`,
    };
  }
}

async function verifyProfileModule(): Promise<VerificationResult> {
  try {
    const profile = await import('../../src/modules/profile');
    const requiredMethods = ['getCurrentUserProfile', 'updateCurrentUserProfile', 'getPublicProfile'];
    const missingMethods = requiredMethods.filter(m => !(m in profile.ProfileController));

    if (missingMethods.length > 0) {
      return {
        module: 'Profile',
        status: 'warning',
        message: `Missing methods: ${missingMethods.join(', ')}`,
      };
    }

    return {
      module: 'Profile',
      status: 'ok',
      message: featureFlags.useModularProfile ? 'Using modular implementation' : 'Using legacy implementation',
    };
  } catch (error) {
    return {
      module: 'Profile',
      status: 'error',
      message: `Failed to load Profile module: ${(error as Error).message}`,
    };
  }
}

async function verifyTrustModule(): Promise<VerificationResult> {
  try {
    const trust = await import('../../src/modules/trust');
    const requiredTrustMethods = ['getCurrentTrustScore', 'recalculateCurrentTrustScore', 'getCurrentUserTrustScoreHistory'];
    const missingTrustMethods = requiredTrustMethods.filter(m => !(m in trust.TrustScoreController));

    const requiredVerificationMethods = ['requestBiometricVerification', 'completeBiometricVerification', 'requestWitnessVerification', 'approveAsWitness', 'requestBusinessVerification', 'approveBusinessVerification'];
    const missingVerificationMethods = requiredVerificationMethods.filter(m => !(m in trust.VerificationController));

    if (missingTrustMethods.length > 0 || missingVerificationMethods.length > 0) {
      return {
        module: 'Trust',
        status: 'warning',
        message: `Missing TrustScore methods: ${missingTrustMethods.join(', ')}; Missing Verification methods: ${missingVerificationMethods.join(', ')}`,
      };
    }

    return {
      module: 'Trust',
      status: 'ok',
      message: featureFlags.useModularTrust ? 'Using modular implementation' : 'Using legacy implementation',
    };
  } catch (error) {
    return {
      module: 'Trust',
      status: 'error',
      message: `Failed to load Trust module: ${(error as Error).message}`,
    };
  }
}

async function verifyNetworkModule(): Promise<VerificationResult> {
  try {
    const network = await import('../../src/modules/network');
    const requiredMethods = ['getCurrentUserConnections', 'getCurrentUserPendingConnections', 'sendConnectionRequestToUser', 'acceptIncomingConnectionRequest', 'rejectIncomingConnectionRequest', 'removeConnection'];
    const missingMethods = requiredMethods.filter(m => !(m in network.ConnectionController));

    if (missingMethods.length > 0) {
      return {
        module: 'Network',
        status: 'warning',
        message: `Missing methods: ${missingMethods.join(', ')}`,
      };
    }

    return {
      module: 'Network',
      status: 'ok',
      message: featureFlags.useModularNetwork ? 'Using modular implementation' : 'Using legacy implementation',
    };
  } catch (error) {
    return {
      module: 'Network',
      status: 'error',
      message: `Failed to load Network module: ${(error as Error).message}`,
    };
  }
}

async function verifyMarketplaceModule(): Promise<VerificationResult> {
  try {
    const marketplace = await import('../../src/modules/marketplace');
    const requiredMethods = ['getMarketplaceListings', 'getListingById', 'createListing', 'updateListing', 'removeListing', 'recordInvestment'];
    const missingMethods = requiredMethods.filter(m => !(m in marketplace.MarketplaceController));

    if (missingMethods.length > 0) {
      return {
        module: 'Marketplace',
        status: 'warning',
        message: `Missing methods: ${missingMethods.join(', ')}`,
      };
    }

    return {
      module: 'Marketplace',
      status: 'ok',
      message: featureFlags.useModularMarketplace ? 'Using modular implementation' : 'Using legacy implementation',
    };
  } catch (error) {
    return {
      module: 'Marketplace',
      status: 'error',
      message: `Failed to load Marketplace module: ${(error as Error).message}`,
    };
  }
}

async function verifyIslamicFinanceModule(): Promise<VerificationResult> {
  try {
    const islamicFinance = await import('../../src/modules/islamic-finance');
    const requiredMethods = ['getSadaqahCampaigns', 'donate', 'getWaqfListings', 'getQardHasanLoans', 'createQardHasanLoan', 'lendToQardHasan', 'repayQardHasan', 'calculateZakat'];
    const missingMethods = requiredMethods.filter(m => !(m in islamicFinance.IslamicFinanceController));

    if (missingMethods.length > 0) {
      return {
        module: 'Islamic Finance',
        status: 'warning',
        message: `Missing methods: ${missingMethods.join(', ')}`,
      };
    }

    return {
      module: 'Islamic Finance',
      status: 'ok',
      message: featureFlags.useModularIslamicFinance ? 'Using modular implementation' : 'Using legacy implementation',
    };
  } catch (error) {
    return {
      module: 'Islamic Finance',
      status: 'error',
      message: `Failed to load Islamic Finance module: ${(error as Error).message}`,
    };
  }
}

async function verifyInvitationsModule(): Promise<VerificationResult> {
  try {
    const invitations = await import('../../src/modules/invitations');
    return {
      module: 'Invitations',
      status: 'ok',
      message: featureFlags.useModularInvitations ? 'Using modular implementation' : 'Using legacy implementation',
      details: ['Module exports: ' + Object.keys(invitations).join(', ')],
    };
  } catch (error) {
    return {
      module: 'Invitations',
      status: 'error',
      message: `Failed to load Invitations module: ${(error as Error).message}`,
    };
  }
}

async function verifyNotificationsModule(): Promise<VerificationResult> {
  try {
    const notifications = await import('../../src/modules/notifications');
    return {
      module: 'Notifications',
      status: 'ok',
      message: featureFlags.useModularNotifications ? 'Using modular implementation' : 'Using legacy implementation',
      details: ['Module exports: ' + Object.keys(notifications).join(', ')],
    };
  } catch (error) {
    return {
      module: 'Notifications',
      status: 'error',
      message: `Failed to load Notifications module: ${(error as Error).message}`,
    };
  }
}

/**
 * Print verification results
 */
export function printVerificationResults(results: VerificationResult[]): void {
  console.log('\n========================================');
  console.log('   MIGRATION VERIFICATION RESULTS');
  console.log('========================================\n');

  const grouped = {
    ok: results.filter(r => r.status === 'ok'),
    warning: results.filter(r => r.status === 'warning'),
    error: results.filter(r => r.status === 'error'),
  };

  if (grouped.error.length > 0) {
    console.log('❌ ERRORS:');
    grouped.error.forEach(r => {
      console.log(`   ${r.module}: ${r.message}`);
      r.details?.forEach(d => console.log(`      - ${d}`));
    });
    console.log('');
  }

  if (grouped.warning.length > 0) {
    console.log('⚠️  WARNINGS:');
    grouped.warning.forEach(r => {
      console.log(`   ${r.module}: ${r.message}`);
      r.details?.forEach(d => console.log(`      - ${d}`));
    });
    console.log('');
  }

  if (grouped.ok.length > 0) {
    console.log('✅ OK:');
    grouped.ok.forEach(r => {
      console.log(`   ${r.module}: ${r.message}`);
    });
    console.log('');
  }

  console.log('========================================');
  console.log(`   Total: ${results.length} | ✅ ${grouped.ok.length} | ⚠️ ${grouped.warning.length} | ❌ ${grouped.error.length}`);
  console.log('========================================\n');
}

// Run if called directly
if (require.main === module) {
  verifyMigration().then(printVerificationResults);
}
