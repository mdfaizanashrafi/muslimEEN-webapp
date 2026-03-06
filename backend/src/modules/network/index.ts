/**
 * Network Module
 * 
 * Responsibilities:
 * - Connection request management
 * - Connection graph storage
 * - Mutual connections calculation
 */

// Controllers
export * as ConnectionController from './controllers/ConnectionController';

// Services
export * as ConnectionService from './services/ConnectionService';

// Repositories
export * as ConnectionRepository from './repositories/ConnectionRepository';

// Types
export { ConnectionError } from './services/ConnectionService';
