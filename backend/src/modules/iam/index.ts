/**
 * IAM Module - Identity and Access Management
 * 
 * Responsibilities:
 * - User authentication (login/logout)
 * - JWT token generation and validation
 * - Password management
 * - Core user identity records
 */

// Controllers
export * as AuthController from './controllers/AuthController';

// Services
export * as AuthService from './services/AuthService';
export * as JwtService from './services/JwtService';
export * as PasswordService from './services/PasswordService';

// Repositories
export * as UserRepository from './repositories/UserRepository';

// Types
export { AuthError, LoginCredentials, RegisterData, AuthResult } from './services/AuthService';
