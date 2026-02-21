/**
 * Centralized Configuration Module
 * Exports all configuration modules for the MuslimEEN backend
 */

// Environment configuration
export { env, isDevelopment, isProduction, isTest, getCorsOrigins } from './env';
export type { EnvConfig } from './env';

// Database configuration
export {
  pool,
  query,
  getClient,
  withTransaction,
  healthCheck,
  closePool,
} from './database';

// Application constants
export {
  // JWT
  JWT_DEFAULTS,
  
  // Rate Limiting
  RATE_LIMIT_WINDOWS,
  RATE_LIMIT_MAX,
  RATE_LIMIT_CODES,
  
  // Trust Score
  TRUST_SCORE,
  TRUST_SCORE_POINTS,
  PROFILE_COMPLETENESS_WEIGHTS,
  
  // Verification
  VERIFICATION_TIERS,
  VERIFICATION_TIER_LABELS,
  VERIFICATION_TIER_POINTS,
  
  // User Roles
  USER_ROLES,
  USER_ROLE_LABELS,
  
  // Notifications
  NOTIFICATION_TYPES,
  NOTIFICATION_CONFIG,
  
  // Pagination
  PAGINATION,
  
  // CORS
  DEFAULT_CORS_ORIGINS,
  
  // Security
  SECURITY,
  
  // API
  API,
  
  // Marketplace
  MARKETPLACE,
  
  // Connections
  CONNECTIONS,
} from './constants';

// Default export of all configurations
export { default as envConfig } from './env';
export { default as databaseConfig } from './database';
export { default as constants } from './constants';
