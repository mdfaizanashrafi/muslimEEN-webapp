#!/usr/bin/env ts-node
/**
 * Real-Time Monitoring Dashboard
 * 
 * Provides a live-updating view of system health.
 * 
 * Usage:
 *   npx ts-node scripts/monitor-dashboard.ts [production|staging]
 * 
 * DATE: 2026-03-20
 */

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'critical';
  responseTime: number;
  errors: number;
}

async function clearScreen(): Promise<void> {
  console.clear();
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'healthy': return colors.green;
    case 'degraded': return colors.yellow;
    case 'critical': return colors.red;
    default: return colors.gray;
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'healthy': return '✅';
    case 'degraded': return '⚠️';
    case 'critical': return '🚨';
    default: return '❓';
  }
}

async function checkBackend(url: string): Promise<HealthStatus> {
  const start = Date.now();
  try {
    const response = await fetch(`${url}/api/health/auth`, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    const responseTime = Date.now() - start;
    
    if (!response.ok) {
      return { status: 'critical', responseTime, errors: 1 };
    }
    
    const data = await response.json();
    
    if (data.status === 'healthy') {
      return { status: 'healthy', responseTime, errors: 0 };
    } else if (data.status === 'degraded') {
      return { status: 'degraded', responseTime, errors: data.errors?.length || 0 };
    }
    
    return { status: 'critical', responseTime, errors: 1 };
  } catch (error) {
    return { status: 'critical', responseTime: Date.now() - start, errors: 1 };
  }
}

async function checkFrontend(url: string): Promise<HealthStatus> {
  const start = Date.now();
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const responseTime = Date.now() - start;
    
    return {
      status: response.ok ? 'healthy' : 'critical',
      responseTime,
      errors: response.ok ? 0 : 1,
    };
  } catch (error) {
    return { status: 'critical', responseTime: Date.now() - start, errors: 1 };
  }
}

function drawHeader(): void {
  console.log(`${colors.cyan}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║           MUSLIMEEN SYSTEM HEALTH DASHBOARD                  ║${colors.reset}`);
  console.log(`${colors.cyan}╚══════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log();
}

function drawStatusSection(
  title: string, 
  status: HealthStatus, 
  url: string
): void {
  const statusColor = getStatusColor(status.status);
  const emoji = getStatusEmoji(status.status);
  
  console.log(`${colors.bold}${title}${colors.reset}`);
  console.log(`  URL: ${colors.gray}${url}${colors.reset}`);
  console.log(`  Status: ${statusColor}${emoji} ${status.status.toUpperCase()}${colors.reset}`);
  console.log(`  Response: ${statusColor}${status.responseTime}ms${colors.reset}`);
  
  if (status.errors > 0) {
    console.log(`  ${colors.red}Errors: ${status.errors}${colors.reset}`);
  }
  console.log();
}

function drawMetrics(backend: HealthStatus, frontend: HealthStatus): void {
  console.log(`${colors.bold}📊 QUICK METRICS${colors.reset}`);
  
  const overallStatus = backend.status === 'critical' || frontend.status === 'critical' 
    ? 'critical' 
    : backend.status === 'degraded' || frontend.status === 'degraded' 
      ? 'degraded' 
      : 'healthy';
  
  const statusColor = getStatusColor(overallStatus);
  const emoji = getStatusEmoji(overallStatus);
  
  console.log(`  Overall: ${statusColor}${emoji} ${overallStatus.toUpperCase()}${colors.reset}`);
  console.log(`  Backend: ${backend.responseTime}ms (${backend.status})`);
  console.log(`  Frontend: ${frontend.responseTime}ms (${frontend.status})`);
  
  const totalErrors = backend.errors + frontend.errors;
  if (totalErrors > 0) {
    console.log(`  ${colors.red}Total Issues: ${totalErrors}${colors.reset}`);
  }
  console.log();
}

function drawThresholds(): void {
  console.log(`${colors.bold}📋 THRESHOLDS${colors.reset}`);
  console.log(`  Response Time: ${colors.green}<500ms OK${colors.reset} | ${colors.yellow}<1000ms Warn${colors.reset} | ${colors.red}>2000ms Critical${colors.reset}`);
  console.log(`  Availability:  ${colors.green}>99.9% OK${colors.reset} | ${colors.yellow}>99.5% Warn${colors.reset} | ${colors.red}<99% Critical${colors.reset}`);
  console.log();
}

function drawTimestamp(): void {
  const now = new Date();
  console.log(`${colors.gray}Last updated: ${now.toLocaleString()}${colors.reset}`);
  console.log();
}

function drawFooter(): void {
  console.log(`${colors.gray}Press Ctrl+C to exit | Updates every 10 seconds${colors.reset}`);
}

async function updateDashboard(backendUrl: string, frontendUrl: string): Promise<void> {
  await clearScreen();
  
  const [backend, frontend] = await Promise.all([
    checkBackend(backendUrl),
    checkFrontend(frontendUrl),
  ]);
  
  drawHeader();
  drawStatusSection('🔧 BACKEND', backend, backendUrl);
  drawStatusSection('🌐 FRONTEND', frontend, frontendUrl);
  drawMetrics(backend, frontend);
  drawThresholds();
  drawTimestamp();
  drawFooter();
}

async function main(): Promise<void> {
  const environment = (process.argv[2] || 'production') as 'production' | 'staging';
  
  const urls = {
    production: {
      backend: 'https://muslimeen-api.onrender.com',
      frontend: 'https://muslimeen.org',
    },
    staging: {
      backend: 'https://muslimeen-api-staging.onrender.com',
      frontend: 'https://muslimeen-staging.vercel.app',
    },
  };
  
  const { backend, frontend } = urls[environment];
  
  console.log('Starting dashboard...');
  
  // Initial update
  await updateDashboard(backend, frontend);
  
  // Update every 10 seconds
  const interval = setInterval(() => {
    updateDashboard(backend, frontend).catch(console.error);
  }, 10000);
  
  // Handle exit
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\n\nDashboard stopped.');
    process.exit(0);
  });
}

main().catch(console.error);
