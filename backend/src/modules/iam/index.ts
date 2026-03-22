/**
 * IAM Module - Identity and Access Management
 * 
 * Responsibilities:
 * - User authentication (Clerk)
 * - Password management
 * - Core user identity records
 * 
 * NOTE: JWT authentication removed - using Clerk exclusively
 */

// Controllers
export * as AuthController from './controllers/AuthController';

// Services
export * as AuthService from './services/AuthService';
export * as PasswordService from './services/PasswordService';

// Repositories
export * as UserRepository from './repositories/UserRepository';

// Types
export { AuthError, LoginCredentials, RegisterData, AuthResult } from './services/AuthService';
