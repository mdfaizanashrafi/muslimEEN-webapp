/**
 * Express Application Configuration
 * MuslimEEN Backend
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { env } from './config/env';
import { logger } from './utils/logger';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();
const NODE_ENV = env.NODE_ENV || 'development';

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

app.use(cors({
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// API routes
app.use('/api', routes);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'MuslimEEN API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api',
    health: '/health'
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: NODE_ENV
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

export default app;
