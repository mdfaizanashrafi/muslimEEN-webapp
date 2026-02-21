/**
 * Server Bootstrap
 * MuslimEEN Backend Server Entry Point
 */

import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const PORT = env.PORT || 3001;
const NODE_ENV = env.NODE_ENV || 'development';

// Start server
const server = app.listen(PORT, () => {
  logger.info(`MuslimEEN API server running on port ${PORT}`);
  logger.info(`Environment: ${NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default server;
