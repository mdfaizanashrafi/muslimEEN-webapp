/**
 * Webhook Retry Service
 * 
 * Provides failure tolerance and retry mechanisms for Clerk webhooks.
 * 
 * FEATURES:
 * - Automatic retry with exponential backoff (3 attempts)
 * - Failed event queue for manual recovery
 * - Metrics tracking (success count, failure count, last success)
 * - Comprehensive logging for observability
 * 
 * DATE: 2026-03-20
 */

import { logger } from '../../shared/utils/logger';
import * as Sentry from '@sentry/node';
import { webhookLog, criticalLog } from '../../shared/utils/logSampler';

// ============================================================================
// CONFIGURATION
// ============================================================================

const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 1000,    // 1 second
  MAX_DELAY_MS: 10000,    // 10 seconds
  BACKOFF_MULTIPLIER: 2,  // Exponential
};

// ============================================================================
// TYPES
// ============================================================================

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  attempt: number;
}

export interface WebhookMetrics {
  totalReceived: number;
  totalProcessed: number;
  totalFailed: number;
  lastSuccessTimestamp: Date | null;
  lastFailureTimestamp: Date | null;
  currentQueueSize: number;
  retryAttempts: number;
}

export interface FailedEvent {
  event: WebhookEvent;
  error: string;
  failedAt: Date;
  retryCount: number;
}

// ============================================================================
// METRICS & STATE
// ============================================================================

class WebhookMetricsTracker {
  private metrics: WebhookMetrics = {
    totalReceived: 0,
    totalProcessed: 0,
    totalFailed: 0,
    lastSuccessTimestamp: null,
    lastFailureTimestamp: null,
    currentQueueSize: 0,
    retryAttempts: 0,
  };

  recordReceived(): void {
    this.metrics.totalReceived++;
  }

  recordSuccess(): void {
    this.metrics.totalProcessed++;
    this.metrics.lastSuccessTimestamp = new Date();
  }

  recordFailure(): void {
    this.metrics.totalFailed++;
    this.metrics.lastFailureTimestamp = new Date();
  }

  recordRetry(): void {
    this.metrics.retryAttempts++;
  }

  updateQueueSize(size: number): void {
    this.metrics.currentQueueSize = size;
  }

  getMetrics(): WebhookMetrics {
    return { ...this.metrics };
  }

  getHealthStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    const recentFailures = this.metrics.totalFailed;
    const total = this.metrics.totalReceived;
    
    if (total === 0) return 'healthy';
    
    const failureRate = recentFailures / total;
    
    if (failureRate > 0.1) return 'unhealthy';  // > 10% failure
    if (failureRate > 0.05) return 'degraded';  // > 5% failure
    return 'healthy';
  }
}

export const metricsTracker = new WebhookMetricsTracker();

// ============================================================================
// FAILED EVENT QUEUE
// ============================================================================

class FailedEventQueue {
  private queue: FailedEvent[] = [];
  private readonly MAX_QUEUE_SIZE = 1000;

  add(event: WebhookEvent, error: string): void {
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      // Remove oldest event
      this.queue.shift();
      // Sampled warning - could be frequent during incidents
      logger.warn('Failed event queue full, removed oldest event', {
        tags: { module: 'auth', type: 'webhook', subtype: 'queue_overflow' },
      });
    }

    this.queue.push({
      event,
      error,
      failedAt: new Date(),
      retryCount: event.attempt,
    });

    metricsTracker.updateQueueSize(this.queue.length);

    // Alert if queue is growing (throttle to avoid spam)
    if (this.queue.length > 50 && this.queue.length % 10 === 0) {
      criticalLog('error', 'Failed event queue growing rapidly', 'webhook_queue_alert', {
        queueSize: this.queue.length,
        latestError: error,
      });
      
      Sentry.captureMessage('Webhook failure queue growing', {
        level: 'error',
        extra: { queueSize: this.queue.length },
      });
    }
  }

  getAll(): FailedEvent[] {
    return [...this.queue];
  }

  getByEventId(eventId: string): FailedEvent | undefined {
    return this.queue.find(fe => fe.event.id === eventId);
  }

  remove(eventId: string): boolean {
    const index = this.queue.findIndex(fe => fe.event.id === eventId);
    if (index >= 0) {
      this.queue.splice(index, 1);
      metricsTracker.updateQueueSize(this.queue.length);
      return true;
    }
    return false;
  }

  clear(): void {
    this.queue = [];
    metricsTracker.updateQueueSize(0);
  }

  size(): number {
    return this.queue.length;
  }
}

export const failedEventQueue = new FailedEventQueue();

// ============================================================================
// RETRY LOGIC
// ============================================================================

/**
 * Calculate delay with exponential backoff and jitter
 */
const calculateDelay = (attempt: number): number => {
  const exponentialDelay = Math.min(
    RETRY_CONFIG.BASE_DELAY_MS * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt - 1),
    RETRY_CONFIG.MAX_DELAY_MS
  );
  
  // Add jitter (±25%) to prevent thundering herd
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(exponentialDelay + jitter);
};

/**
 * Sleep utility
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Execute webhook handler with retry logic
 * 
 * @param event - The webhook event
 * @param handler - The handler function to execute
 * @returns Success status
 */
