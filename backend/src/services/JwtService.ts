/**
 * JWT Service
 * Handles JWT token generation and verification
 * Pure service - No database operations
 */

import jwt from 'jsonwebtoken';
import { UserRole, JWTPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Generate JWT token for user
 * @param user User data
 * @returns JWT token string
 */
export const generateToken = (user: TokenPayload): string => {
  const payload: JWTPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] 
  });
};

/**
 * Verify JWT token
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
};

/**
 * Decode JWT token without verification
 * @param token JWT token string
 * @returns Decoded payload or null
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
};

/**
 * Get token expiration time
 * @returns Date object when tokens expire
 */
export const getTokenExpiration = (): Date => {
  const expiresIn = JWT_EXPIRES_IN;
  const match = expiresIn.match(/^(\d+)([hdm])$/);
  
  if (!match) {
    // Default 24 hours
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  const multiplier = {
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    m: 60 * 1000,
  }[unit] || 24 * 60 * 60 * 1000;

  return new Date(Date.now() + value * multiplier);
};
