/**
 * CORS Configuration
 * Strictly controlled cross-origin resource sharing
 */

import { CorsOptions } from 'cors';
import { env } from './env';
import { logger } from '../modules/shared/utils/logger';

// Production origins - strictly controlled
const allowedOrigins = [
  'https://muslimeen.space',
  'https://www.muslimeen.space',
  'https://app.muslimeen.space',
  'https://muslimeen-webapp.vercel.app',
];

// Add environment-specific origins
allowedOrigins.push(env.FRONTEND_URL);

if (env.FRONTEND_URLS && env.FRONTEND_URLS.length > 0) {
  allowedOrigins.push(...env.FRONTEND_URLS);
}

// Development origins (only in development)
const devOrigins = [
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:8080',
];

/**
 * CORS configuration
 * SECURITY: No wildcards in production
 */
export const corsConfig: CorsOptions = {
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // In development, allow specific localhost origins
    if (env.NODE_ENV === 'development') {
      if (devOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Block other origins even in development
      logger.warn(`CORS blocked development request from: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }
    
    // In production, strict origin checking
    const isAllowed = allowedOrigins.includes(origin);
    
    if (isAllowed) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-CSRF-Token', 
    'X-Requested-With', 
    'X-Correlation-Id'
  ],
  exposedHeaders: ['X-Correlation-Id'],
  maxAge: 86400, // 24 hours
};
