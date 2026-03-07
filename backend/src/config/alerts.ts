/**
 * Alerting Configuration
 * Monitors system metrics and triggers alerts based on thresholds
 */

import { logger } from '../utils/logger';
import { captureMessage, addBreadcrumb } from './sentry';

// Alert configuration types
export interface AlertConfig {
  type: 'error_rate' | 'response_time' | 'disk_space' | 'memory' | 'cpu' | 'custom';
  threshold: number;
  window: number; // minutes
  severity: 'warning' | 'critical' | 'emergency';
  enabled: boolean;
}

// Alert state tracking
interface AlertState {
  lastTriggered: Date | null;
  triggerCount: number;
  acknowledged: boolean;
}

const alertStates = new Map<string, AlertState>();

// Default alert configurations
const DEFAULT_ALERTS: AlertConfig[] = [
  {
    type: 'error_rate',
    threshold: 0.05, // 5% error rate
    window: 5,
    severity: 'critical',
    enabled: true,
  },
  {
    type: 'response_time',
    threshold: 2000, // 2 seconds average
    window: 5,
    severity: 'warning',
    enabled: true,
  },
  {
    type: 'memory',
    threshold: 85, // 85% memory usage
    window: 1,
    severity: 'warning',
    enabled: true,
  },
  {
    type: 'disk_space',
    threshold: 90, // 90% disk usage
    window: 5,
    severity: 'critical',
    enabled: true,
  },
  {
    type: 'cpu',
    threshold: 80, // 80% CPU usage
    window: 5,
    severity: 'warning',
    enabled: true,
  },
];

/**
 * Get or initialize alert state
 */
const getAlertState = (alertType: string): AlertState => {
  if (!alertStates.has(alertType)) {
    alertStates.set(alertType, {
      lastTriggered: null,
      triggerCount: 0,
      acknowledged: false,
    });
  }
  return alertStates.get(alertType)!;
};

/**
 * Check if alert should be triggered (rate limiting)
 */
const shouldTriggerAlert = (alertType: string, windowMinutes: number): boolean => {
  const state = getAlertState(alertType);
  
  if (!state.lastTriggered) {
    return true;
  }
  
  const windowMs = windowMinutes * 60 * 1000;
  const timeSinceLastTrigger = Date.now() - state.lastTriggered.getTime();
  
  return timeSinceLastTrigger > windowMs;
};

/**
 * Trigger an alert
 */
const triggerAlert = (config: AlertConfig, metrics: any, message: string): void => {
  const state = getAlertState(config.type);
  
  state.lastTriggered = new Date();
  state.triggerCount++;
  
  const alertPayload = {
    type: config.type,
    severity: config.severity,
    threshold: config.threshold,
    currentValue: metrics,
    message,
    timestamp: new Date().toISOString(),
    triggerCount: state.triggerCount,
  };
  
  // Log the alert
  const logLevel = config.severity === 'emergency' ? 'error' : 
                   config.severity === 'critical' ? 'error' : 'warn';
  
  logger[logLevel](`ALERT: ${message}`, alertPayload);
  
  // Send to Sentry if configured
  captureMessage(
    `Alert: ${config.type}`,
    config.severity === 'warning' ? 'warning' : 'error',
    alertPayload
  );
  
  // Add breadcrumb for debugging
  addBreadcrumb(
    `Alert triggered: ${config.type}`,
    'alert',
    config.severity === 'warning' ? 'warning' : 'error',
    { threshold: config.threshold, currentValue: metrics }
  );
  
  // Send webhook notification if configured
  if (process.env.ALERT_WEBHOOK_URL) {
    sendWebhookAlert(alertPayload);
  }
};

/**
 * Send alert to configured webhook
 */
const sendWebhookAlert = async (payload: any): Promise<void> => {
  try {
    const response = await fetch(process.env.ALERT_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      logger.error('Failed to send webhook alert', { 
        status: response.status,
        statusText: response.statusText 
      });
    }
  } catch (error) {
    logger.error('Error sending webhook alert', { 
      error: (error as Error).message 
    });
  }
};

/**
 * Check error rate alert condition
 */
const checkErrorRate = (metrics: { errorRate: number }): void => {
  const config = DEFAULT_ALERTS.find(a => a.type === 'error_rate');
  if (!config?.enabled) return;
  
  if (metrics.errorRate > config.threshold) {
    if (shouldTriggerAlert('error_rate', config.window)) {
      triggerAlert(
        config,
        metrics.errorRate,
        `High error rate detected: ${(metrics.errorRate * 100).toFixed(2)}% (threshold: ${(config.threshold * 100).toFixed(2)}%)`
      );
    }
  }
};

/**
 * Check response time alert condition
 */
