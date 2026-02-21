/**
 * Authentication Types
 * TypeScript interfaces for auth module
 */

import { Request } from 'express';

/**
 * JWT Payload
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Login Request Body
 */
export interface LoginRequest {
  email: string;
  password: string;
  invitationCode?: string;
}

/**
 * Register Request Body
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  invitationCode: string;
}

/**
 * Validate Invitation Request Body
 */
export interface ValidateInvitationRequest {
  invitationCode: string;
}

/**
 * User Data (without password)
 */
export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  verificationTier: string;
  [key: string]: any;
}

/**
 * Auth Response Data
 */
export interface AuthResponse {
  success: boolean;
  token: string;
  csrfToken: string;
  user: UserData;
  message: string;
}

/**
 * User Response Data
 */
export interface UserResponse {
  success: boolean;
  user: any;
}

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  message: string;
  invitation?: any;
}

/**
 * Logout Response
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * Authenticated Request
 */
export interface AuthenticatedRequest extends Request {
  user?: UserData;
}
