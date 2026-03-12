/**
 * Data Formatters
 * Pure functions for data transformation - No side effects
 */

import { User, UserRole, VerificationTier } from '../types';

/**
 * Maps a database user record to the API response format
 * @param userRecord Database user record
 * @returns Formatted User object
 */
export const mapDatabaseUserToApiModel = (userRecord: Record<string, unknown> | null): User | null => {
  if (!userRecord) return null;

  return {
    id: userRecord.id as string,
    email: userRecord.email as string,
    firstName: userRecord.first_name as string,
    lastName: userRecord.last_name as string,
    fullName: `${userRecord.first_name} ${userRecord.last_name}`,
    role: userRecord.role as UserRole,
    verificationTier: userRecord.verification_tier as VerificationTier,
    trustScore: userRecord.trust_score as number,
    bio: userRecord.bio as string | undefined,
    location: userRecord.location as string | undefined,
    industry: userRecord.industry as string | undefined,
    skills: (userRecord.skills as string[]) || [],
    endorsements: userRecord.endorsements as number,
    connections: userRecord.connections as number,
    profileViews: userRecord.profile_views as number,
    invitesRemaining: (userRecord.invites_remaining as number) ?? 0,
    isActive: userRecord.is_active !== false,
    badges: (userRecord.badges as string[]) || [],
    createdAt: userRecord.created_at as Date,
    lastLogin: userRecord.last_login as Date | undefined,
  };
};

/**
 * Converts a date to ISO string format
 * @param date Date or timestamp
 * @returns ISO string or null
 */
export const toIsoDateString = (date: Date | string | null): string | null => {
  if (!date) return null;
  return new Date(date).toISOString();
};

/**
 * Converts camelCase to snake_case
 * @param camelCaseString Camel case string
 * @returns Snake case string
 */
export const toSnakeCase = (camelCaseString: string): string => {
  return camelCaseString.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * Converts snake_case to camelCase
 * @param snakeCaseString Snake case string
 * @returns Camel case string
 */
export const toCamelCase = (snakeCaseString: string): string => {
  return snakeCaseString.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Format currency amount with symbol
 * @param amount Numeric amount
 * @param currency Currency code
 * @returns Formatted string
 */
export const formatCurrency = (amount: number, currency: string = 'GBP'): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format trust score with tier indicator
 * @param score Trust score (0-1000)
 * @returns Object with score and tier
 */
export const formatTrustScore = (score: number): { score: number; tier: 'high' | 'medium' | 'low' } => {
  return {
    score,
    tier: score >= 700 ? 'high' : score >= 200 ? 'medium' : 'low',
  };
};

/**
 * Escapes HTML entities to prevent XSS attacks
 * @param rawString Raw string that may contain HTML
 * @returns Escaped string safe for HTML display
 */
export const escapeHtmlEntities = (rawString: string | null | undefined): string => {
  if (!rawString) return '';
  return rawString
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};