export const executeWithRetry = async (
  event: WebhookEvent,
  handler: (event: WebhookEvent) => Promise<void>
): Promise<{ success: boolean; finalError?: string }> => {
  
  metricsTracker.recordReceived();
  
  let lastError: string = '';
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.MAX_RETRIES; attempt++) {
    try {
      // Sampled: 50% of attempts logged, throttled to 1 per 30s per event
      webhookLog('info', `Webhook attempt ${attempt}/${RETRY_CONFIG.MAX_RETRIES}`, 'webhook_attempt', {
        eventId: event.id,
        eventType: event.type,
      });
      
      await handler({ ...event, attempt });
      
      // Success!
      metricsTracker.recordSuccess();
      
      // Always log successes (not sampled)
      webhookLog('info', 'Webhook processed successfully', 'webhook_success', {
        eventId: event.id,
        eventType: event.type,
        attempts: attempt,
      });
      
      // If this was a retry, remove from failed queue
      if (attempt > 1) {
        failedEventQueue.remove(event.id);
      }
      
      return { success: true };
      
    } catch (error: any) {
      lastError = error.message || 'Unknown error';
      
      // Sampled: 50% of failures logged
      webhookLog('warn', `Webhook attempt ${attempt} failed`, 'webhook_attempt', {
        eventId: event.id,
        eventType: event.type,
        error: lastError,
        willRetry: attempt < RETRY_CONFIG.MAX_RETRIES,
      });
      
      metricsTracker.recordRetry();
      
      // Don't retry validation errors
      if (isNonRetryableError(lastError)) {
        // Always log non-retryable errors (security/business logic issues)
        criticalLog('error', 'Non-retryable webhook error', 'webhook_validation_error', {
          eventId: event.id,
          error: lastError,
          tags: { module: 'auth', type: 'webhook' },
        });
        break;
      }
      
      // Retry with delay
      if (attempt < RETRY_CONFIG.MAX_RETRIES) {
        const delay = calculateDelay(attempt);
        // Sampled: 50% of retry notices
        webhookLog('info', `Retrying webhook in ${delay}ms`, 'webhook_retry', {
          eventId: event.id,
          attempt: attempt + 1,
          delay,
        });
        await sleep(delay);
      }
    }
  }
  
  // All retries failed
  metricsTracker.recordFailure();
  
  // Always log final failures (critical)
  criticalLog('error', 'Webhook failed after all retries', 'webhook_failure', {
    eventId: event.id,
    eventType: event.type,
    error: lastError,
    maxRetries: RETRY_CONFIG.MAX_RETRIES,
  });
  
  // Add to failed queue for manual recovery
  failedEventQueue.add(event, lastError);
  
  // Send alert for critical failures
  Sentry.captureMessage('Webhook processing failed', {
    level: 'error',
    tags: {
      event_type: event.type,
      webhook_event_id: event.id,
    },
    extra: {
      error: lastError,
      attempts: RETRY_CONFIG.MAX_RETRIES,
    },
  });
  
  return { success: false, finalError: lastError };
};

/**
 * Check if error is non-retryable
 */
const isNonRetryableError = (error: string): boolean => {
  const nonRetryablePatterns = [
    'INVITE_REQUIRED',
    'INVALID_INVITE',
    'EMAIL_MISMATCH',
    'Invalid webhook signature',
    'USER_NOT_FOUND',
    'ACCOUNT_DISABLED',
  ];
  
  return nonRetryablePatterns.some(pattern => error.includes(pattern));
};

// ============================================================================
// MANUAL RECOVERY
// ============================================================================

/**
 * Retry a failed event manually
 */
export const retryFailedEvent = async (
  eventId: string,
  handler: (event: WebhookEvent) => Promise<void>
): Promise<boolean> => {
  const failedEvent = failedEventQueue.getByEventId(eventId);
  
  if (!failedEvent) {
    logger.warn('Failed event not found for retry', { eventId });
    return false;
  }
  
  logger.info('Manually retrying failed webhook', {
    eventId,
    eventType: failedEvent.event.type,
    previousAttempts: failedEvent.retryCount,
  });
  
  const result = await executeWithRetry(failedEvent.event, handler);
  
  if (result.success) {
    failedEventQueue.remove(eventId);
    logger.info('Manual retry succeeded', { eventId });
  } else {
    logger.error('Manual retry failed', { eventId, error: result.finalError });
  }
  
  return result.success;
};

/**
 * Get health status for monitoring
 */
export const getWebhookHealth = () => {
  const metrics = metricsTracker.getMetrics();
  const status = metricsTracker.getHealthStatus();
  
  return {
    status,
    metrics,
    failedQueueSize: failedEventQueue.size(),
    timestamp: new Date().toISOString(),
  };
};

// ============================================================================
// WEBHOOK ENDPOINT (for manual recovery)
// ============================================================================

/**
 * Express endpoint to get webhook health and retry failed events
 * 
 * Mount at: GET/POST /admin/webhooks
 */
export const webhookAdminEndpoint = {
  /**
   * GET /admin/webhooks/health
   */
  getHealth: (req: any, res: any): void => {
    res.json({
      success: true,
      data: getWebhookHealth(),
    });
  },
  
  /**
   * GET /admin/webhooks/failed
   */
  getFailedEvents: (req: any, res: any): void => {
    const events = failedEventQueue.getAll();
    res.json({
      success: true,
      data: {
        count: events.length,
        events: events.map(fe => ({
          id: fe.event.id,
          type: fe.event.type,
          failedAt: fe.failedAt,
          retryCount: fe.retryCount,
          error: fe.error,
        })),
      },
    });
  },
  
  /**
   * POST /admin/webhooks/retry/:eventId
   */
  retryEvent: async (req: any, res: any): Promise<void> => {
    const { eventId } = req.params;
    
    // Note: handler function needs to be passed from the controller
    // This is a placeholder for the endpoint structure
    res.json({
      success: true,
      message: 'Use WebhookRetryService.retryFailedEvent() programmatically',
      eventId,
    });
  },
};
