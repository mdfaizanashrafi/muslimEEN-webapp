/**
 * Main Entry Point
 * MuslimEEN Backend
 * 
 * This file serves as the central export point for the application.
 * It re-exports all modules for clean imports throughout the codebase.
 */

// Application
export { default as app } from './app';
export { default as server } from './server';

// Routes
export { default as routes } from './routes';

// Configuration
export * from './config/env';
export * from './config/database';

// Utils
export * from './utils/logger';
export * from './utils/helpers';

// Middleware
export * from './middleware/auth';
export * from './middleware/errorHandler';
export * from './middleware/validation';
export * from './middleware/rateLimiter';

// Types
export * from './types';
