/**
 * Log Sampler - Reduce noise while preserving signals
 * 
 * Provides sampling, throttling, and batching for high-frequency logs.
 * 
 * DATE: 2026-03-20
 */

import { logger } from './logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

interface SamplerConfig {
  /** Sample rate (0.0 to 1.0) - log 1 in N events */
  sampleRate: number;
  /** Throttle window in ms - log once per window */
  throttleMs?: number;
  /** Max logs per window before throttling */
  maxPerWindow?: number;
}

// Default sampling rates for different log types
const DEFAULT_RATES: Record<string, SamplerConfig> = {
  // High frequency - sample heavily
  'legacy_jwt_detected': { sampleRate: 0.1, throttleMs: 60000, maxPerWindow: 5 },
  'legacy_csrf_detected': { sampleRate: 0.1, throttleMs: 60000, maxPerWindow: 5 },
  'legacy_cookie_detected': { sampleRate: 0.1, throttleMs: 60000, maxPerWindow: 5 },
  
  // Medium frequency - moderate sampling
  'webhook_attempt': { sampleRate: 0.5, throttleMs: 30000 },
  'webhook_retry': { sampleRate: 0.5 },
  
  // Low frequency - always log
  'webhook_success': { sampleRate: 1.0 },
  'webhook_failure': { sampleRate: 1.0 },
  'security_event': { sampleRate: 1.0 },
  'error': { sampleRate: 1.0 },
};

// ============================================================================
// THROTTLING STATE
// ============================================================================

interface ThrottleEntry {
  count: number;
  firstLogTime: number;
  lastLogTime: number;
  suppressed: number;
}

const throttleCache = new Map<string, ThrottleEntry>();
const THROTTLE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Cleanup old throttle entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of throttleCache.entries()) {
    if (now - entry.lastLogTime > THROTTLE_CLEANUP_INTERVAL) {
      throttleCache.delete(key);
    }
  }
}, THROTTLE_CLEANUP_INTERVAL);

// ============================================================================
// SAMPLER FUNCTIONS
// ============================================================================

/**
 * Check if we should sample this event
 */
const shouldSample = (sampleRate: number): boolean => {
  if (sampleRate >= 1.0) return true;
  if (sampleRate <= 0) return false;
  return Math.random() < sampleRate;
};

/**
 * Get throttle key from context
 */
const getThrottleKey = (type: string, context?: Record<string, any>): string => {
  // Group by type and endpoint (if available)
  const endpoint = context?.endpoint || context?.path || 'unknown';
  const ip = context?.clientIp || context?.ip || 'unknown';
  return `${type}:${endpoint}:${ip}`;
};

/**
 * Check throttling and update state
 */
const checkThrottle = (
  type: string,
  throttleMs: number,
  maxPerWindow?: number
): { allowed: boolean; suppressed?: number; summary?: boolean } => {
  const key = getThrottleKey(type);
  const now = Date.now();
  const entry = throttleCache.get(key);
  
  if (!entry) {
    throttleCache.set(key, {
      count: 1,
      firstLogTime: now,
      lastLogTime: now,
      suppressed: 0,
    });
    return { allowed: true };
  }
  
  // Check if window has expired
  if (now - entry.firstLogTime > throttleMs) {
    // If we suppressed events, emit a summary
    const suppressed = entry.suppressed;
    throttleCache.set(key, {
      count: 1,
      firstLogTime: now,
      lastLogTime: now,
      suppressed: 0,
    });
    return { allowed: true, suppressed: suppressed > 0 ? suppressed : undefined };
  }
  
  // Within window
  entry.count++;
  entry.lastLogTime = now;
  
  // Check if we've hit the max per window
  if (maxPerWindow && entry.count > maxPerWindow) {
    entry.suppressed++;
    return { allowed: false };
  }
  
  return { allowed: true };
};

// ============================================================================
// STRUCTURED LOGGING
// ============================================================================

interface LogTags {
  module: string;
  type: string;
  subtype?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Create structured log data with consistent tags
 */
const createStructuredLog = (
  message: string,
  tags: LogTags,
  data?: Record<string, any>,
  sampling?: { sampleRate: number; throttled?: boolean; suppressed?: number }
): Record<string, any> => ({
  message,
  tags,
  ...(sampling && {
    sampling: {
      ...sampling,
      throttled: sampling.throttled || false,
    },
  }),
  ...data,
  timestamp: new Date().toISOString(),
});

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Log with sampling and throttling
 * 
 * @param level - Log level
 * @param message - Log message
 * @param type - Event type for sampling configuration
 * @param tags - Structured tags
 * @param data - Additional log data
 */
export const sampledLog = (
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  type: string,
  tags: LogTags,
  data?: Record<string, any>
): void => {
  const config = DEFAULT_RATES[type] || { sampleRate: 1.0 };
  
  // Check sampling
  if (!shouldSample(config.sampleRate)) {
    return;
  }
  
  // Check throttling
  let suppressed: number | undefined;
  let summary = false;
  
  if (config.throttleMs) {
    const throttleResult = checkThrottle(type, config.throttleMs, config.maxPerWindow);
    if (!throttleResult.allowed) {
      return;
    }
    suppressed = throttleResult.suppressed;
    summary = !!suppressed;
  }
  
  // Build structured log
  const logData = createStructuredLog(
    summary ? `${message} (suppressed ${suppressed} similar events)` : message,
    tags,
    data,
    {
      sampleRate: config.sampleRate,
      throttled: !!config.throttleMs,
      suppressed,
    }
  );
  
  // Emit log
  logger[level](message, logData);
};

/**
 * Sampled logger for legacy auth detection
 */
export const legacyAuthLog = (
  type: 'jwt' | 'csrf' | 'cookie',
  data: Record<string, any>
): void => {
  sampledLog(
    'warn',
    `Legacy ${type} auth detected`,
    `legacy_${type}_detected`,
    {
      module: 'auth',
      type: 'legacy-detection',
      subtype: type,
      severity: 'medium',
    },
    data
  );
};

/**
 * Sampled logger for webhook events
 */
export const webhookLog = (
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  type: string,
  data: Record<string, any>
): void => {
  const severityMap: Record<string, LogTags['severity']> = {
    'webhook_failure': 'high',
    'webhook_success': 'low',
    'webhook_attempt': 'low',
    'webhook_retry': 'medium',
    'non_retryable_error': 'high',
  };
  
  sampledLog(level, message, type, {
    module: 'auth',
    type: 'webhook',
    subtype: type,
    severity: severityMap[type] || 'medium',
  }, data);
};

/**
 * Always-log for critical events (no sampling)
 */
export const criticalLog = (
  level: 'warn' | 'error',
  message: string,
  subtype: string,
  data: Record<string, any>
): void => {
  logger[level](message, {
    tags: {
      module: 'auth',
      type: 'critical',
      subtype,
      severity: 'critical',
    },
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Get current sampling stats for monitoring
 */
export const getSamplingStats = (): Record<string, any> => {
  const stats: Record<string, any> = {};
  
  for (const [key, entry] of throttleCache.entries()) {
    const [type] = key.split(':');
    if (!stats[type]) {
      stats[type] = { count: 0, suppressed: 0, uniqueKeys: 0 };
    }
    stats[type].count += entry.count;
    stats[type].suppressed += entry.suppressed;
    stats[type].uniqueKeys++;
  }
  
  return {
    throttledTypes: stats,
    totalThrottledKeys: throttleCache.size,
    samplingRates: DEFAULT_RATES,
  };
};

export default {
  sampledLog,
  legacyAuthLog,
  webhookLog,
  criticalLog,
  getSamplingStats,
};