const checkResponseTime = (metrics: { avgResponseTime: number; p95ResponseTime?: number }): void => {
  const config = DEFAULT_ALERTS.find(a => a.type === 'response_time');
  if (!config?.enabled) return;
  
  const responseTime = metrics.p95ResponseTime || metrics.avgResponseTime;
  
  if (responseTime > config.threshold) {
    if (shouldTriggerAlert('response_time', config.window)) {
      triggerAlert(
        config,
        responseTime,
        `High response time detected: ${responseTime.toFixed(2)}ms (threshold: ${config.threshold}ms)`
      );
    }
  }
};

/**
 * Check memory usage alert condition
 */
const checkMemory = (metrics: { memoryPercent: number }): void => {
  const config = DEFAULT_ALERTS.find(a => a.type === 'memory');
  if (!config?.enabled) return;
  
  if (metrics.memoryPercent > config.threshold) {
    if (shouldTriggerAlert('memory', config.window)) {
      triggerAlert(
        config,
        metrics.memoryPercent,
        `High memory usage detected: ${metrics.memoryPercent.toFixed(2)}% (threshold: ${config.threshold}%)`
      );
    }
  }
};

/**
 * Check disk space alert condition
 */
const checkDiskSpace = (metrics: { diskPercent: number }): void => {
  const config = DEFAULT_ALERTS.find(a => a.type === 'disk_space');
  if (!config?.enabled) return;
  
  if (metrics.diskPercent > config.threshold) {
    if (shouldTriggerAlert('disk_space', config.window)) {
      triggerAlert(
        config,
        metrics.diskPercent,
        `High disk usage detected: ${metrics.diskPercent.toFixed(2)}% (threshold: ${config.threshold}%)`
      );
    }
  }
};

/**
 * Check CPU usage alert condition
 */
const checkCpu = (metrics: { cpuPercent: number }): void => {
  const config = DEFAULT_ALERTS.find(a => a.type === 'cpu');
  if (!config?.enabled) return;
  
  if (metrics.cpuPercent > config.threshold) {
    if (shouldTriggerAlert('cpu', config.window)) {
      triggerAlert(
        config,
        metrics.cpuPercent,
        `High CPU usage detected: ${metrics.cpuPercent.toFixed(2)}% (threshold: ${config.threshold}%)`
      );
    }
  }
};

/**
 * Check all alert conditions
 * Main entry point for alert checking
 */
export const checkAlertConditions = (metrics: {
  errorRate?: number;
  avgResponseTime?: number;
  p95ResponseTime?: number;
  memoryPercent?: number;
  diskPercent?: number;
  cpuPercent?: number;
}): void => {
  if (metrics.errorRate !== undefined) checkErrorRate({ errorRate: metrics.errorRate });
  if (metrics.avgResponseTime !== undefined) checkResponseTime({ 
    avgResponseTime: metrics.avgResponseTime,
    p95ResponseTime: metrics.p95ResponseTime 
  });
  if (metrics.memoryPercent !== undefined) checkMemory({ memoryPercent: metrics.memoryPercent });
  if (metrics.diskPercent !== undefined) checkDiskSpace({ diskPercent: metrics.diskPercent });
  if (metrics.cpuPercent !== undefined) checkCpu({ cpuPercent: metrics.cpuPercent });
};

/**
 * Get current alert configurations
 */
export const getAlertConfigs = (): AlertConfig[] => {
  return [...DEFAULT_ALERTS];
};

/**
 * Update alert configuration
 */
export const updateAlertConfig = (type: string, updates: Partial<AlertConfig>): boolean => {
  const configIndex = DEFAULT_ALERTS.findIndex(a => a.type === type);
  if (configIndex === -1) return false;
  
  DEFAULT_ALERTS[configIndex] = { ...DEFAULT_ALERTS[configIndex], ...updates };
  return true;
};

/**
 * Acknowledge an alert (stop notifications for this alert type)
 */
export const acknowledgeAlert = (alertType: string): boolean => {
  const state = alertStates.get(alertType);
  if (!state) return false;
  
  state.acknowledged = true;
  logger.info(`Alert acknowledged: ${alertType}`);
  return true;
};

/**
 * Clear alert acknowledgment
 */
export const clearAlertAcknowledgment = (alertType: string): boolean => {
  const state = alertStates.get(alertType);
  if (!state) return false;
  
  state.acknowledged = false;
  state.triggerCount = 0;
  logger.info(`Alert acknowledgment cleared: ${alertType}`);
  return true;
};

/**
 * Get current alert states
 */
export const getAlertStates = () => {
  const states: Record<string, AlertState> = {};
  alertStates.forEach((value, key) => {
    states[key] = { ...value };
  });
  return states;
};

export default checkAlertConditions;
