/**
 * Shared Types - Single Source of Truth
 * 
 * This module re-exports types from the authoritative source (src/types).
 * In the future, types will be colocated with their modules.
 * 
 * @deprecated Import from '@/types' directly instead
 */

import { Request } from 'express';

// Re-export all types from root types directory
export * from '../../../types';

// ============================================================================
// Express Extension Types (defined here as they need module augmentation)
// ============================================================================

/**
 * Authenticated request type
 */
export interface AuthRequest extends Request {
  user?: import('../../../types').User;
}

/**
 * Optional authenticated request type
 */
export interface OptionalAuthRequest extends Request {
  user?: import('../../../types').User;
}
