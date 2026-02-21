/**
 * Application Constants
 * Centralized configuration for application-wide values
 */

// ============================================================================
// JWT Configuration
// ============================================================================

/**
 * JWT default values
 */
export const JWT_DEFAULTS = {
  /** Default JWT expiration time */
  EXPIRES_IN: '24h' as const,
  /** Minimum secret key length for security */
  MIN_SECRET_LENGTH: 32,
  /** Algorithm used for signing */
  ALGORITHM: 'HS256' as const,
};

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

/**
 * Rate limit window configurations (in milliseconds)
 */
export const RATE_LIMIT_WINDOWS = {
  /** Standard window: 1 minute */
  STANDARD: 60 * 1000,
  /** Extended window: 15 minutes */
  EXTENDED: 15 * 60 * 1000,
  /** Long window: 1 hour */
  LONG: 60 * 60 * 1000,
} as const;

/**
 * Rate limit maximum requests per window
 */
export const RATE_LIMIT_MAX = {
  /** Auth endpoints: 5 requests per minute */
  AUTH: 5,
  /** User endpoints: 100 requests per minute */
  USER: 100,
  /** Marketplace endpoints: 100 requests per minute */
  MARKETPLACE: 100,
  /** Messages endpoints: 60 requests per minute */
  MESSAGE: 60,
  /** General API endpoints: 100 requests per minute */
  API: 100,
} as const;

/**
 * Rate limit error codes
 */
