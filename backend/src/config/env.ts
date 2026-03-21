/**
 * Environment Configuration
 * Centralized, type-safe environment variable management using Zod
 * 
 * Features:
 * - Runtime validation with clear error messages
 * - TypeScript type inference
 * - Development-friendly defaults
 * - Production strict mode
 * - No process.env scattered throughout codebase
 */

import { z } from 'zod';

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate PostgreSQL connection string
 */
const isValidPostgresqlUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'postgresql:';
  } catch {
    return false;
  }
};

/**
 * Check if secret appears weak (contains common patterns)
 */
const isWeakSecret = (secret: string): boolean => {
  const weakPatterns = [
    'secret',
    'password',
    '123',
    'default',
    'your-secret',
    'test',
    'dev',
    'local',
    'change',
  ];
  const lowerSecret = secret.toLowerCase();
  return weakPatterns.some(pattern => lowerSecret.includes(pattern));
};

// ============================================================================
// ZOD SCHEMA DEFINITION
// ============================================================================

/**
 * Environment variable schema with validation
 * 
 * NOTES:
 * - Required vars have no .default() - must be provided
 * - Optional vars use .optional()
 * - Development defaults are clearly marked
 * - Production validation is stricter via .refine()
 */
const envSchema = z.object({
  // ==========================================================================
  // CORE SERVER CONFIG
  // ==========================================================================
  
  NODE_ENV: z
    .enum(['development', 'staging', 'production'])
    .default('development'),
  
  PORT: z
    .string()
    .default('3001')
    .transform(val => parseInt(val, 10)),
  
  npm_package_version: z
    .string()
    .default('1.0.0'),

  // ==========================================================================
  // DATABASE (Required)
  // ==========================================================================
  
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine(isValidPostgresqlUrl, {
      message: 'DATABASE_URL must be a valid postgresql:// connection string',
    }),
  
  DB_POOL_MAX: z
    .string()
    .default('20')
    .transform(val => parseInt(val, 10)),

  // ==========================================================================
  // CLERK AUTHENTICATION (Required)
  // ==========================================================================
  
  CLERK_SECRET_KEY: z
    .string()
    .min(1, 'CLERK_SECRET_KEY is required for authentication'),
  
  CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'CLERK_PUBLISHABLE_KEY is required')
    .optional(),
  
  CLERK_WEBHOOK_SECRET: z
    .string()
    .min(1, 'CLERK_WEBHOOK_SECRET is required for webhook verification')
    .optional(),
  
  // ==========================================================================
  // SECURITY SECRETS (Deprecated - Clerk migration complete)
  // ==========================================================================
  
  // JWT_SECRET: Deprecated - migrated to Clerk authentication
  // Keeping as optional for backward compatibility during transition
  JWT_SECRET: z
    .string()
    .optional()
    .refine(
      secret => {
        // Skip validation if not provided (Clerk migration complete)
        if (!secret) return true;
        // In development, allow shorter secrets for convenience
        if (process.env.NODE_ENV === 'development') return true;
        return secret.length >= 32;
      },
      {
        message: 'JWT_SECRET must be at least 32 characters in production',
      }
    )
    .refine(
      secret => {
        // Skip validation if not provided (Clerk migration complete)
        if (!secret) return true;
        if (process.env.NODE_ENV === 'development') return true;
        return !isWeakSecret(secret);
      },
      {
        message: 'JWT_SECRET appears to be a weak/default value. Generate a secure secret.',
      }
    ),
  
  // JWT_EXPIRES_IN: Deprecated - migrated to Clerk authentication
  JWT_EXPIRES_IN: z
    .string()
    .optional()
    .default('24h'),
  
  COOKIE_SECRET: z
    .string()
    .min(1, 'COOKIE_SECRET is required')
    .refine(
      secret => {
        if (process.env.NODE_ENV === 'development') return true;
        return secret.length >= 32;
      },
      {
        message: 'COOKIE_SECRET must be at least 32 characters in production',
      }
    ),
  
  CSRF_SECRET: z
    .string()
    .min(32, 'CSRF_SECRET must be at least 32 characters')
    .optional(),
  
  BCRYPT_ROUNDS: z
    .string()
    .default('12')
    .transform(val => parseInt(val, 10)),
  
  // ==========================================================================
  // INTERNAL API (Service-to-Service)
  // ==========================================================================
  
  INTERNAL_API_URL: z
    .string()
    .url()
    .default('http://localhost:3001/api/internal'),
  
  INTERNAL_API_KEY: z
    .string()
    .optional(),

  // ==========================================================================
  // CORS / FRONTEND (Required in production)
  // ==========================================================================
  
  FRONTEND_URL: z
    .string()
    .url('FRONTEND_URL must be a valid URL')
    .default('http://localhost:8080'),
  
  FRONTEND_URLS: z
    .string()
    .optional()
    .transform(val => val ? val.split(',').map(url => url.trim()) : []),
  
  TRUSTED_PROXIES: z
    .string()
    .optional()
    .transform(val => val ? val.split(',').map(ip => ip.trim()) : undefined),

  // ==========================================================================
  // MONITORING & LOGGING (Optional)
  // ==========================================================================
  
  SENTRY_DSN: z
    .string()
    .url()
    .optional()
    .or(z.literal('')),
  
  REDIS_URL: z
    .string()
    .url()
    .optional()
    .or(z.literal('')),
  
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
    .default('info'),

  // ==========================================================================
  // FEATURE FLAGS (Optional, all default to false)
  // ==========================================================================
  
  USE_MODULAR_IAM: z
    .enum(['true', 'false'])
    .default('false')
    .transform(val => val === 'true'),
  
  USE_MODULAR_PROFILE: z
    .enum(['true', 'false'])
    .default('false')
    .transform(val => val === 'true'),
  
  USE_MODULAR_TRUST: z
    .enum(['true', 'false'])
    .default('false')
    .transform(val => val === 'true'),
  
  USE_MODULAR_NETWORK: z
    .enum(['true', 'false'])
    .default('false')
    .transform(val => val === 'true'),
  
  USE_MODULAR_NOTIFICATIONS: z
    .enum(['true', 'false'])
    .default('false')
    .transform(val => val === 'true'),
  
  USE_MODULAR_INVITATIONS: z
    .enum(['true', 'false'])
    .default('false')
    .transform(val => val === 'true'),
  
  USE_MODULAR_MARKETPLACE: z
    .enum(['true', 'false'])
    .default('false')
    .transform(val => val === 'true'),
  
  USE_MODULAR_ISLAMIC_FINANCE: z
    .enum(['true', 'false'])
    .default('false')
    .transform(val => val === 'true'),

  // ==========================================================================
  // ISLAMIC FINANCE CONFIG (Optional, with defaults)
  // ==========================================================================
  
  NISAB_GOLD_VALUE: z
    .string()
    .default('85000')
    .transform(val => parseInt(val, 10)),
  
  NISAB_SILVER_VALUE: z
    .string()
    .default('6000')
    .transform(val => parseInt(val, 10)),
  
  NISAB_DEFAULT_TYPE: z
    .enum(['gold', 'silver'])
    .default('gold'),

  // ==========================================================================
  // VERIFICATION CONFIG (Optional)
  // ==========================================================================
  
  BIOMETRIC_VERIFICATION_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform(val => val === 'true'),

  // ==========================================================================
  // MISC (Optional)
  // ==========================================================================
  
  API_DOCS_URL: z
    .string()
    .url()
    .default('https://docs.muslimeen.org'),
  
  SAFE_MODE: z
    .enum(['true', 'false'])
    .default('false')
    .transform(val => val === 'true'),
  
  // ==========================================================================
  // SYSTEM SAFETY MODE (Read-only during maintenance)
  // ==========================================================================
  
  SYSTEM_READ_ONLY: z
    .enum(['true', 'false'])
    .default('false')
    .transform(val => val === 'true'),
});

