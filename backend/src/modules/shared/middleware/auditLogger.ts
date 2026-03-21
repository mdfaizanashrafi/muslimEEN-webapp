/**
 * Audit Logging Middleware
 * 
 * Tracks sensitive operations for security and compliance
 */

import { Request, Response, NextFunction } from 'express';
import { logger, safeError } from '../utils/logger';
import pool from '../../database/pool';

// Actions that should be audited
const AUDIT_ACTIONS = {
  // Auth actions
  LOGIN: 'login',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',
  
  // User actions
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  USER_ROLE_CHANGE: 'user_role_change',
  
  // Connection actions
  CONNECTION_CREATE: 'connection_create',
  CONNECTION_ACCEPT: 'connection_accept',
  CONNECTION_REJECT: 'connection_reject',
  CONNECTION_DELETE: 'connection_delete',
  
  // Invite actions
  INVITE_CREATE: 'invite_create',
  INVITE_REVOKE: 'invite_revoke',
  INVITE_USE: 'invite_use',
  
  // Verification actions
  VERIFICATION_REQUEST: 'verification_request',
  VERIFICATION_APPROVE: 'verification_approve',
  VERIFICATION_REJECT: 'verification_reject',
  
  // Admin actions
  ADMIN_LOGIN: 'admin_login',
  ADMIN_USER_UPDATE: 'admin_user_update',
  ADMIN_USER_DELETE: 'admin_user_delete',
} as const;

type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];

interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Write audit log to database
 */
const writeAuditLog = async (entry: AuditLogEntry): Promise<void> => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        entry.userId || null,
        entry.action,
        entry.resourceType,
        entry.resourceId || null,
        entry.details ? JSON.stringify(entry.details) : '{}',
        entry.ipAddress || null,
        entry.userAgent || null,
      ]
    );
  } catch (error) {
    // Log error but don't fail the request
    logger.error('Failed to write audit log', { 
      error: safeError(error),
      // Only log entry type, not full entry to avoid circular refs
      entryType: entry.action,
      userId: entry.userId,
    });
  }
};

/**
 * Middleware factory for audit logging
 * Usage: router.post('/login', auditLog('login', 'auth'), handler);
 */
export const auditLog = (action: AuditAction, resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to capture response
    res.json = function(body: any) {
      // Restore original method
      res.json = originalJson;
      
      // Log the audit entry asynchronously (don't await)
      const logEntry: AuditLogEntry = {
        userId: req.user?.id,
        action,
        resourceType,
        resourceId: req.params.id || req.params.userId,
        details: {
          success: body?.success,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          // Don't log sensitive data
          ...(body?.error && { errorCode: body.error.code }),
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      };
      
      writeAuditLog(logEntry).catch(err => {
        logger.error('Audit log write failed', safeError(err));
      });
      
      // Call original json method
      return originalJson(body);
    };
    
    next();
  };
};

/**
 * Audit critical operations only
 * Less verbose than full audit logging
 */
export const auditCritical = (action: AuditAction, resourceType: string) => {
  return auditLog(action, resourceType);
};

export { AUDIT_ACTIONS };
export type { AuditAction, AuditLogEntry };
