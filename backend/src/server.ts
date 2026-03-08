/**
 * MuslimEEN Backend Server
 * Main entry point with comprehensive observability
 */

import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import routes from './modules/routes';
import healthRoutes from './routes/health';
import { logger, requestLogger } from './modules/shared/utils/logger';
import { errorHandler, notFound } from './modules/shared/middleware/errorHandler';
import { performanceMonitor } from './modules/shared/middleware/performance';
import { initSentry, setupSentryRequestHandlers, setupSentryErrorHandler } from './config/sentry';

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy (required for Render and express-rate-limit)
app.set('trust proxy', 1);

// Initialize Sentry before any other middleware
initSentry(app);

// Sentry request handlers (must be first)
setupSentryRequestHandlers(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));

// CORS configuration - Allow all origins in development
const allowedOrigins = [
  'https://muslimeen.org',
  'https://www.muslimeen.org',
  'https://app.muslimeen.org',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5500'
];

// Add FRONTEND_URL from environment if provided
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Support multiple frontend URLs (comma-separated)
if (process.env.FRONTEND_URLS) {
  const additionalUrls = process.env.FRONTEND_URLS.split(',').map(url => url.trim());
  allowedOrigins.push(...additionalUrls);
}

app.use(cors({
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Check if origin matches allowed origins or vercel.app pattern
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith('.vercel.app') ||
                      origin.includes('vercel.app');
    
    if (isAllowed) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With', 'X-Correlation-Id']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging with correlation IDs
app.use(requestLogger);

// Performance monitoring
app.use(performanceMonitor);

// Health check routes (before API routes for faster response)
app.use('/', healthRoutes);

// API routes
app.use('/api', routes);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'MuslimEEN API',
    version: process.env.npm_package_version || '1.0.0',
    status: 'running',
    environment: NODE_ENV,
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

// 404 handler
app.use(notFound);

// Sentry error handler (must be before other error handlers)
setupSentryErrorHandler(app);

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`MuslimEEN API server running on port ${PORT}`, {
    port: PORT,
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { 
    error: error.message, 
    stack: error.stack 
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', { 
    reason: String(reason),
    promise: String(promise) 
  });
});

export default app;
