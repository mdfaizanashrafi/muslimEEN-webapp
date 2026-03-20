/**
 * Health Check Routes
 * Comprehensive health checks for monitoring and Kubernetes probes
 */

import { Router, Request, Response } from 'express';
import os from 'os';
import { env, isReadOnlyMode } from '../config/env';
import pool from '../modules/database/pool';
import { logger } from '../modules/shared/utils/logger';

const router = Router();

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  message?: string;
}

interface HealthMetrics {
  uptime: number;
  memory: NodeJS.MemoryUsage;
  cpu: NodeJS.CpuUsage;
  loadAverage: number[];
}

// Track recent response times for trend analysis
const responseTimeHistory: number[] = [];
const MAX_HISTORY = 100;

// Database health check with connection pool status
const checkDatabase = async (): Promise<HealthCheck> => {
  const start = Date.now();
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return {
        name: 'database',
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Database health check failed', { error: (error as Error).message });
    return {
      name: 'database',
      status: 'unhealthy',
      message: (error as Error).message,
    };
  }
};

// Memory health check with detailed metrics
const checkMemory = (): HealthCheck => {
  const used = process.memoryUsage();
  const total = os.totalmem();
  const free = os.freemem();
  const percentUsed = ((total - free) / total) * 100;
  const heapPercentUsed = (used.heapUsed / used.heapTotal) * 100;
  
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  let message = `Heap: ${Math.round(used.heapUsed / 1024 / 1024)}MB / ${Math.round(used.heapTotal / 1024 / 1024)}MB (${Math.round(heapPercentUsed)}%), System: ${Math.round(percentUsed)}% used`;
  
  if (percentUsed > 95 || heapPercentUsed > 95) {
    status = 'unhealthy';
    message = `CRITICAL: ${message}`;
  } else if (percentUsed > 85 || heapPercentUsed > 85) {
    status = 'degraded';
    message = `WARNING: ${message}`;
  }
  
  return {
    name: 'memory',
    status,
    message,
  };
};

// Disk space check (using simple heuristics)
const checkDiskSpace = (): HealthCheck => {
  const used = process.memoryUsage();
  const rssMB = Math.round(used.rss / 1024 / 1024);
  
  return {
    name: 'disk',
    status: 'healthy',
    message: `Process RSS: ${rssMB}MB (Note: Install 'check-disk-space' for actual disk monitoring)`,
  };
};

// Application uptime check
const checkUptime = (): HealthCheck => {
  const uptime = process.uptime();
  const uptimeHours = Math.floor(uptime / 3600);
  const uptimeMinutes = Math.floor((uptime % 3600) / 60);
  
  return {
    name: 'uptime',
    status: 'healthy',
    message: `${uptimeHours}h ${uptimeMinutes}m`,
  };
};

// Response time trend analysis
const getResponseTimeTrend = (): { average: number; p95: number; p99: number } => {
  if (responseTimeHistory.length === 0) {
    return { average: 0, p95: 0, p99: 0 };
  }
  
  const sorted = [...responseTimeHistory].sort((a, b) => a - b);
  const average = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1];
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || sorted[sorted.length - 1];
  
  return { average, p95, p99 };
};

// Main health endpoint - comprehensive health check
router.get('/health', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  const checks = await Promise.all([
    checkDatabase(),
    checkMemory(),
    checkDiskSpace(),
    checkUptime(),
  ]);
  
  const isUnhealthy = checks.some(c => c.status === 'unhealthy');
  const isDegraded = checks.some(c => c.status === 'degraded') && !isUnhealthy;
  
  const statusCode = isUnhealthy ? 503 : 200;
  const overallStatus = isUnhealthy ? 'unhealthy' : isDegraded ? 'degraded' : 'healthy';
  
  const responseTime = Date.now() - startTime;
  
  // Track response time
  responseTimeHistory.push(responseTime);
  if (responseTimeHistory.length > MAX_HISTORY) {
    responseTimeHistory.shift();
  }
  
  const metrics: HealthMetrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    loadAverage: os.loadavg(),
  };
  
  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: env.npm_package_version,
    environment: env.NODE_ENV,
    readOnlyMode: isReadOnlyMode(),
    responseTime,
    checks,
    metrics: {
      uptime: `${Math.floor(metrics.uptime / 3600)}h ${Math.floor((metrics.uptime % 3600) / 60)}m`,
      memory: {
        used: `${Math.round(metrics.memory.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(metrics.memory.heapTotal / 1024 / 1024)}MB`,
        percentUsed: Math.round((metrics.memory.heapUsed / metrics.memory.heapTotal) * 100),
      },
      loadAverage: metrics.loadAverage.map(l => l.toFixed(2)),
    },
  };
  
  // Log health check failures
  if (isUnhealthy || isDegraded) {
    logger.warn('Health check detected issues', {
      status: overallStatus,
      failedChecks: checks.filter(c => c.status !== 'healthy').map(c => c.name),
    });
  }
  
  res.status(statusCode).json(response);
});

// Liveness probe (Kubernetes)
// Simple check - is the process running?
router.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Readiness probe (Kubernetes)
// Can the application serve traffic?
router.get('/health/ready', async (_req: Request, res: Response) => {
  const checks = await Promise.all([
    checkDatabase(),
    checkMemory(),
  ]);
  
  const isReady = checks.every(c => c.status === 'healthy');
  
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not ready',
    timestamp: new Date().toISOString(),
    checks,
  });
});

// Startup probe (Kubernetes)
// Has the application started successfully?
router.get('/health/startup', async (_req: Request, res: Response) => {
  // Check critical dependencies
  const dbCheck = await checkDatabase();
  const isStarted = dbCheck.status === 'healthy';
  
  res.status(isStarted ? 200 : 503).json({
    status: isStarted ? 'started' : 'starting',
    timestamp: new Date().toISOString(),
    checks: [dbCheck],
  });
});

// Detailed metrics endpoint (for monitoring systems)
router.get('/metrics', async (_req: Request, res: Response) => {
  const dbCheck = await checkDatabase();
  const responseTrend = getResponseTimeTrend();
  
  res.json({
    timestamp: new Date().toISOString(),
    system: {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      hostname: os.hostname(),
      cpus: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / 1024 / 1024),
      freeMemory: Math.round(os.freemem() / 1024 / 1024),
      loadAverage: os.loadavg(),
    },
    process: {
      pid: process.pid,
      version: process.version,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    },
    database: {
      status: dbCheck.status,
      responseTime: dbCheck.responseTime,
    },
    performance: {
      responseTime: responseTrend,
      historySize: responseTimeHistory.length,
    },
  });
});

// Simple status endpoint for load balancers
router.get('/status', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    readOnlyMode: isReadOnlyMode(),
  });
});

export default router;
