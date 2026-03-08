/**
 * Shared Types
 */

import { Request } from 'express';
import { User } from '../../../types';

/**
 * Authenticated request type
 */
export interface AuthRequest extends Request {
  user?: User;
}

/**
 * Optional authenticated request type
 */
export interface OptionalAuthRequest extends Request {
  user?: User;
}
