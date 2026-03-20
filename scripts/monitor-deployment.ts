#!/usr/bin/env ts-node
/**
 * Real-Time Deployment Monitor
 * 
 * Monitors the system immediately after deployment for issues.
 * Run this script for 30 minutes after production deployment.
 * 
 * Usage:
 *   npx ts-node scripts/monitor-deployment.ts [production|staging]
 * 
 * Features:
 *   - Health endpoint polling
 *   - Error rate tracking
 *   - Auth failure detection
 *   - Performance monitoring
 *   - Alert on threshold breaches
 * 
 * DATE: 2026-03-20
 */

import { execSync } from 'child_process';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Check intervals (ms)
  healthCheckInterval: 30000,    // 30 seconds
  logCheckInterval: 60000,       // 1 minute
  reportInterval: 300000,        // 5 minutes
  
  // Total monitoring duration (ms)
  maxDuration: 30 * 60 * 1000,   // 30 minutes
  
  // Alert thresholds
  thresholds: {
    errorRate: 0.01,             // 1% error rate
    responseTime: 2000,          // 2 seconds
    authFailureRate: 0.05,       // 5% auth failures
    cpuUsage: 80,                // 80% CPU
    memoryUsage: 85,             // 85% memory
  },
  
  // Endpoints to monitor
  endpoints: {
    staging: {
      backend: 'https://muslimeen-api-staging.onrender.com',
      frontend: 'https://muslimeen-staging.vercel.app',
    },
    production: {
      backend: 'https://muslimeen-api.onrender.com',
      frontend: 'https://muslimeen.org',
    },
  },
};

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

// ============================================================================
// STATE TRACKING
// ============================================================================

interface MonitoringState {
  startTime: number;
  checkCount: number;
  errorCount: number;
  authFailureCount: number;
  slowResponseCount: number;
  lastHealthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  alerts: string[];
  metrics: {
    responseTimes: number[];
    errorRates: number[];
    authSuccessRates: number[];
  };
}

const state: MonitoringState = {
  startTime: Date.now(),
  checkCount: 0,
  errorCount: 0,
  authFailureCount: 0,
  slowResponseCount: 0,
  lastHealthStatus: 'unknown',
  alerts: [],
  metrics: {
    responseTimes: [],
    errorRates: [],
    authSuccessRates: [],
  },
};

// ============================================================================
// LOGGING
// ============================================================================

const log = {
  info: (msg: string) => console.log(`${colors.blue}[MONITOR]${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}[OK]${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}[ALERT]${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  metric: (msg: string) => console.log(`${colors.cyan}[METRIC]${colors.reset} ${msg}`),
  section: (title: string) => {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}  ${title}${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);
  },
};

// ============================================================================
// HEALTH CHECKS
// ============================================================================

async function checkBackendHealth(backendUrl: string): Promise<{
  healthy: boolean;
  responseTime: number;
  status: string;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${backendUrl}/api/health/auth`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    const responseTime = Date.now() - startTime;
    const data = await response.json().catch(() => ({}));
    
    state.metrics.responseTimes.push(responseTime);
    
    if (responseTime > CONFIG.thresholds.responseTime) {
      state.slowResponseCount++;
    }
    
    return {
      healthy: response.ok && data.status === 'healthy',
      responseTime,
      status: data.status || 'unknown',
    };
    
  } catch (error: any) {
    state.errorCount++;
    return {
      healthy: false,
      responseTime: Date.now() - startTime,
      status: 'error',
      error: error.message,
    };
  }
}

async function checkFrontendHealth(frontendUrl: string): Promise<{
  healthy: boolean;
  responseTime: number;
  statusCode: number;
}> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(frontendUrl, {
      method: 'HEAD',
    });
    
    const responseTime = Date.now() - startTime;
    state.metrics.responseTimes.push(responseTime);
    
    if (responseTime > CONFIG.thresholds.responseTime) {
      state.slowResponseCount++;
    }
    
    return {
      healthy: response.ok,
      responseTime,
      statusCode: response.status,
    };
    
  } catch (error: any) {
    state.errorCount++;
    return {
      healthy: false,
      responseTime: Date.now() - startTime,
      statusCode: 0,
    };
  }
}

// ============================================================================
// ERROR ANALYSIS
// ============================================================================

function calculateErrorRate(): number {
  if (state.checkCount === 0) return 0;
  return state.errorCount / state.checkCount;
}

function calculateAverageResponseTime(): number {
  if (state.metrics.responseTimes.length === 0) return 0;
  const sum = state.metrics.responseTimes.reduce((a, b) => a + b, 0);
  return Math.round(sum / state.metrics.responseTimes.length);
}

function checkThresholds(): void {
  const errorRate = calculateErrorRate();
  const avgResponseTime = calculateAverageResponseTime();
  
  // Check error rate
  if (errorRate > CONFIG.thresholds.errorRate) {
    const alert = `ERROR RATE HIGH: ${(errorRate * 100).toFixed(2)}% (threshold: ${CONFIG.thresholds.errorRate * 100}%)`;
    if (!state.alerts.includes(alert)) {
      state.alerts.push(alert);
      log.error(alert);
    }
  }
  
  // Check response time
  if (avgResponseTime > CONFIG.thresholds.responseTime) {
    const alert = `SLOW RESPONSES: ${avgResponseTime}ms average (threshold: ${CONFIG.thresholds.responseTime}ms)`;
    if (!state.alerts.includes(alert)) {
      state.alerts.push(alert);
      log.warn(alert);
    }
  }
  
  // Check auth failures (placeholder - would need actual auth metrics)
  if (state.authFailureCount > 10) {
    const alert = `AUTH FAILURES DETECTED: ${state.authFailureCount} failures`;
    if (!state.alerts.includes(alert)) {
      state.alerts.push(alert);
      log.error(alert);
    }
  }
}

