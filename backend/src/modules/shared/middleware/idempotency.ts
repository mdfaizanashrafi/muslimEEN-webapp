/**
 * Idempotency Middleware
 * Prevents duplicate requests for critical operations
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';

// Store for idempotency keys (in production, use Redis)
interface IdempotencyEntry {
  response: any;
  statusCode: number;
  timestamp: number;
}

const idempotencyStore = new Map<string, IdempotencyEntry>();

// Cleanup interval (1 hour)
const CLEANUP_INTERVAL = 60 * 60 * 1000;
// TTL for entries (24 hours)
const ENTRY_TTL = 24 * 60 * 60 * 1000;

/**
 * Generate idempotency key from request
 */
const generateKey = (req: Request): string => {
  const data = {
    userId: req.user?.id || 'anonymous',
    path: req.path,
    method: req.method,
    body: req.body,
    idempotencyKey: req.headers['idempotency-key'],
  };
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

/**
 * Idempotency middleware
 * Prevents duplicate processing of the same request
 */
export const idempotencyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const idempotencyKey = req.headers['idempotency-key'] as string;

  // If no idempotency key provided, skip
  if (!idempotencyKey) {
    return next();
  }

  const key = generateKey(req);
  const existing = idempotencyStore.get(key);

  if (existing) {
    // Check if entry is still valid
    if (Date.now() - existing.timestamp < ENTRY_TTL) {
      logger.debug('Idempotency: Returning cached response', {
        key: idempotencyKey,
        path: req.path,
      });

      res.setHeader('Idempotency-Key', idempotencyKey);
      res.setHeader('Idempotency-Replay', 'true');
      res.status(existing.statusCode).json(existing.response);
      return;
    }

    // Entry expired, remove it
    idempotencyStore.delete(key);
  }

  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to cache successful responses
  res.json = (body: any): Response => {
    // Only cache successful responses (2xx)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyStore.set(key, {
        response: body,
        statusCode: res.statusCode,
        timestamp: Date.now(),
      });

      res.setHeader('Idempotency-Key', idempotencyKey);
    }

    return originalJson(body);
  };

  next();
};

/**
 * Cleanup old entries periodically
 */
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;

  idempotencyStore.forEach((entry, key) => {
    if (now - entry.timestamp > ENTRY_TTL) {
      idempotencyStore.delete(key);
      cleaned++;
    }
  });

  if (cleaned > 0) {
    logger.debug(`Idempotency: Cleaned up ${cleaned} old entries`);
  }
}, CLEANUP_INTERVAL);

/**
 * Clear idempotency cache (for testing/emergencies)
 */
export const clearIdempotencyCache = (): void => {
  idempotencyStore.clear();
  logger.info('Idempotency cache cleared');
};

/**
 * Get cache stats (for monitoring)
 */
export const getIdempotencyStats = (): {
  size: number;
  oldestEntry: number | null;
} => {
  let oldest = null as number | null;

  idempotencyStore.forEach((entry) => {
    if (oldest === null || entry.timestamp < oldest) {
      oldest = entry.timestamp;
    }
  });

  return {
    size: idempotencyStore.size,
    oldestEntry: oldest,
  };
};

export default idempotencyMiddleware;
