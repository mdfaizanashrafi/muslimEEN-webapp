/**
 * Environment Configuration
 * Validates and exports typed environment variables using Zod
 */

import { z } from 'zod';

/**
 * Environment variable schema validation
 */
const envSchema = z.object({
  // Server Configuration
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database Configuration
  DB_HOST: z.string().min(1, 'DB_HOST is required'),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  DB_NAME: z.string().min(1, 'DB_NAME is required'),
  DB_USER: z.string().min(1, 'DB_USER is required'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required'),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().default('24h'),

  // CORS Configuration
  CORS_ORIGINS: z.string().optional(),
});

/**
 * Parse environment variables
 */
const parsedEnv = envSchema.safeParse(process.env);

/**
 * Throw error with helpful message on invalid environment
 */
if (!parsedEnv.success) {
  const errors = parsedEnv.error.errors
    .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
    .join('\n');
  
  console.error('❌ Invalid environment variables:\n', errors);
  console.error('\nPlease check your .env file and ensure all required variables are set.');
  
  throw new Error(
    `Environment validation failed:\n${errors}\n\n` +
    'Required environment variables:\n' +
    '  - DB_HOST: PostgreSQL host address\n' +
    '  - DB_NAME: PostgreSQL database name\n' +
    '  - DB_USER: PostgreSQL username\n' +
    '  - DB_PASSWORD: PostgreSQL password\n' +
    '  - JWT_SECRET: Secret key for JWT signing (min 32 chars)\n\n' +
    'Optional environment variables:\n' +
    '  - PORT: Server port (default: 3001)\n' +
    '  - NODE_ENV: Environment mode (default: development)\n' +
    '  - DB_PORT: PostgreSQL port (default: 5432)\n' +
    '  - JWT_EXPIRES_IN: JWT expiration time (default: 24h)\n' +
    '  - CORS_ORIGINS: Comma-separated list of allowed origins'
  );
}

/**
 * Typed environment configuration
 */
export const env = parsedEnv.data;

/**
 * Type definition for environment configuration
 */
export type EnvConfig = typeof env;

/**
 * Helper to check if running in development mode
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Helper to check if running in production mode
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Helper to check if running in test mode
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * Parse CORS origins from environment variable
 * Returns array of allowed origins or undefined
 */
export function getCorsOrigins(): string[] | undefined {
  if (!env.CORS_ORIGINS) return undefined;
  return env.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean);
}

export default env;
