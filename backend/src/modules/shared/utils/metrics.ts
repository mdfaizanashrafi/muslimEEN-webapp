/**
 * Metrics Service - Observability
 * 
 * Tracks critical auth metrics for monitoring and alerting
 * 
 * DATE: 2026-03-21
 */

import pool from '../../database/pool';
import { logger } from './logger';

// In-memory counters for fast access
const counters = new Map<string, number>();

/**
 * Record a metric event
 */
export const recordMetric = async (
  name: string,
  value: number = 1,
  labels?: Record<string, string>
): Promise<void> => {
  // Increment in-memory counter
  const current = counters.get(name) || 0;
  counters.set(name, current + value);
  
  // Async insert to DB (non-blocking)
  try {
    await pool.query(
      'INSERT INTO auth_metrics (metric_name, metric_value, labels) VALUES ($1, $2, $3)',
      [name, value, labels ? JSON.stringify(labels) : null]
    );
  } catch (error) {
    // Log but don't fail - metrics are best-effort
    logger.error('Failed to record metric', {
      name,
      error: (error as Error).message,
    });
  }
};

/**
 * Get current counter value
 */
export const getCounter = (name: string): number => {
  return counters.get(name) || 0;
};

/**
 * Predefined metric names for consistency
 */
export const Metrics = {
  INVITE_VALIDATION_ATTEMPT: 'invite_validation_attempts_total',
  INVITE_VALIDATION_SUCCESS: 'invite_validation_success_total',
  INVITE_VALIDATION_FAILURE: 'invite_validation_failures_total',
  INVITE_CONSUMED: 'invite_consumed_total',
  INVITE_CONSUMPTION_FAILED: 'invite_consumption_failed_total',
  WEBHOOK_RECEIVED: 'webhook_received_total',
  WEBHOOK_PROCESSED: 'webhook_processed_total',
  WEBHOOK_DUPLICATE: 'webhook_duplicate_total',
  WEBHOOK_FAILED: 'webhook_failed_total',
  USER_BLOCKED: 'user_blocked_total',
  AUTH_MIDDLEWARE_REJECT: 'auth_middleware_reject_total',
  RATE_LIMIT_HIT: 'rate_limit_hits_total',
} as const;

/**
 * Get metrics summary for health checks
 */
export const getMetricsSummary = async (): Promise<Record<string, number>> => {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const result = await pool.query(
    `SELECT metric_name, SUM(metric_value) as total
     FROM auth_metrics
     WHERE recorded_at > $1
     GROUP BY metric_name`,
    [last24h]
  );
  
  const summary: Record<string, number> = {};
  for (const row of result.rows) {
    summary[row.metric_name] = parseInt(row.total, 10);
  }
  
  return summary;
};
