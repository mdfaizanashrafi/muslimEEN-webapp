/**
 * Body Parser Middleware
 * 
 * Provides raw body parser for webhook signature verification.
 * Standard express.json() parses the body which breaks signature verification.
 * 
 * DATE: 2026-03-20
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Raw body parser - stores raw body on req.rawBody
 * Required for webhook signature verification
 */
export const raw = (options: { type?: string | string[] } = {}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip if not matching content type
    if (options.type) {
      const contentType = req.headers['content-type'] || '';
      const types = Array.isArray(options.type) ? options.type : [options.type];
      const matches = types.some(t => contentType.includes(t.replace('application/', '')));
      if (!matches) {
        return next();
      }
    }

    // Store raw body for signature verification
    let data = '';
    req.setEncoding('utf8');
    
    req.on('data', (chunk: string) => {
      data += chunk;
    });
    
    req.on('end', () => {
      (req as any).rawBody = data;
      try {
        // Also parse as JSON for convenience
        req.body = JSON.parse(data);
      } catch (e) {
        req.body = {};
      }
      next();
    });
    
    req.on('error', (err) => {
      next(err);
    });
  };
};

/**
 * JSON body parser with raw body preservation
 */
export const jsonWithRaw = (options: { limit?: string } = {}) => {
  const limit = options.limit || '1mb';
  const limitBytes = parseLimit(limit);
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Only process JSON content type
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      return next();
    }

    let data = '';
    let size = 0;
    req.setEncoding('utf8');
    
    req.on('data', (chunk: string) => {
      size += Buffer.byteLength(chunk, 'utf8');
      if (size > limitBytes) {
        req.destroy();
        res.status(413).json({ error: 'Payload too large' });
        return;
      }
      data += chunk;
    });
    
    req.on('end', () => {
      (req as any).rawBody = data;
      try {
        req.body = JSON.parse(data);
      } catch (e) {
        // If JSON parse fails, continue with empty body
        // Error handlers will catch invalid JSON
        req.body = {};
      }
      next();
    });
    
    req.on('error', (err) => {
      next(err);
    });
  };
};

/**
 * Parse limit string to bytes
 */
function parseLimit(limit: string): number {
  const units: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };
  
  const match = limit.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return 1024 * 1024; // Default 1MB
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  return value * (units[unit] || 1);
}
