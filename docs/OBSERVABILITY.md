# MuslimEEN Observability Guide

Comprehensive observability documentation for the MuslimEEN backend platform.

## Table of Contents

- [Overview](#overview)
- [Structured Logging](#structured-logging)
- [Health Checks](#health-checks)
- [Error Tracking with Sentry](#error-tracking-with-sentry)
- [Performance Monitoring](#performance-monitoring)
- [Alerting](#alerting)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

## Overview

The MuslimEEN backend implements comprehensive observability using:

- **Structured Logging**: Winston with JSON formatting and correlation IDs
- **Health Checks**: Multi-level health endpoints for Kubernetes and monitoring
- **Error Tracking**: Sentry integration for error monitoring
- **Performance Monitoring**: Request timing and slow query detection
- **Alerting**: Configurable alerts based on thresholds

## Structured Logging

### Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| `error` | System errors, exceptions, failed operations | Database connection failure |
| `warn` | Warning conditions, recoverable issues | Slow request, high memory usage |
| `info` | Normal operations, significant events | Request completed, user login |
| `debug` | Detailed debugging information | Query execution, function calls |

### Log Format

All logs are structured as JSON with the following fields:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "service": "muslimeen-api",
  "message": "Request completed",
  "correlationId": "1705315800123-abc123",
  "method": "GET",
  "path": "/api/users",
  "duration": 45,
  "statusCode": 200
}
```

### Correlation IDs

Every request is assigned a unique correlation ID for distributed tracing:

- **Header**: `X-Correlation-Id` (sent in response)
- **Request Header**: `X-Correlation-Id` (optional, to continue a trace)
- **Log Field**: All logs include `correlationId` for request correlation

### Log Files

- **Combined logs**: `backend/logs/combined.log`
- **Error logs**: `backend/logs/error.log` (error level only)
- **Console**: Enabled in development or when `LOG_TO_CONSOLE=true`

### Using the Logger

```typescript
import { logger } from './utils/logger';

// Basic logging
logger.info('User logged in', { userId: '123' });

// Error logging with stack trace
logger.error('Database error', error);

// With correlation ID (automatic in request context)
logger.debug('Processing request', { correlationId: req.correlationId });
```

## Health Checks

### Endpoints

#### 1. Comprehensive Health Check
```
GET /health
```

Returns overall system health status with detailed checks:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "responseTime": 25,
  "checks": [
    {
      "name": "database",
      "status": "healthy",
      "responseTime": 15
    },
    {
      "name": "memory",
      "status": "healthy",
      "message": "Heap: 124MB / 512MB (24%), System: 45% used"
    }
  ],
  "metrics": {
    "uptime": "24h 15m",
    "memory": {
      "used": "124MB",
      "total": "512MB"
    },
    "loadAverage": ["0.52", "0.48", "0.45"]
  }
}
```

Status codes:
- `200` - All checks healthy
- `200` (with degraded) - Some checks degraded
- `503` - One or more checks unhealthy

#### 2. Liveness Probe (Kubernetes)
```
GET /health/live
```

Simple check for Kubernetes liveness probe:

```json
{
  "status": "alive",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 87420
}
```

#### 3. Readiness Probe (Kubernetes)
```
GET /health/ready
```

Checks if application can serve traffic:

```json
{
  "status": "ready",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": [
    {
      "name": "database",
      "status": "healthy",
      "responseTime": 12
    }
  ]
}
```

Status codes:
- `200` - Ready to serve traffic
- `503` - Not ready (database unavailable, etc.)

#### 4. Startup Probe (Kubernetes)
```
GET /health/startup
```

Checks if application has started successfully:

```json
{
  "status": "started",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": [
    {
      "name": "database",
      "status": "healthy",
      "responseTime": 18
    }
  ]
}
```

#### 5. Detailed Metrics
```
GET /metrics
```

Returns detailed system and process metrics:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "system": {
    "platform": "linux",
    "arch": "x64",
    "release": "5.15.0",
    "hostname": "muslimeen-api-1",
    "cpus": 4,
    "totalMemory": 8192,
    "freeMemory": 4096,
    "loadAverage": [0.52, 0.48, 0.45]
  },
  "process": {
    "pid": 12345,
    "version": "v18.17.0",
    "uptime": 87420,
    "memory": { /* memory usage */ },
    "cpuUsage": { /* CPU usage */ }
  },
  "database": {
    "status": "healthy",
    "responseTime": 12
  }
}
```

### Health Check Components

| Component | Description | Thresholds |
|-----------|-------------|------------|
| Database | PostgreSQL connectivity | Response < 2000ms |
| Memory | Heap and system memory | Warning at 85%, Critical at 95% |
| Disk | Disk space availability | Warning at 90% |
| Uptime | Application uptime | Informational |

## Error Tracking with Sentry

### Configuration

Set the following environment variables:

```bash
# Required for Sentry
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Optional
NODE_ENV=production
npm_package_version=1.0.0
```

### Features

- **Error Capture**: Automatic exception tracking
- **Performance Monitoring**: Request tracing
- **User Context**: Track errors by user
- **Breadcrumbs**: Debug trail
- **Release Tracking**: Error attribution to releases

### Using Sentry

```typescript
import { 
  captureError, 
  setUserContext, 
  clearUserContext,
  addBreadcrumb 
} from './config/sentry';

// Capture an error
try {
  await riskyOperation();
} catch (error) {
  captureError(error, { component: 'PaymentService', operation: 'process' });
}

// Set user context (after login)
setUserContext({ id: '123', email: 'user@example.com', role: 'admin' });

// Clear user context (on logout)
clearUserContext();

// Add breadcrumb for debugging trail
addBreadcrumb('Payment initiated', 'payment', 'info', { amount: 100 });
```

### Sensitive Data Filtering

Sentry automatically filters:
- Cookies
- Authorization headers
- Password fields

### Sentry Dashboard

Access your Sentry dashboard at: `https://sentry.io/organizations/{your-org}/`

## Performance Monitoring

### Thresholds

| Level | Threshold | Action |
|-------|-----------|--------|
| Warning | > 500ms | Log info |
| Slow | > 1000ms | Log warning |
| Critical | > 5000ms | Log error with details |

### Response Time Header

In non-production environments, response times are included in the header:

```
X-Response-Time: 45.23ms
```

### Slow Request Logging

Slow requests are automatically logged with:
- Method and path
- Route pattern
- Duration
- Status code
- User ID (if authenticated)
- Correlation ID
- Query parameters
- Request body size

### Performance Metrics API

Access aggregated metrics programmatically:

```typescript
import { 
  getPerformanceMetrics, 
  getPerformanceSummary,
  resetPerformanceMetrics 
} from './middleware/performance';

// Get per-route metrics
const metrics = getPerformanceMetrics();
// Returns: { "GET /api/users": { count, avgDuration, slowRequests, ... } }

// Get summary
const summary = getPerformanceSummary();
// Returns: { totalRequests, totalSlowRequests, errorRate, ... }

// Reset metrics
resetPerformanceMetrics();
```

### Database Performance

Slow database queries are automatically detected and logged:

```typescript
import { databasePerformanceTracker } from './middleware/performance';

const start = Date.now();
const result = await pool.query('SELECT * FROM large_table');
databasePerformanceTracker('large_table_query', Date.now() - start);
```

## Alerting

### Default Alert Configurations

| Alert Type | Threshold | Window | Severity |
|------------|-----------|--------|----------|
| Error Rate | > 5% | 5 min | Critical |
| Response Time | > 2000ms | 5 min | Warning |
| Memory Usage | > 85% | 1 min | Warning |
| Disk Space | > 90% | 5 min | Critical |
| CPU Usage | > 80% | 5 min | Warning |

### Alert Payload

```json
{
  "type": "error_rate",
  "severity": "critical",
  "threshold": 0.05,
  "currentValue": 0.08,
  "message": "High error rate detected: 8.00% (threshold: 5.00%)",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "triggerCount": 3
}
```

### Webhook Notifications

Configure webhook URL for external notifications:

```bash
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/xxx/xxx/xxx
```

### Using Alerts

```typescript
import { 
  checkAlertConditions,
  getAlertConfigs,
  updateAlertConfig,
  acknowledgeAlert,
  getAlertStates 
} from './config/alerts';

// Check metrics against thresholds
checkAlertConditions({
  errorRate: 0.08,
  avgResponseTime: 2500,
  memoryPercent: 90,
});

// Get alert configurations
const configs = getAlertConfigs();

// Update configuration
updateAlertConfig('error_rate', { threshold: 0.1, enabled: true });

// Acknowledge an alert (silence notifications)
acknowledgeAlert('error_rate');

// Get current alert states
const states = getAlertStates();
```

### Rate Limiting

Alerts are rate-limited based on their `window` configuration to prevent alert fatigue.

## Environment Variables

### Logging

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Minimum log level (debug/info/warn/error) | `info` |
| `LOG_TO_CONSOLE` | Force console output in production | `false` |

### Sentry

| Variable | Description | Required |
|----------|-------------|----------|
| `SENTRY_DSN` | Sentry Data Source Name | No |

### Alerting

| Variable | Description | Required |
|----------|-------------|----------|
| `ALERT_WEBHOOK_URL` | Webhook URL for alert notifications | No |

### General

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `npm_package_version` | Application version | `1.0.0` |

## Troubleshooting

### Logs Not Writing to Files

1. Check directory permissions:
   ```bash
   ls -la backend/logs/
   ```

2. Ensure logs directory exists:
   ```bash
   mkdir -p backend/logs
   ```

3. Check disk space:
   ```bash
   df -h
   ```

### Sentry Not Receiving Errors

1. Verify `SENTRY_DSN` is set correctly
2. Check network connectivity to Sentry
3. Review Sentry rate limits
4. Check logs for Sentry initialization messages

### Health Checks Failing

1. **Database**: Verify PostgreSQL is running and accessible
2. **Memory**: Check for memory leaks in application
3. **Disk**: Clean up log files if disk is full

### High Error Rate Alerts

1. Check logs for error patterns
2. Review Sentry for error details
3. Check database connection pool
4. Verify external service dependencies

### Performance Issues

1. Check slow query logs
2. Review database indexes
3. Monitor memory usage
4. Check CPU load averages

## Integration Examples

### Docker Compose Health Check

```yaml
services:
  api:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health/ready"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 5

startupProbe:
  httpGet:
    path: /health/startup
    port: 3001
  failureThreshold: 30
  periodSeconds: 10
```

### Prometheus Metrics Endpoint

The `/metrics` endpoint can be scraped by Prometheus:

```yaml
scrape_configs:
  - job_name: 'muslimeen-api'
    static_configs:
      - targets: ['api:3001']
    metrics_path: /metrics
```

## Support

For observability issues:

1. Check this documentation
2. Review application logs
3. Check Sentry dashboard
4. Contact the development team
