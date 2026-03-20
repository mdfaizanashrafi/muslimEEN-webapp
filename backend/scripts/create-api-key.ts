#!/usr/bin/env ts-node
/**
 * Create API Key Script
 * 
 * Generates a new internal API key for service-to-service authentication.
 * 
 * Usage:
 *   npx ts-node scripts/create-api-key.ts --name="Service Name" --scope=read --expires=90
 * 
 * Options:
 *   --name       Name of the service (required)
 *   --scope      Permission scope: read, write, admin (default: read)
 *   --expires    Expiration in days (optional, no expiration if omitted)
 */

import { createApiKeyCli } from '../src/modules/shared/auth/InternalApiAuth';

// Parse command line arguments
const args = process.argv.slice(2);
const options: {
  name?: string;
  scope?: 'read' | 'write' | 'admin';
  expiresInDays?: number;
} = {};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg.startsWith('--name=')) {
    options.name = arg.split('=')[1];
  } else if (arg.startsWith('--scope=')) {
    const scope = arg.split('=')[1] as 'read' | 'write' | 'admin';
    if (!['read', 'write', 'admin'].includes(scope)) {
      console.error('❌ Invalid scope. Must be: read, write, or admin');
      process.exit(1);
    }
    options.scope = scope;
  } else if (arg.startsWith('--expires=')) {
    const days = parseInt(arg.split('=')[1], 10);
    if (isNaN(days) || days < 1) {
      console.error('❌ Invalid expiration. Must be a positive number of days');
      process.exit(1);
    }
    options.expiresInDays = days;
  }
}

// Validate required options
if (!options.name) {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                 CREATE API KEY SCRIPT                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log('Usage:');
  console.log('  npx ts-node scripts/create-api-key.ts --name="Service Name" --scope=read --expires=90\n');
  console.log('Options:');
  console.log('  --name       Name of the service (required)');
  console.log('  --scope      Permission scope: read, write, admin (default: read)');
  console.log('  --expires    Expiration in days (optional)\n');
  console.log('Examples:');
  console.log('  npx ts-node scripts/create-api-key.ts --name="Data Sync Service" --scope=write');
  console.log('  npx ts-node scripts/create-api-key.ts --name="Analytics Exporter" --scope=read --expires=30\n');
  process.exit(1);
}

// Set defaults
options.scope = options.scope || 'read';

// Create the API key
createApiKeyCli({
  name: options.name,
  scope: options.scope,
  expiresInDays: options.expiresInDays,
}).catch(error => {
  console.error('❌ Error creating API key:', error);
  process.exit(1);
});