// ============================================================================
// MONITORING LOOPS
// ============================================================================

async function runHealthChecks(environment: 'staging' | 'production'): Promise<void> {
  const urls = CONFIG.endpoints[environment];
  
  log.info('Running health checks...');
  
  // Check backend
  const backendHealth = await checkBackendHealth(urls.backend);
  state.checkCount++;
  
  if (backendHealth.healthy) {
    log.success(`Backend: ${backendHealth.status} (${backendHealth.responseTime}ms)`);
  } else {
    log.error(`Backend: ${backendHealth.status}${backendHealth.error ? ` - ${backendHealth.error}` : ''}`);
  }
  
  // Check frontend
  const frontendHealth = await checkFrontendHealth(urls.frontend);
  state.checkCount++;
  
  if (frontendHealth.healthy) {
    log.success(`Frontend: HTTP ${frontendHealth.statusCode} (${frontendHealth.responseTime}ms)`);
  } else {
    log.error(`Frontend: HTTP ${frontendHealth.statusCode} (${frontendHealth.responseTime}ms)`);
  }
  
  // Check thresholds
  checkThresholds();
}

async function generateReport(): Promise<void> {
  const runtime = Date.now() - state.startTime;
  const runtimeMinutes = Math.floor(runtime / 60000);
  const runtimeSeconds = Math.floor((runtime % 60000) / 1000);
  
  const errorRate = calculateErrorRate();
  const avgResponseTime = calculateAverageResponseTime();
  
  log.section('MONITORING REPORT');
  
  console.log(`Runtime: ${runtimeMinutes}m ${runtimeSeconds}s`);
  console.log(`Checks: ${state.checkCount}`);
  console.log(`Errors: ${state.errorCount} (${(errorRate * 100).toFixed(2)}%)`);
  console.log(`Slow Responses: ${state.slowResponseCount}`);
  console.log(`Avg Response Time: ${avgResponseTime}ms`);
  
  if (state.alerts.length > 0) {
    console.log(`\n${colors.red}Active Alerts:${colors.reset}`);
    state.alerts.forEach(alert => console.log(`  ⚠️  ${alert}`));
  } else {
    console.log(`\n${colors.green}✓ No active alerts${colors.reset}`);
  }
  
  // System health assessment
  console.log('\nSystem Health:');
  if (errorRate < 0.01 && avgResponseTime < 1000) {
    console.log(`${colors.green}✓ HEALTHY${colors.reset} - System performing well`);
  } else if (errorRate < 0.05 && avgResponseTime < 2000) {
    console.log(`${colors.yellow}⚠ DEGRADED${colors.reset} - Some issues detected`);
  } else {
    console.log(`${colors.red}✗ UNHEALTHY${colors.reset} - Immediate attention required`);
  }
}

// ============================================================================
// MAIN MONITORING LOOP
// ============================================================================

async function startMonitoring(environment: 'staging' | 'production'): Promise<void> {
  log.section('DEPLOYMENT MONITORING STARTED');
  console.log(`Environment: ${environment.toUpperCase()}`);
  console.log(`Backend: ${CONFIG.endpoints[environment].backend}`);
  console.log(`Frontend: ${CONFIG.endpoints[environment].frontend}`);
  console.log(`Duration: ${CONFIG.maxDuration / 60000} minutes`);
  console.log(`\nPress Ctrl+C to stop monitoring\n`);
  
  // Initial check
  await runHealthChecks(environment);
  await generateReport();
  
  // Set up intervals
  const healthInterval = setInterval(() => {
    runHealthChecks(environment);
  }, CONFIG.healthCheckInterval);
  
  const reportInterval = setInterval(() => {
    generateReport();
  }, CONFIG.reportInterval);
  
  // Stop after max duration
  const stopTimeout = setTimeout(() => {
    clearInterval(healthInterval);
    clearInterval(reportInterval);
    
    log.section('MONITORING COMPLETE');
    generateReport().then(() => {
      console.log('\n✅ 30-minute monitoring period complete');
      
      if (state.alerts.length === 0) {
        console.log('✅ No issues detected - deployment successful!');
        process.exit(0);
      } else {
        console.log('⚠️  Issues were detected during monitoring');
        console.log('Review the alerts above and take action if needed');
        process.exit(1);
      }
    });
  }, CONFIG.maxDuration);
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(healthInterval);
    clearInterval(reportInterval);
    clearTimeout(stopTimeout);
    
    log.section('MONITORING STOPPED (USER)');
    generateReport().then(() => {
      process.exit(0);
    });
  });
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log(`\n${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║       REAL-TIME DEPLOYMENT MONITOR                        ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  const environment = (process.argv[2] || 'staging') as 'staging' | 'production';
  
  if (!['staging', 'production'].includes(environment)) {
    console.error('Usage: npx ts-node scripts/monitor-deployment.ts [staging|production]');
    process.exit(1);
  }
  
  await startMonitoring(environment);
}

main().catch(error => {
  console.error('Monitor failed:', error);
  process.exit(1);
});
