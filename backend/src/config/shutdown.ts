/**
 * Graceful Shutdown Configuration
 * Handle process signals and cleanup
 */

import { Server } from 'http';
import { logger } from '../modules/shared/utils/logger';

/**
 * Setup graceful shutdown handlers
 */
export const setupGracefulShutdown = (server: Server): void => {
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
};
