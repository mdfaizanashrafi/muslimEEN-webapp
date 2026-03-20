/**
 * MuslimEEN Backend Server
 * Production-ready entry point with comprehensive security
 */

import dotenv from 'dotenv';
dotenv.config();

// Environment is validated on import via side-effect
import { env } from './config/env';

import express, { Request, Response } from 'express';
import cors from 'cors';

// Configuration modules
import { corsConfig } from './config/cors';
import { helmetConfig, initializeCookieParser, configureTrustProxy } from './config/security';
import { setupGracefulShutdown } from './config/shutdown';

// Route modules
import router from './modules/router';
import healthRoutes from './routes/health';

// Middleware
import { logger, requestLogger } from './modules/shared/utils/logger';
import { errorHandler, notFound } from './modules/shared/middleware/errorHandler';
import { performanceMonitor } from './modules/shared/middleware/performance';
import { sanitizeInput, xssProtection } from './modules/shared/middleware/sanitization';
import { securityHeaders, autoSanitizeJson, addRequestId } from './modules/shared/middleware/secureResponse';
import { securityAudit } from './modules/shared/middleware/securityAudit';
import { initSentry, setupSentryRequestHandlers, setupSentryErrorHandler } from './config/sentry';
import { csrfTokenSetter } from './modules/shared/middleware/csrf';
import { readOnlyMode } from './modules/shared/middleware/readOnlyMode';
import { isReadOnlyMode } from './config/env';

// Initialize Express app
const app = express();
const PORT = env.PORT;

// ============================================================================
// INITIALIZATION
// ============================================================================

// Trust proxy configuration
configureTrustProxy(app);

// Sentry initialization
initSentry(app);
setupSentryRequestHandlers(app);

// ============================================================================
// SECURITY MIDDLEWARE (ORDER MATTERS)
// ============================================================================

app.use(helmetConfig);
app.use(cors(corsConfig));

// Cookie parser must be before CSRF
initializeCookieParser(app);

// CSRF token setter - available on all routes
app.use(csrfTokenSetter);

app.use(express.json({ limit: '1mb', strict: true }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(addRequestId);
app.use(securityAudit);
app.use(sanitizeInput);
app.use(xssProtection);
app.use(autoSanitizeJson);
app.use(securityHeaders);

// Read-only mode check - blocks write operations when SYSTEM_READ_ONLY=true
// Must be after body parsing but before route handling
app.use(readOnlyMode);

// ============================================================================
// LOGGING & MONITORING
// ============================================================================

app.use(requestLogger);
app.use(performanceMonitor);

// ============================================================================
// ROUTES
// ============================================================================

// Health check routes (before API routes)
app.use('/', healthRoutes);

// API routes (includes webhooks at /api/webhooks/*)
app.use('/api', router);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'MuslimEEN API',
    version: env.npm_package_version,
    status: 'running',
    environment: env.NODE_ENV,
    readOnlyMode: isReadOnlyMode(),
    documentation: '/api',
    health: '/health',
    observability: {
      health: '/health',
      liveness: '/health/live',
      readiness: '/health/ready',
      startup: '/health/startup',
      metrics: '/metrics',
    }
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use(notFound);
setupSentryErrorHandler(app);
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(PORT, () => {
  logger.info(`MuslimEEN API server running`, {
    port: PORT,
    environment: env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Setup graceful shutdown
setupGracefulShutdown(server);

export default app;
