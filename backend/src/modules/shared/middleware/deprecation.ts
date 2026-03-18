/**
 * API Deprecation Middleware
 * 
 * Marks endpoints as deprecated and provides information about alternatives.
 * Follows RFC 8594 (Deprecation HTTP Header Field)
 */

import { env } from '../../../config/env';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface DeprecationOptions {
  /** Alternative endpoint or documentation URL */
  alternative: string;
  /** Sunset date (ISO 8601 format) - when endpoint will be removed */
  sunsetDate?: string;
  /** Deprecation reason for logs */
  reason?: string;
}

/**
 * Middleware to mark an endpoint as deprecated
 * 
 * Usage:
 *   router.get('/old-endpoint', deprecate({ alternative: '/v2/new-endpoint' }), handler);
 */
export const deprecate = (options: DeprecationOptions) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { alternative, sunsetDate = '2026-06-01', reason } = options;
    
    // Log deprecation warning with context
    logger.warn(`Deprecated API accessed`, {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      alternative,
      sunsetDate,
      reason,
      userAgent: req.headers['user-agent'],
      userId: (req as any).user?.id,
      ip: req.ip,
    });

    // Set RFC 8594 Deprecation header
    // @ - timestamp means deprecated since this date
    res.setHeader('Deprecation', '@' + new Date().toISOString());
    
    // Set Sunset header (RFC 8594)
    // Date when endpoint will be removed
    res.setHeader('Sunset', new Date(sunsetDate).toISOString());
    
    // Set Link header with alternative
    const linkHeader = `<${alternative}>; rel="successor-version"`;
    res.setHeader('Link', linkHeader);
    
    // Add deprecation warning to response locals (can be used in response body)
    res.locals.deprecationWarning = {
      message: `This endpoint is deprecated and will be removed on ${sunsetDate}`,
      alternative,
      documentation: `${env.API_DOCS_URL}/api/migration`,
    };
    
    next();
  };
};

/**
 * Legacy deprecation helper (simple string version)
 * @param alternative Alternative endpoint path
 * @param sunsetDate Sunset date (ISO 8601 format)
 * @deprecated Use the object version `deprecate({ alternative, sunsetDate })` instead
 */
export const deprecateLegacy = (alternative: string, sunsetDate = '2026-06-01') => {
  return deprecate({ alternative, sunsetDate });
};

/**
 * Add deprecation warning to response body
 * Call this in your route handler after using deprecate middleware
 */
export const addDeprecationToResponse = <T extends Record<string, unknown>>(
  data: T,
  res: Response
): T & { deprecation?: unknown } => {
  if (res.locals.deprecationWarning) {
    return {
      ...data,
      deprecation: res.locals.deprecationWarning,
    };
  }
  return data;
};
