/**
 * Security Audit Middleware
 * Detects and logs suspicious activity patterns
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Track suspicious activity by IP
const suspiciousActivity = new Map<string, {
  count: number;
  firstSeen: number;
  lastSeen: number;
  patterns: string[];
}>();

// Cleanup interval (10 minutes)
const CLEANUP_INTERVAL = 10 * 60 * 1000;

// Suspicious patterns to detect
const SUSPICIOUS_PATTERNS = [
  { pattern: /\.\./, name: 'path_traversal' },
  { pattern: /<script/i, name: 'xss_attempt' },
  { pattern: /union\s+select/i, name: 'sql_injection' },
  { pattern: /\$where/i, name: 'nosql_injection' },
  { pattern: /\/etc\/passwd/i, name: 'lfi_attempt' },
  { pattern: /\.env/i, name: 'env_file_access' },
  { pattern: /config\./i, name: 'config_access' },
];

/**
 * Detect suspicious patterns in request
 */
const detectSuspiciousPatterns = (req: Request): string[] => {
  const detected: string[] = [];
  const checkString = (str: string): void => {
    SUSPICIOUS_PATTERNS.forEach(({ pattern, name }) => {
      if (pattern.test(str) && !detected.includes(name)) {
        detected.push(name);
      }
    });
  };

  // Check URL path
  checkString(req.path);
  checkString(req.originalUrl);

  // Check query parameters
  if (req.query) {
    checkString(JSON.stringify(req.query));
  }

  // Check body (for POST/PUT requests)
  if (req.body && typeof req.body === 'object') {
    checkString(JSON.stringify(req.body));
  }

  // Check headers (User-Agent, Referer)
  if (req.headers['user-agent']) {
    checkString(req.headers['user-agent']);
  }
  if (req.headers.referer) {
    checkString(req.headers.referer);
  }

  return detected;
};

/**
 * Security audit middleware
 * Detects and logs suspicious activity
 */
export const securityAudit = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const clientIp = req.ip || 'unknown';
  const patterns = detectSuspiciousPatterns(req);

  if (patterns.length > 0) {
    // Get or create tracking entry
    const now = Date.now();
    const existing = suspiciousActivity.get(clientIp);
    
    if (existing) {
      existing.count++;
      existing.lastSeen = now;
      patterns.forEach(p => {
        if (!existing.patterns.includes(p)) {
          existing.patterns.push(p);
        }
      });
    } else {
      suspiciousActivity.set(clientIp, {
        count: 1,
        firstSeen: now,
        lastSeen: now,
        patterns: [...patterns],
      });
    }

    // Log the suspicious activity
    logger.warn('Suspicious activity detected', {
      ip: clientIp,
      path: req.path,
      patterns,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id,
    });

    // If repeated suspicious activity, add warning header
    const tracking = suspiciousActivity.get(clientIp);
    if (tracking && tracking.count > 5) {
      res.setHeader('X-Security-Warning', 'suspicious-activity-detected');
    }
  }

  next();
};

/**
 * Get suspicious activity report (for admin endpoints)
 */
export const getSuspiciousActivityReport = (): Array<{
  ip: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  patterns: string[];
}> => {
  const report: Array<{
    ip: string;
    count: number;
    firstSeen: string;
    lastSeen: string;
    patterns: string[];
  }> = [];

  suspiciousActivity.forEach((data, ip) => {
    report.push({
      ip,
      count: data.count,
      firstSeen: new Date(data.firstSeen).toISOString(),
      lastSeen: new Date(data.lastSeen).toISOString(),
      patterns: data.patterns,
    });
  });

  return report.sort((a, b) => b.count - a.count);
};

/**
 * Clear old suspicious activity entries
 */
setInterval(() => {
  const now = Date.now();
  const cutoff = now - CLEANUP_INTERVAL;

  suspiciousActivity.forEach((data, ip) => {
    if (data.lastSeen < cutoff) {
      suspiciousActivity.delete(ip);
    }
  });
}, CLEANUP_INTERVAL);

export default securityAudit;
