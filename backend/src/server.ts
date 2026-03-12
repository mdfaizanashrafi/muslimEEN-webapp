/**
 * MuslimEEN Backend Server
 * Refactored main entry point with modular configuration
 */

import dotenv from 'dotenv';
dotenv.config();

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
import { initSentry, setupSentryRequestHandlers, setupSentryErrorHandler } from './config/sentry';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// INITIALIZATION
// ============================================================================

// Trust proxy configuration
configureTrustProxy(app);

// Sentry initialization
initSentry(app);
setupSentryRequestHandlers(app);

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

app.use(helmetConfig);
app.use(cors(corsConfig));
app.use(express.json({ limit: '1mb', strict: true }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
initializeCookieParser(app);
app.use(addRequestId);
app.use(sanitizeInput);
app.use(xssProtection);
app.use(autoSanitizeJson);
app.use(securityHeaders);

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

// API routes
app.use('/api', router);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'MuslimEEN API',
    version: process.env.npm_package_version || '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
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
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Setup graceful shutdown
setupGracefulShutdown(server);

export default app;
