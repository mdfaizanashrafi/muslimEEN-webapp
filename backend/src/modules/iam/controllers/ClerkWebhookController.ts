/**
 * Clerk Webhook Controller - ELITE PRODUCTION GRADE
 * 
 * HTTP endpoint for Clerk webhooks with:
 * - Signature verification
 * - Idempotent processing
 * - Comprehensive logging
 * - Structured error responses
 * 
 * DATE: 2026-03-21
 */

import { Request, Response } from 'express';
import { logger } from '../../shared/utils/logger';
import * as WebhookService from '../services/WebhookService';

// ============================================================================
// MAIN WEBHOOK HANDLER
// ============================================================================

/**
 * POST /webhooks/clerk
 * Main Clerk webhook endpoint
 */
export const handleClerkWebhook = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    // Step 1: Verify webhook signature
    const verification = WebhookService.verifyWebhook(req.headers, req.body);
    
    if (!verification.valid) {
      logger.warn('WEBHOOK_REJECTED', {
        reason: verification.error,
        ip: req.ip,
      });
      res.status(401).json({ 
        success: false, 
        error: verification.error 
      });
      return;
    }
    
    const payload = verification.payload;
    const eventType = payload.type;
    const eventId = payload.data?.id || 'unknown';
    
    logger.debug('WEBHOOK_RECEIVED', {
      eventId,
      eventType,
      timestamp: new Date().toISOString(),
    });
    
    // Step 2: Route to appropriate handler
    let result: WebhookService.WebhookProcessResult;
    
    switch (eventType) {
      case 'user.created':
        result = await WebhookService.processUserCreated(payload.data?.id, payload);
        break;
        
      case 'user.updated':
        result = await WebhookService.processUserUpdated(payload.data?.id, payload);
        break;
        
      case 'user.deleted':
        result = await WebhookService.processUserDeleted(payload.data?.id, payload);
        break;
        
      default:
        logger.debug('WEBHOOK_UNHANDLED_TYPE', { eventType, eventId });
        res.json({ success: true, message: 'Event type not handled' });
        return;
    }
    
    // Step 3: Return appropriate response
    const duration = Date.now() - startTime;
    
    if (result.alreadyProcessed) {
      // Duplicate webhook - return success to prevent retries
      res.json({ 
        success: true, 
        message: 'Already processed',
        duplicate: true
      });
      return;
    }
    
    if (result.success) {
      logger.info('WEBHOOK_SUCCESS', {
        eventId,
        eventType,
        action: result.action,
        durationMs: duration,
      });
      
      res.json({ 
        success: true, 
        action: result.action 
      });
    } else {
      // Processing failed but we handled it (user blocked)
      logger.warn('WEBHOOK_HANDLED_FAILURE', {
        eventId,
        eventType,
        error: result.error,
        action: result.action,
        durationMs: duration,
      });
      
      // Return 200 to prevent Clerk retries
      // The user has been blocked, so no retry needed
      res.status(200).json({ 
        success: false, 
        error: result.error,
        action: result.action,
        message: 'User blocked due to validation failure'
      });
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('WEBHOOK_CRASH', {
      error: (error as Error).message,
      stack: (error as Error).stack,
      durationMs: duration,
    });
    
    // Return 500 for unexpected errors (Clerk will retry)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * GET /admin/webhooks/health
 * Webhook health status
 */
export const getWebhookHealthEndpoint = (req: Request, res: Response): void => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    webhookSecret: process.env.CLERK_WEBHOOK_SECRET ? 'configured' : 'missing',
  });
};

/**
 * GET /admin/webhooks/stats
 * Webhook statistics
 */
export const getWebhookStatsEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { getMetricsSummary } = await import('../../shared/utils/metrics');
    const metrics = await getMetricsSummary();
    
    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics'
    });
  }
};

/**
 * GET /admin/webhooks/recent
 * Recent webhook events
 */
export const getRecentEventsEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { default: pool } = await import('../../database/pool');
    
    const result = await pool.query(
      `SELECT id, event_type, clerk_user_id, success, processed_at, error_message
       FROM webhook_events
       ORDER BY processed_at DESC
       LIMIT 100`
    );
    
    res.json({
      success: true,
      events: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve events'
    });
  }
};
