#!/usr/bin/env ts-node
/**
 * Long-Term Stability Monitor
 * 
 * Monitors system stability for 24-48 hours after deployment.
 * Tracks trends, detects degradations, and generates stability reports.
 * 
 * Usage:
 *   npx ts-node scripts/long-term-monitor.ts [production|staging] [duration-hours]
 * 
 * Example:
 *   npx ts-node scripts/long-term-monitor.ts production 48
 * 
 * DATE: 2026-03-20
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  endpoints: {
    production: {
      backend: 'https://muslimeen-api.onrender.com',
      frontend: 'https://muslimeen.org',
    },
    staging: {
      backend: 'https://muslimeen-api-staging.onrender.com',
      frontend: 'https://muslimeen-staging.vercel.app',
    },
  },
  
  // Check intervals (ms)
  sampleInterval: 5 * 60 * 1000,      // 5 minutes
  reportInterval: 60 * 60 * 1000,     // 1 hour
  
  // Default duration: 48 hours
  defaultDurationHours: 48,
  
  // Stability thresholds
  thresholds: {
    errorRate: {
      warning: 0.005,     // 0.5%
      critical: 0.01,     // 1%
    },
    authFailureRate: {
      warning: 0.01,      // 1%
      critical: 0.05,     // 5%
    },
    responseTime: {
      warning: 1000,      // 1 second
      critical: 2000,     // 2 seconds
    },
    webhookSuccessRate: {
      warning: 0.95,      // 95%
      critical: 0.90,     // 90%
    },
    availability: {
      warning: 0.995,     // 99.5%
      critical: 0.99,     // 99%
    },
  },
  
  // Data retention
  maxDataPoints: 1000,  // Keep last 1000 samples
};

// Colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  reset: '\x1b[0m',
};

// ============================================================================
// DATA STORAGE
// ============================================================================

interface Sample {
  timestamp: number;
  backendHealthy: boolean;
  frontendHealthy: boolean;
  backendResponseTime: number;
  frontendResponseTime: number;
  errorDetected: boolean;
}

interface StabilityMetrics {
  startTime: number;
  totalSamples: number;
  errorCount: number;
  backendDowntime: number;
  frontendDowntime: number;
  avgBackendResponseTime: number;
  avgFrontendResponseTime: number;
  availability: number;
}

class StabilityTracker {
  private samples: Sample[] = [];
  private startTime: number = Date.now();
  private errorCount: number = 0;
  private backendFailures: number = 0;
  private frontendFailures: number = 0;
  
  addSample(sample: Sample): void {
    this.samples.push(sample);
    
    if (this.samples.length > CONFIG.maxDataPoints) {
      this.samples.shift();
    }
    
    if (sample.errorDetected) this.errorCount++;
    if (!sample.backendHealthy) this.backendFailures++;
    if (!sample.frontendHealthy) this.frontendFailures++;
  }
  
  getMetrics(): StabilityMetrics {
    const totalSamples = this.samples.length;
    if (totalSamples === 0) {
      return {
        startTime: this.startTime,
        totalSamples: 0,
        errorCount: 0,
        backendDowntime: 0,
        frontendDowntime: 0,
        avgBackendResponseTime: 0,
        avgFrontendResponseTime: 0,
        availability: 1,
      };
    }
    
    const backendResponseTimes = this.samples
      .filter(s => s.backendHealthy)
      .map(s => s.backendResponseTime);
    
    const frontendResponseTimes = this.samples
      .filter(s => s.frontendHealthy)
      .map(s => s.frontendResponseTime);
    
    const avgBackendTime = backendResponseTimes.length > 0
      ? backendResponseTimes.reduce((a, b) => a + b, 0) / backendResponseTimes.length
      : 0;
    
    const avgFrontendTime = frontendResponseTimes.length > 0
      ? frontendResponseTimes.reduce((a, b) => a + b, 0) / frontendResponseTimes.length
      : 0;
    
    const availability = (totalSamples - this.backendFailures) / totalSamples;
    
    return {
      startTime: this.startTime,
      totalSamples,
      errorCount: this.errorCount,
      backendDowntime: this.backendFailures * CONFIG.sampleInterval,
      frontendDowntime: this.frontendFailures * CONFIG.sampleInterval,
      avgBackendResponseTime: Math.round(avgBackendTime),
      avgFrontendResponseTime: Math.round(avgFrontendTime),
      availability,
    };
  }
  
  getTrends(): {
    errorRateTrend: 'improving' | 'stable' | 'degrading';
    responseTimeTrend: 'improving' | 'stable' | 'degrading';
  } {
    if (this.samples.length < 20) {
      return { errorRateTrend: 'stable', responseTimeTrend: 'stable' };
    }
    
    const half = Math.floor(this.samples.length / 2);
    const firstHalf = this.samples.slice(0, half);
    const secondHalf = this.samples.slice(half);
    
    // Error rate trend
    const firstHalfErrors = firstHalf.filter(s => s.errorDetected).length / firstHalf.length;
    const secondHalfErrors = secondHalf.filter(s => s.errorDetected).length / secondHalf.length;
    
    let errorRateTrend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (secondHalfErrors < firstHalfErrors * 0.8) errorRateTrend = 'improving';
    else if (secondHalfErrors > firstHalfErrors * 1.2) errorRateTrend = 'degrading';
    
    // Response time trend
    const firstHalfTimes = firstHalf.filter(s => s.backendHealthy).map(s => s.backendResponseTime);
    const secondHalfTimes = secondHalf.filter(s => s.backendHealthy).map(s => s.backendResponseTime);
    
    const firstAvg = firstHalfTimes.reduce((a, b) => a + b, 0) / firstHalfTimes.length;
    const secondAvg = secondHalfTimes.reduce((a, b) => a + b, 0) / secondHalfTimes.length;
    
    let responseTimeTrend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (secondAvg < firstAvg * 0.9) responseTimeTrend = 'improving';
    else if (secondAvg > firstAvg * 1.1) responseTimeTrend = 'degrading';
    
    return { errorRateTrend, responseTimeTrend };
  }
  
  saveToFile(environment: string): void {
    const data = {
      environment,
      startTime: this.startTime,
      samples: this.samples,
      metrics: this.getMetrics(),
    };
    
    const filename = `stability-report-${environment}-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(path.join(process.cwd(), 'logs', filename), JSON.stringify(data, null, 2));
  }
}

// ============================================================================
// LOGGING
// ============================================================================

const log = {
  info: (msg: string) => console.log(`${colors.blue}[MONITOR]${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}[OK]${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  metric: (msg: string) => console.log(`${colors.cyan}[METRIC]${colors.reset} ${msg}`),
  debug: (msg: string) => console.log(`${colors.gray}[DEBUG]${colors.reset} ${msg}`),
  section: (title: string) => {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}  ${title}${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);
  },
};

// ============================================================================
// MONITORING FUNCTIONS
// ============================================================================

async function collectSample(backendUrl: string, frontendUrl: string): Promise<Sample> {
  const timestamp = Date.now();
  
  // Check backend
  const backendStart = Date.now();
  let backendHealthy = false;
  let backendResponseTime = 0;
  let errorDetected = false;
  
  try {
    const backendResponse = await fetch(`${backendUrl}/api/health/auth`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    backendResponseTime = Date.now() - backendStart;
    backendHealthy = backendResponse.ok;
    
    if (!backendResponse.ok) {
      errorDetected = true;
    }
  } catch (error) {
    backendResponseTime = Date.now() - backendStart;
    backendHealthy = false;
    errorDetected = true;
  }
  
  // Check frontend
  const frontendStart = Date.now();
  let frontendHealthy = false;
  let frontendResponseTime = 0;
  
  try {
    const frontendResponse = await fetch(frontendUrl, {
      method: 'HEAD',
    });
    frontendResponseTime = Date.now() - frontendStart;
    frontendHealthy = frontendResponse.ok;
  } catch (error) {
    frontendResponseTime = Date.now() - frontendStart;
    frontendHealthy = false;
  }
  
  return {
    timestamp,
    backendHealthy,
    frontendHealthy,
    backendResponseTime,
    frontendResponseTime,
    errorDetected,
  };
}

function checkThresholds(metrics: StabilityMetrics, trends: { errorRateTrend: string; responseTimeTrend: string }): string[] {
  const alerts: string[] = [];
  
  const errorRate = metrics.totalSamples > 0 ? metrics.errorCount / metrics.totalSamples : 0;
  
  // Error rate checks
  if (errorRate > CONFIG.thresholds.errorRate.critical) {
    alerts.push(`CRITICAL: Error rate ${(errorRate * 100).toFixed(2)}% exceeds threshold ${(CONFIG.thresholds.errorRate.critical * 100).toFixed(2)}%`);
  } else if (errorRate > CONFIG.thresholds.errorRate.warning) {
    alerts.push(`WARNING: Error rate ${(errorRate * 100).toFixed(2)}% exceeds threshold ${(CONFIG.thresholds.errorRate.warning * 100).toFixed(2)}%`);
  }
  
  // Availability checks
  if (metrics.availability < CONFIG.thresholds.availability.critical) {
    alerts.push(`CRITICAL: Availability ${(metrics.availability * 100).toFixed(2)}% below threshold ${(CONFIG.thresholds.availability.critical * 100).toFixed(2)}%`);
  } else if (metrics.availability < CONFIG.thresholds.availability.warning) {
    alerts.push(`WARNING: Availability ${(metrics.availability * 100).toFixed(2)}% below threshold ${(CONFIG.thresholds.availability.warning * 100).toFixed(2)}%`);
  }
  
  // Response time checks
  if (metrics.avgBackendResponseTime > CONFIG.thresholds.responseTime.critical) {
    alerts.push(`CRITICAL: Avg response time ${metrics.avgBackendResponseTime}ms exceeds threshold ${CONFIG.thresholds.responseTime.critical}ms`);
  } else if (metrics.avgBackendResponseTime > CONFIG.thresholds.responseTime.warning) {
    alerts.push(`WARNING: Avg response time ${metrics.avgBackendResponseTime}ms exceeds threshold ${CONFIG.thresholds.responseTime.warning}ms`);
  }
  
  // Trend checks
  if (trends.errorRateTrend === 'degrading') {
    alerts.push(`WARNING: Error rate trend is degrading`);
  }
  if (trends.responseTimeTrend === 'degrading') {
    alerts.push(`WARNING: Response time trend is degrading`);
  }
  
  return alerts;
}

async function generateReport(
  tracker: StabilityTracker,
  environment: string,
  duration: number
): Promise<void> {
  const metrics = tracker.getMetrics();
  const trends = tracker.getTrends();
  const alerts = checkThresholds(metrics, trends);
  
  const runtime = Date.now() - metrics.startTime;
  const runtimeHours = runtime / (1000 * 60 * 60);
  
  log.section('STABILITY REPORT');
  
  console.log(`Environment: ${environment.toUpperCase()}`);
  console.log(`Runtime: ${runtimeHours.toFixed(1)} hours`);
  console.log(`Total Samples: ${metrics.totalSamples}`);
  console.log();
  
  console.log('Metrics:');
  console.log(`  Availability: ${(metrics.availability * 100).toFixed(3)}%`);
  console.log(`  Error Count: ${metrics.errorCount}`);
  console.log(`  Error Rate: ${((metrics.errorCount / Math.max(metrics.totalSamples, 1)) * 100).toFixed(3)}%`);
  console.log(`  Avg Backend Response: ${metrics.avgBackendResponseTime}ms`);
  console.log(`  Avg Frontend Response: ${metrics.avgFrontendResponseTime}ms`);
  console.log(`  Backend Downtime: ${(metrics.backendDowntime / 1000).toFixed(0)}s`);
  console.log();
  
  console.log('Trends:');
  console.log(`  Error Rate: ${trends.errorRateTrend}`);
  console.log(`  Response Time: ${trends.responseTimeTrend}`);
  console.log();
  
  if (alerts.length > 0) {
    console.log(`${colors.yellow}Alerts:${colors.reset}`);
    alerts.forEach(alert => console.log(`  ⚠️  ${alert}`));
    console.log();
  }
  
  // Stability assessment
  const isStable = metrics.availability >= CONFIG.thresholds.availability.warning &&
                   (metrics.errorCount / Math.max(metrics.totalSamples, 1)) < CONFIG.thresholds.errorRate.warning &&
                   alerts.filter(a => a.includes('CRITICAL')).length === 0;
  
  if (isStable) {
    console.log(`${colors.green}✅ System is STABLE${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️  System stability concerns detected${colors.reset}`);
  }
  
  // Save report
  tracker.saveToFile(environment);
}

// ============================================================================
// MAIN MONITORING LOOP
// ============================================================================

async function startMonitoring(environment: 'staging' | 'production', durationHours: number): Promise<void> {
  const urls = CONFIG.endpoints[environment];
  const tracker = new StabilityTracker();
  
  const durationMs = durationHours * 60 * 60 * 1000;
  const endTime = Date.now() + durationMs;
  
  // Ensure logs directory exists
  if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
  }
  
  log.section('LONG-TERM STABILITY MONITORING');
  console.log(`Environment: ${environment.toUpperCase()}`);
  console.log(`Backend: ${urls.backend}`);
  console.log(`Frontend: ${urls.frontend}`);
  console.log(`Duration: ${durationHours} hours`);
  console.log(`Sample Interval: ${CONFIG.sampleInterval / 1000} seconds`);
  console.log(`\nPress Ctrl+C to stop monitoring early\n`);
  
  let sampleCount = 0;
  let lastReportTime = Date.now();
  
  const runSample = async () => {
    if (Date.now() >= endTime) {
      log.section('MONITORING COMPLETE');
      await generateReport(tracker, environment, durationHours);
      console.log('\n✅ Long-term monitoring complete');
      console.log('System stability has been assessed');
      process.exit(0);
      return;
    }
    
    const sample = await collectSample(urls.backend, urls.frontend);
    tracker.addSample(sample);
    sampleCount++;
    
    const timeRemaining = Math.ceil((endTime - Date.now()) / (1000 * 60 * 60));
    
    if (sample.errorDetected) {
      log.error(`Sample ${sampleCount}: Backend ${sample.backendHealthy ? 'OK' : 'FAIL'}, Frontend ${sample.frontendHealthy ? 'OK' : 'FAIL'} (${timeRemaining}h remaining)`);
    } else {
      log.debug(`Sample ${sampleCount}: Backend ${sample.backendResponseTime}ms, Frontend ${sample.frontendResponseTime}ms (${timeRemaining}h remaining)`);
    }
    
    // Generate hourly report
    if (Date.now() - lastReportTime >= CONFIG.reportInterval) {
      await generateReport(tracker, environment, durationHours);
      lastReportTime = Date.now();
    }
    
    setTimeout(runSample, CONFIG.sampleInterval);
  };
  
  // Start sampling
  runSample();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\nMonitoring stopped by user');
    generateReport(tracker, environment, durationHours).then(() => {
      process.exit(0);
    });
  });
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log(`\n${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║       LONG-TERM STABILITY MONITOR                         ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  const environment = (process.argv[2] || 'staging') as 'staging' | 'production';
  const durationHours = parseInt(process.argv[3] || `${CONFIG.defaultDurationHours}`, 10);
  
  if (!['staging', 'production'].includes(environment)) {
    console.error('Usage: npx ts-node scripts/long-term-monitor.ts [staging|production] [duration-hours]');
    console.error(`Default duration: ${CONFIG.defaultDurationHours} hours`);
    process.exit(1);
  }
  
  await startMonitoring(environment, durationHours);
}

main().catch(error => {
  console.error('Monitor failed:', error);
  process.exit(1);
});
