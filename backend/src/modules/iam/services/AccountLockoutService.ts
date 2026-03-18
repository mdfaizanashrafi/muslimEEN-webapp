/**
 * Account Lockout Service
 * Prevents brute force attacks by temporarily locking accounts after failed attempts
 * SECURITY: OWASP Top 10 - Broken Authentication mitigation
 */

import { logger } from '../../shared/utils/logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

interface LockoutConfig {
  maxFailedAttempts: number;        // Failed attempts before lockout
  lockoutDurationMs: number;        // How long to lock the account
  resetAfterMs: number;             // Reset counter after inactivity
}

const DEFAULT_CONFIG: LockoutConfig = {
  maxFailedAttempts: 5,             // 5 failed attempts
  lockoutDurationMs: 15 * 60 * 1000, // 15 minutes lockout
  resetAfterMs: 60 * 60 * 1000,      // Reset counter after 1 hour of inactivity
};

// ============================================================================
// TYPES
// ============================================================================

interface FailedAttemptEntry {
  count: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  lockedUntil?: number;
}

interface LockoutStatus {
  isLocked: boolean;
  lockedUntil?: Date;
  remainingAttempts: number;
  failedAttempts: number;
}

// ============================================================================
// IN-MEMORY STORE
// ============================================================================

/**
 * In-memory store for failed login attempts
 * NOTE: In production with multiple servers, use Redis
 */
class AttemptStore {
  private attempts: Map<string, FailedAttemptEntry> = new Map();
  private config: LockoutConfig;