export const RATE_LIMIT_CODES = {
  EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

// ============================================================================
// Trust Score Configuration
// ============================================================================

/**
 * Trust score ranges
 */
export const TRUST_SCORE = {
  /** Minimum possible score */
  MIN: 0,
  /** Maximum possible score */
  MAX: 1000,
  /** Default score for new users */
  DEFAULT: 100,
  /** Score threshold for witness eligibility */
  WITNESS_ELIGIBLE: 200,
  /** Score threshold for high trust */
  HIGH_TRUST: 500,
  /** Score threshold for premium trust */
  PREMIUM_TRUST: 800,
} as const;

/**
 * Trust score points allocation
 */
export const TRUST_SCORE_POINTS = {
  /** Maximum points for profile completeness */
  PROFILE_COMPLETENESS_MAX: 100,
  /** Maximum points for connection quality */
  CONNECTION_QUALITY_MAX: 50,
  /** Maximum points for community contributions */
  COMMUNITY_CONTRIBUTIONS_MAX: 50,
  /** Points for basic verification */
  VERIFICATION_BASIC: 50,
  /** Points for full verification */
  VERIFICATION_FULL: 100,
  /** Points for business verification */
  VERIFICATION_BUSINESS: 150,
  /** Maximum points from endorsements */
  ENDORSEMENT_MAX: 100,
  /** Points for each successful invite */
  SUCCESSFUL_INVITE: 10,
  /** Points deducted for each failed invite */
  FAILED_INVITE: -50,
} as const;

/**
 * Profile completeness weights
 */
export const PROFILE_COMPLETENESS_WEIGHTS = {
  FIRST_NAME: 10,
  LAST_NAME: 10,
  BIO: 20,
  LOCATION: 15,
  INDUSTRY: 15,
  SKILLS: 15,
  WORK_HISTORY: 15,
} as const;

// ============================================================================
// Verification Tiers
// ============================================================================

/**
 * Verification tier levels
 */
export const VERIFICATION_TIERS = {
  /** Basic tier - email verified only */
  BASIC: 'basic',
  /** Full tier - biometric/KYC verified */
  FULL: 'full',
  /** Business tier - business verification completed */
  BUSINESS: 'business',
} as const;

/**
 * Verification tier display labels
 */
export const VERIFICATION_TIER_LABELS: Record<string, string> = {
  [VERIFICATION_TIERS.BASIC]: 'Basic',
  [VERIFICATION_TIERS.FULL]: 'Full',
  [VERIFICATION_TIERS.BUSINESS]: 'Business',
};

/**
 * Verification tier points mapping
 */
export const VERIFICATION_TIER_POINTS: Record<string, number> = {
  [VERIFICATION_TIERS.BASIC]: TRUST_SCORE_POINTS.VERIFICATION_BASIC,
  [VERIFICATION_TIERS.FULL]: TRUST_SCORE_POINTS.VERIFICATION_FULL,
  [VERIFICATION_TIERS.BUSINESS]: TRUST_SCORE_POINTS.VERIFICATION_BUSINESS,
};

// ============================================================================
// User Roles
// ============================================================================

/**
 * User role types
 */
export const USER_ROLES = {
  /** Unverified Muslim - email only */
  MUSLIM_UNVERIFIED: 'muslim_unverified',
  /** Verified Muslim - basic verification */
  MUSLIM_VERIFIED: 'muslim_verified',
  /** Business/Corporate user */
  BUSINESS: 'business',
  /** Administrator */
  ADMIN: 'admin',
} as const;

/**
 * Role display labels
 */
export const USER_ROLE_LABELS: Record<string, string> = {
  [USER_ROLES.MUSLIM_UNVERIFIED]: 'Muslim (Unverified)',
  [USER_ROLES.MUSLIM_VERIFIED]: 'Muslim (Verified)',
  [USER_ROLES.BUSINESS]: 'Business',
  [USER_ROLES.ADMIN]: 'Administrator',
};

// ============================================================================
// Notification Types
// ============================================================================

/**
 * Notification type constants
 */
export const NOTIFICATION_TYPES = {
  /** New connection request received */
  CONNECTION_REQUEST: 'connection_request',
  /** Connection request accepted */
  CONNECTION_ACCEPTED: 'connection_accepted',
  /** New skill endorsement received */
  ENDORSEMENT_RECEIVED: 'endorsement_received',
  /** Trust score increased or decreased */
  TRUST_SCORE_CHANGED: 'trust_score_changed',
  /** Verification process completed */
  VERIFICATION_COMPLETED: 'verification_completed',
  /** New message received */
  MESSAGE_RECEIVED: 'message_received',
  /** Interest shown in marketplace item */
  MARKETPLACE_INTEREST: 'marketplace_interest',
  /** Dispute resolution update */
  DISPUTE_RESOLUTION: 'dispute_resolution',
} as const;

/**
 * Notification type display configurations
 */
export const NOTIFICATION_CONFIG: Record<string, { title: string; defaultActionUrl: string }> = {
  [NOTIFICATION_TYPES.CONNECTION_REQUEST]: {
    title: 'New Connection Request',
    defaultActionUrl: '/connections',
  },
  [NOTIFICATION_TYPES.CONNECTION_ACCEPTED]: {
    title: 'Connection Accepted',
    defaultActionUrl: '/connections',
  },
  [NOTIFICATION_TYPES.ENDORSEMENT_RECEIVED]: {
    title: 'New Endorsement',
    defaultActionUrl: '/profile',
  },
  [NOTIFICATION_TYPES.TRUST_SCORE_CHANGED]: {
    title: 'Trust Score Updated',
    defaultActionUrl: '/verification',
  },
  [NOTIFICATION_TYPES.VERIFICATION_COMPLETED]: {
    title: 'Verification Completed',
    defaultActionUrl: '/verification',
  },
  [NOTIFICATION_TYPES.MESSAGE_RECEIVED]: {
    title: 'New Message',
    defaultActionUrl: '/messages',
  },
  [NOTIFICATION_TYPES.MARKETPLACE_INTEREST]: {
    title: 'Marketplace Interest',
    defaultActionUrl: '/marketplace',
  },
  [NOTIFICATION_TYPES.DISPUTE_RESOLUTION]: {
    title: 'Dispute Update',
    defaultActionUrl: '/disputes',
  },
};

// ============================================================================
// Pagination Defaults
// ============================================================================

/**
 * Default pagination values
 */
export const PAGINATION = {
  /** Default page size */
  DEFAULT_LIMIT: 20,
  /** Maximum allowed page size */
  MAX_LIMIT: 100,
  /** Default page number */
  DEFAULT_PAGE: 1,
} as const;

// ============================================================================
// CORS Configuration
// ============================================================================

/**
 * Default allowed CORS origins
 */
export const DEFAULT_CORS_ORIGINS = [
  'https://muslimeen.org',
  'https://www.muslimeen.org',
  'https://app.muslimeen.org',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5500',
];

// ============================================================================
// Security Configuration
// ============================================================================

/**
 * Security-related constants
 */
export const SECURITY = {
  /** Password minimum length */
  PASSWORD_MIN_LENGTH: 8,
  /** Maximum login attempts before lockout */
  MAX_LOGIN_ATTEMPTS: 5,
  /** Account lockout duration in minutes */
  LOCKOUT_DURATION_MINUTES: 30,
  /** CSRF token expiration in hours */
  CSRF_TOKEN_EXPIRY: 24,
} as const;

// ============================================================================
// API Configuration
// ============================================================================

/**
 * API-related constants
 */
export const API = {
  /** API version */
  VERSION: '1.0.0',
  /** API prefix */
  PREFIX: '/api',
  /** Request body size limit */
  BODY_SIZE_LIMIT: '10mb',
} as const;

// ============================================================================
// Marketplace Configuration
// ============================================================================

/**
 * Marketplace-related constants
 */
export const MARKETPLACE = {
  /** Item types */
  ITEM_TYPES: {
    PRODUCT: 'product',
    SERVICE: 'service',
    SKILL: 'skill',
  } as const,
  /** Default item status */
  DEFAULT_STATUS: 'active',
  /** Maximum items per user */
  MAX_ITEMS_PER_USER: 50,
};

// ============================================================================
// Connection Configuration
// ============================================================================

/**
 * Connection-related constants
 */
export const CONNECTIONS = {
  /** Connection statuses */
  STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    BLOCKED: 'blocked',
  } as const,
  /** Maximum pending connections per user */
  MAX_PENDING: 100,
  /** Maximum total connections per user */
  MAX_TOTAL: 1000,
};

// ============================================================================
// Default export
// ============================================================================

export default {
  JWT_DEFAULTS,
  RATE_LIMIT_WINDOWS,
  RATE_LIMIT_MAX,
  RATE_LIMIT_CODES,
  TRUST_SCORE,
  TRUST_SCORE_POINTS,
  PROFILE_COMPLETENESS_WEIGHTS,
  VERIFICATION_TIERS,
  VERIFICATION_TIER_LABELS,
  VERIFICATION_TIER_POINTS,
  USER_ROLES,
  USER_ROLE_LABELS,
  NOTIFICATION_TYPES,
  NOTIFICATION_CONFIG,
  PAGINATION,
  DEFAULT_CORS_ORIGINS,
  SECURITY,
  API,
  MARKETPLACE,
  CONNECTIONS,
};