// ============================================================================
// PARSE AND VALIDATE
// ============================================================================

/**
 * Parse environment variables with Zod
 * Throws descriptive error if validation fails
 */
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    const errors = result.error.issues.map(issue => {
      const path = issue.path.join('.');
      return `  - ${path}: ${issue.message}`;
    });
    
    console.error('❌ Environment validation failed:\n');
    console.error(errors.join('\n'));
    console.error('\nPlease check your .env file and environment variables.\n');
    
    throw new Error(
      `Environment validation failed with ${result.error.issues.length} error(s)`
    );
  }
  
  return result.data;
};

// ============================================================================
// EXPORT TYPE-SAFE ENV
// ============================================================================

/**
 * Type-safe environment configuration
 * Import this instead of using process.env directly
 * 
 * @example
 * ```ts
 * import { env } from '@/config/env';
 * 
 * const dbUrl = env.DATABASE_URL;
 * const isProd = env.NODE_ENV === 'production';
 * ```
 */
export const env = parseEnv();

/**
 * Type for the environment configuration
 * Use this for function parameters or type annotations
 */
export type Env = typeof env;

/**
 * Environment summary for health checks
 * Safe to expose - no secrets included
 */
export const getEnvironmentSummary = () => ({
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  hasSentry: !!env.SENTRY_DSN,
  hasRedis: !!env.REDIS_URL,
  version: env.npm_package_version,
});

/**
 * Check if running in safe mode
 */
export const isSafeMode = (): boolean => env.SAFE_MODE;

/**
 * Check if system is in read-only mode
 * When true, only GET/HEAD requests are allowed
 */
export const isReadOnlyMode = (): boolean => env.SYSTEM_READ_ONLY;

// ============================================================================
// VALIDATION HELPERS FOR PRODUCTION
// ============================================================================

/**
 * Validate production configuration
 * Call this after initial load to ensure production readiness
 */
export const validateProductionConfig = (): void => {
  if (env.NODE_ENV !== 'production') return;
  
  const warnings: string[] = [];
  
  // JWT_SECRET is deprecated - Clerk migration complete
  // Only validate if still present for backward compatibility
  if (env.JWT_SECRET && env.JWT_SECRET.length < 64) {
    warnings.push('JWT_SECRET should be at least 64 characters in production (deprecated, using Clerk)');
  }
  
  if (env.COOKIE_SECRET.length < 64) {
    warnings.push('COOKIE_SECRET should be at least 64 characters in production');
  }
  
  if (!env.CSRF_SECRET) {
    warnings.push('CSRF_SECRET is recommended for production');
  }
  
  if (!env.SENTRY_DSN) {
    warnings.push('SENTRY_DSN is recommended for production error tracking');
  }
  
  if (warnings.length > 0) {
    console.warn('\n⚠️  Production configuration warnings:\n');
    warnings.forEach(w => console.warn(`  - ${w}`));
    console.warn('');
  }
};

// Run production validation
validateProductionConfig();

export default env;
