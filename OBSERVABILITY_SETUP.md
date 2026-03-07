# MuslimEEN Observability Setup Guide

Quick setup guide for the comprehensive observability features in MuslimEEN.

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will install the new Sentry packages (`@sentry/node`, `@sentry/tracing`).

### 2. Create Logs Directory

```bash
mkdir -p backend/logs
```

### 3. Configure Environment Variables

Copy the example environment file and update it:

```bash
cp backend/.env.example backend/.env
```

Update the following variables in `backend/.env`:

```env
# Logging
LOG_LEVEL=info                    # debug, info, warn, error
LOG_TO_CONSOLE=false              # Force console output in production

# Sentry (optional - get DSN from sentry.io)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Alerting (optional)
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/xxx/xxx/xxx
```

### 4. Start the Server

```bash
npm run dev
```

## Verification

### Test Health Endpoints

```bash
# Comprehensive health check
curl http://localhost:3001/health

# Liveness probe
curl http://localhost:3001/health/live

# Readiness probe
curl http://localhost:3001/health/ready

# Startup probe
curl http://localhost:3001/health/startup

# Detailed metrics
curl http://localhost:3001/metrics
```

### Check Logs

```bash
# View combined logs
tail -f backend/logs/combined.log

# View error logs
tail -f backend/logs/error.log
```

### Test Correlation IDs

```bash
# Request with correlation ID
curl -H "X-Correlation-Id: test-123" http://localhost:3001/health

# Response will include X-Correlation-Id header
```

## Features Overview

### ✅ Structured Logging

- JSON formatted logs with timestamps
- Correlation IDs for request tracing
- Separate error and combined log files
- Console output in development

### ✅ Health Checks

- `/health` - Comprehensive health check
- `/health/live` - Kubernetes liveness probe
- `/health/ready` - Kubernetes readiness probe
- `/health/startup` - Kubernetes startup probe
- `/metrics` - Detailed system metrics

### ✅ Error Tracking (Sentry)

- Automatic error capture
- Performance monitoring
- User context tracking
- Release tracking
- Sensitive data filtering

### ✅ Performance Monitoring

- Request timing with thresholds
- Slow request detection (>1000ms)
- Database query performance tracking
- In-memory metrics aggregation

### ✅ Alerting

- Configurable thresholds
- Error rate monitoring (>5%)
- Memory usage alerts (>85%)
- Response time alerts (>2000ms)
- Webhook notifications

## Configuration Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Minimum log level | `info` |
| `LOG_TO_CONSOLE` | Force console output | `false` |
| `SENTRY_DSN` | Sentry Data Source Name | - |
| `ALERT_WEBHOOK_URL` | Alert webhook URL | - |

## Troubleshooting

### Logs not appearing

1. Check the logs directory exists: `ls -la backend/logs/`
2. Check directory permissions
3. Verify `LOG_LEVEL` is set correctly

### Health checks failing

1. Verify database is running
2. Check database credentials in `.env`
3. Review error logs

### Sentry not receiving errors

1. Verify `SENTRY_DSN` is set
2. Check DSN is correct
3. Review logs for Sentry initialization messages

## Next Steps

1. Read the full [Observability Documentation](docs/OBSERVABILITY.md)
2. Set up Sentry account at https://sentry.io
3. Configure alert webhooks for your team
4. Set up Kubernetes probes (if applicable)
5. Integrate with Prometheus/Grafana (optional)

## Support

For issues or questions:
1. Check the logs in `backend/logs/`
2. Review the health endpoints
3. Consult the main [Observability Documentation](docs/OBSERVABILITY.md)