  constructor(config: LockoutConfig = DEFAULT_CONFIG) {
    this.config = config;
    // Periodic cleanup of old entries
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Get attempt entry for identifier (email or IP)
   */
  get(identifier: string): FailedAttemptEntry | undefined {
    return this.attempts.get(identifier);
  }

  /**
   * Set attempt entry
   */
  set(identifier: string, entry: FailedAttemptEntry): void {
    this.attempts.set(identifier, entry);
  }

  /**
   * Delete attempt entry
   */
  delete(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Clean up old entries to prevent memory bloat
   */
  private cleanup(): void {
    const now = Date.now();
    const expiryTime = this.config.resetAfterMs;
    
    for (const [identifier, entry] of this.attempts.entries()) {
      // Remove entries that haven't had activity in resetAfterMs
      if (now - entry.lastAttemptAt > expiryTime) {
        this.attempts.delete(identifier);
      }
    }
  }

  /**
   * Get all locked accounts (for admin monitoring)
   */
  getLockedAccounts(): Array<{ identifier: string; lockedUntil: number }> {
    const now = Date.now();
    const locked: Array<{ identifier: string; lockedUntil: number }> = [];
    
    for (const [identifier, entry] of this.attempts.entries()) {
      if (entry.lockedUntil && entry.lockedUntil > now) {
        locked.push({ identifier, lockedUntil: entry.lockedUntil });
      }
    }
    
    return locked;
  }

  /**
   * Clear all attempts (for testing)
   */
  clearAll(): void {
    this.attempts.clear();
  }
}

// ============================================================================
// SERVICE
// ============================================================================

export class AccountLockoutService {
  private store: AttemptStore;
  private config: LockoutConfig;

  constructor(config: Partial<LockoutConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.store = new AttemptStore(this.config);
  }

  /**
   * Record a failed login attempt
   * Returns lockout status after recording the attempt
   */
  recordFailedAttempt(identifier: string): LockoutStatus {
    // CRITICAL FIX: Normalize identifier (email) to lowercase
    const normalizedIdentifier = identifier.toLowerCase().trim();
    const now = Date.now();
    let entry = this.store.get(normalizedIdentifier);

    if (!entry) {
      // First failed attempt
      entry = {
        count: 1,
        firstAttemptAt: now,
        lastAttemptAt: now,
      };
    } else {
      // Check if lockout period has expired
      if (entry.lockedUntil && now > entry.lockedUntil) {
        // Lockout expired, reset counter
        entry = {
          count: 1,
          firstAttemptAt: now,
          lastAttemptAt: now,
        };
      } else {
        // Increment counter
        entry.count += 1;
        entry.lastAttemptAt = now;
      }
    }

    // Check if we should lock the account
    if (entry.count >= this.config.maxFailedAttempts && !entry.lockedUntil) {
      entry.lockedUntil = now + this.config.lockoutDurationMs;
      
      logger.warn('Account locked due to failed attempts', {
        identifier: this.maskIdentifier(normalizedIdentifier),
        failedAttempts: entry.count,
        lockedUntil: new Date(entry.lockedUntil).toISOString(),
      });
    }

    this.store.set(normalizedIdentifier, entry);
    return this.getLockoutStatus(normalizedIdentifier);
  }

  /**
   * Record a successful login - clears failed attempts
   */
  recordSuccessfulLogin(identifier: string): void {
    const normalizedIdentifier = identifier.toLowerCase().trim();
    this.store.delete(normalizedIdentifier);
    
    logger.info('Login successful, cleared failed attempts', {
      identifier: this.maskIdentifier(normalizedIdentifier),
    });
  }

  /**
   * Check if account is currently locked
   */
  isLocked(identifier: string): boolean {
    const normalizedIdentifier = identifier.toLowerCase().trim();
    const entry = this.store.get(normalizedIdentifier);
    
    if (!entry || !entry.lockedUntil) {
      return false;
    }

    const now = Date.now();
    
    // Check if lockout has expired
    if (now > entry.lockedUntil) {
      // Lockout expired, clear it
      this.store.delete(normalizedIdentifier);
      return false;
    }

    return true;
  }

  /**
   * Get detailed lockout status for an account
   */
  getLockoutStatus(identifier: string): LockoutStatus {
    const normalizedIdentifier = identifier.toLowerCase().trim();
    const entry = this.store.get(normalizedIdentifier);
    
    if (!entry) {
      return {
        isLocked: false,
        remainingAttempts: this.config.maxFailedAttempts,
        failedAttempts: 0,
      };
    }

    const now = Date.now();
    
    // Check if locked
    if (entry.lockedUntil && now < entry.lockedUntil) {
      return {
        isLocked: true,
        lockedUntil: new Date(entry.lockedUntil),
        remainingAttempts: 0,
        failedAttempts: entry.count,
      };
    }

    // Not locked, calculate remaining attempts
    const remainingAttempts = Math.max(0, this.config.maxFailedAttempts - entry.count);
    
    return {
      isLocked: false,
      remainingAttempts,
      failedAttempts: entry.count,
    };
  }

  /**
   * Manually unlock an account (for admin use)
   */
  unlockAccount(identifier: string): boolean {
    const normalizedIdentifier = identifier.toLowerCase().trim();
    const entry = this.store.get(normalizedIdentifier);
    
    if (!entry) {
      return false;
    }

    this.store.delete(normalizedIdentifier);
    
    logger.info('Account manually unlocked', {
      identifier: this.maskIdentifier(normalizedIdentifier),
    });
    
    return true;
  }

  /**
   * Get all currently locked accounts
   */
  getLockedAccounts(): Array<{ identifier: string; lockedUntil: Date }> {
    const locked = this.store.getLockedAccounts();
    return locked.map(({ identifier, lockedUntil }) => ({
      identifier: this.maskIdentifier(identifier),
      lockedUntil: new Date(lockedUntil),
    }));
  }

  /**
   * Mask identifier for logging (protect PII)
   */
  private maskIdentifier(identifier: string): string {
    // If it looks like an email, mask the username part
    if (identifier.includes('@')) {
      const [username, domain] = identifier.split('@');
      const maskedUsername = username.charAt(0) + '***' + username.charAt(username.length - 1);
      return `${maskedUsername}@${domain}`;
    }
    
    // For IP addresses or other identifiers, show first and last parts
    if (identifier.length > 8) {
      return identifier.substring(0, 3) + '...' + identifier.substring(identifier.length - 3);
    }
    
    return '***';
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const accountLockoutService = new AccountLockoutService();

// ============================================================================
// EXPRESS MIDDLEWARE
// ============================================================================

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if account is locked before login attempt
 * Apply this BEFORE authentication handler
 */
export const checkAccountLockout = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // CRITICAL FIX: Normalize email to lowercase for consistent lockout behavior
  const rawIdentifier = req.body.email || req.ip;
  const identifier = rawIdentifier ? rawIdentifier.toLowerCase().trim() : null;
  
  if (!identifier) {
    next();
    return;
  }

  const status = accountLockoutService.getLockoutStatus(identifier);
  
  if (status.isLocked && status.lockedUntil) {
    const remainingMinutes = Math.ceil(
      (status.lockedUntil.getTime() - Date.now()) / 60000
    );
    
    res.status(423).json({
      success: false,
      error: {
        code: 'ACCOUNT_LOCKED',
        message: `Account is temporarily locked due to too many failed attempts. Please try again in ${remainingMinutes} minute(s).`,
        lockedUntil: status.lockedUntil.toISOString(),
        remainingMinutes,
      },
    });
    return;
  }

  // Attach remaining attempts to request for response
  (req as any).loginAttemptsInfo = {
    remainingAttempts: status.remainingAttempts,
  };
  
  next();
};

/**
 * Helper to record failed login from auth controller
 */
export const recordFailedLogin = (identifier: string): LockoutStatus => {
  const normalizedIdentifier = identifier.toLowerCase().trim();
  return accountLockoutService.recordFailedAttempt(normalizedIdentifier);
};

/**
 * Helper to record successful login from auth controller
 */
export const recordSuccessfulLogin = (identifier: string): void => {
  const normalizedIdentifier = identifier.toLowerCase().trim();
  accountLockoutService.recordSuccessfulLogin(normalizedIdentifier);
};
