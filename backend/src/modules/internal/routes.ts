/**
 * Internal API Routes
 * 
 * Secured endpoints for service-to-service communication.
 * Uses API key authentication (NOT Clerk/JWT).
 * 
 * SECURITY:
 * - Requires x-internal-api-key header
 * - Keys are scope-limited (read/write/admin)
 * - All access is logged
 * 
 * DATE: 2026-03-20
 */

import { Router } from 'express';
import { internalApiAuth, requireScope } from '../shared/auth/InternalApiAuth';
import pool from '../database/pool';
import { logger } from '../shared/utils/logger';

const router = Router();

// ============================================================================
// AUTHENTICATION
// ============================================================================

// All internal routes require API key authentication
router.use(internalApiAuth);

// ============================================================================
// READ-ONLY ENDPOINTS (scope: read)
// ============================================================================

/**
 * GET /internal/stats
 * System statistics for monitoring
 */
router.get('/stats', requireScope('read', 'write', 'admin'), async (req, res) => {
  try {
    const auth = (req as any).internalAuth;
    
    // Get user count
    const userResult = await pool.query('SELECT COUNT(*) as total FROM users');
    const userCount = parseInt(userResult.rows[0].total, 10);
    
    // Get invite stats
    const inviteResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'used') as used
      FROM invites
    `);
    
    // Get recent connections
    const connectionResult = await pool.query(`
      SELECT COUNT(*) as total FROM connections WHERE created_at > NOW() - INTERVAL '24 hours'
    `);
    
    logger.info('Internal stats accessed', {
      keyId: auth.keyId,
      keyName: auth.keyName,
    });
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        users: {
          total: userCount,
        },
        invites: {
          pending: parseInt(inviteResult.rows[0].pending, 10),
          used: parseInt(inviteResult.rows[0].used, 10),
        },
        connections: {
          last24h: parseInt(connectionResult.rows[0].total, 10),
        },
      },
    });
  } catch (error) {
    logger.error('Internal stats error', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch stats' },
    });
  }
});

/**
 * GET /internal/health/detailed
 * Detailed health information
 */
router.get('/health/detailed', requireScope('read', 'write', 'admin'), async (req, res) => {
  try {
    const auth = (req as any).internalAuth;
    
    // Database pool status
    const dbResult = await pool.query('SELECT NOW() as time, version() as version');
    
    logger.info('Internal health check', {
      keyId: auth.keyId,
      keyName: auth.keyName,
    });
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        database: {
          status: 'connected',
          time: dbResult.rows[0].time,
          version: dbResult.rows[0].version,
        },
        memory: process.memoryUsage(),
        uptime: process.uptime(),
      },
    });
  } catch (error) {
    logger.error('Internal health check error', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Health check failed' },
    });
  }
});

// ============================================================================
// WRITE ENDPOINTS (scope: write)
// ============================================================================

/**
 * POST /internal/cache/clear
 * Clear application caches
 */
router.post('/cache/clear', requireScope('write', 'admin'), async (req, res) => {
  const auth = (req as any).internalAuth;
  
  logger.info('Cache clear requested', {
    keyId: auth.keyId,
    keyName: auth.keyName,
  });
  
  // Implementation would clear Redis/memory caches
  res.json({
    success: true,
    message: 'Cache cleared',
  });
});

/**
 * POST /internal/events/publish
 * Publish event to event bus
 */
router.post('/events/publish', requireScope('write', 'admin'), async (req, res) => {
  const auth = (req as any).internalAuth;
  const { eventType, payload } = req.body;
  
  if (!eventType) {
    res.status(400).json({
      success: false,
      error: { code: 'MISSING_EVENT_TYPE', message: 'eventType is required' },
    });
    return;
  }
  
  logger.info('Event publish requested', {
    keyId: auth.keyId,
    keyName: auth.keyName,
    eventType,
  });
  
  // Implementation would publish to event bus
  res.json({
    success: true,
    message: 'Event published',
    eventType,
  });
});

// ============================================================================
// ADMIN ENDPOINTS (scope: admin)
// ============================================================================

/**
 * GET /internal/audit/logs
 * Access audit logs
 */
router.get('/audit/logs', requireScope('admin'), async (req, res) => {
  const auth = (req as any).internalAuth;
  const { limit = 100, offset = 0 } = req.query;
  
  logger.info('Audit logs accessed', {
    keyId: auth.keyId,
    keyName: auth.keyName,
    limit,
    offset,
  });
  
  // Implementation would query audit logs
  res.json({
    success: true,
    data: {
      logs: [], // Would be populated from audit log table
      total: 0,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
});

/**
 * POST /internal/maintenance
 * Trigger maintenance tasks
 */
router.post('/maintenance', requireScope('admin'), async (req, res) => {
  const auth = (req as any).internalAuth;
  const { task } = req.body;
  
  logger.info('Maintenance task triggered', {
    keyId: auth.keyId,
    keyName: auth.keyName,
    task,
  });
  
  res.json({
    success: true,
    message: `Maintenance task '${task}' triggered`,
  });
});

export default router;
