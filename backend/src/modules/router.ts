/**
 * Central API Router - Modular Architecture
 * 
 * This router consolidates all module routes with proper
 * authentication middleware hierarchy.
 * 
 * Structure:
 * - Public routes (no auth): /auth/*, /webhooks/*
 * - Protected routes (with auth): all others
 * 
 * AUTHENTICATION: Clerk only (legacy JWT removed)
 * DATE: 2026-03-20
 */

import { Router, Request, Response } from 'express';

// Import module routes
import authRoutes from './auth/routes';
import usersRoutes from './users/routes';
import connectionsRoutes from './connections/routes';
import invitesRoutes from './invites/routes';
import verificationRoutes from './verification/routes';
import marketplaceRoutes from './marketplace/routes';
import islamicFinanceRoutes from './islamic-finance/routes';
import analyticsRoutes from './analytics/routes';
import feedbackRoutes from './feedback/routes';
import internalRoutes from './internal/routes';

// Import authentication middleware
import { clerkAuthenticate, requireRole } from './iam/middleware/clerkAuth';
import { unifiedAuthenticate } from './iam/middleware/unifiedAuth';
import { apiLimiter } from './shared/middleware/rateLimiter';
import { raw } from './shared/middleware/bodyParser';
import { handleClerkWebhook, getWebhookHealthEndpoint, getWebhookStatsEndpoint, getRecentEventsEndpoint } from './iam/controllers/ClerkWebhookController';
import { getAuthHealth, getAuthReadyStatus, getAuthSimpleHealth } from './iam/controllers/AuthHealthController';

import { isClerkWebhooksEnabled } from '../config/featureFlags';

const router = Router();

// ============================================================================
// API INDEX - Lists available endpoints
// ============================================================================
router.get('/', apiLimiter, (_req: Request, res: Response) => {
  res.json({
    name: 'MuslimEEN API',
    version: 'v1',
    status: 'running',
    authentication: 'Clerk JWT',
    documentation: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      connections: '/api/connections',
      invites: '/api/invites',
      verification: '/api/verification',
      marketplace: '/api/marketplace',
      'islamic-finance': '/api/islamic-finance',
      analytics: '/api/analytics',
      feedback: '/api/feedback',
    },
    endpoints: [
      // Auth (public)
      { path: 'POST /api/auth/validate-invitation', description: 'Validate invite code' },
      { path: 'POST /api/auth/login', description: 'Login (deprecated, returns 501)' },
      { path: 'POST /api/auth/register', description: 'Register (deprecated, returns 501)' },
      { path: 'POST /api/auth/logout', description: 'User logout' },
      { path: 'GET /api/auth/me', description: 'Get current user' },
      
      // Users (protected)
      { path: 'GET /api/users/me', description: 'Get current user profile' },
      { path: 'PUT /api/users/me', description: 'Update current user profile' },
      { path: 'GET /api/users/me/trust-score', description: 'Get trust score' },
      { path: 'GET /api/users/me/verification', description: 'Get verification status' },
      { path: 'GET /api/users/:userId', description: 'Get public user profile' },
      
      // Connections (protected)
      { path: 'GET /api/connections', description: 'Get user connections' },
      { path: 'POST /api/connections', description: 'Send connection request' },
      { path: 'PATCH /api/connections/:id/status', description: 'Update connection status' },
      
      // Invites (protected)
      { path: 'GET /api/invites', description: 'Get user invites' },
      { path: 'POST /api/invites', description: 'Create invite' },
      
      // Marketplace (protected)
      { path: 'GET /api/marketplace/:vertical', description: 'Get marketplace listings' },
      
      // Islamic Finance (protected)
      { path: 'GET /api/islamic-finance/sadaqah', description: 'Get sadaqah campaigns' },
      
      // Analytics (protected)
      { path: 'POST /api/analytics/events', description: 'Track analytics events' },
      { path: 'GET /api/analytics/metrics', description: 'Get beta metrics' },
      { path: 'GET /api/analytics/funnel', description: 'Get onboarding funnel' },
      
      // Feedback (protected)
      { path: 'POST /api/feedback', description: 'Submit feedback' },
      { path: 'GET /api/feedback/stats', description: 'Get feedback statistics' },
    ],
  });
});

// ============================================================================
// HEALTH CHECK
// ============================================================================
router.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    auth: 'Clerk JWT',
  });
});

// Auth system health check
router.get('/health/auth', getAuthHealth);
router.get('/health/auth/ready', getAuthReadyStatus);
router.get('/health/auth/simple', getAuthSimpleHealth);

// ============================================================================
// PUBLIC ROUTES - No authentication required
// ============================================================================
// CRITICAL ORDER: Auth routes must be mounted BEFORE unifiedAuthenticate
// The /auth routes include public endpoints like validate-invitation that
// must work without authentication (called during signup flow)

// Mount auth routes (includes /validate-invitation which is PUBLIC)
router.use('/auth', authRoutes);

// Admin endpoints (protected)
router.get('/admin/legacy-auth-stats', clerkAuthenticate, requireRole('admin', 'super_admin'), (_req, res) => {
  res.json({ legacyAuthEnabled: false, message: 'Legacy authentication has been removed' });
});

// Webhook admin endpoints (admin only)
router.get('/admin/webhooks/health', clerkAuthenticate, requireRole('admin', 'super_admin'), getWebhookHealthEndpoint);
router.get('/admin/webhooks/stats', clerkAuthenticate, requireRole('admin', 'super_admin'), getWebhookStatsEndpoint);
router.get('/admin/webhooks/events', clerkAuthenticate, requireRole('admin', 'super_admin'), getRecentEventsEndpoint);

// Clerk webhook endpoint (must be public - called by Clerk)
// Raw body parser needed for signature verification
router.post('/webhooks/clerk', raw({ type: 'application/json' }), handleClerkWebhook);

// ============================================================================
// PROTECTED ROUTES - Authentication required (Clerk only)
// ============================================================================
// All routes below this line require authentication
router.use(unifiedAuthenticate);

// User routes
router.use('/users', usersRoutes);

// Connection routes
router.use('/connections', connectionsRoutes);

// Invite routes (for authenticated operations like creating invites)
router.use('/invites', invitesRoutes);

// Verification routes
router.use('/verification', verificationRoutes);

// Marketplace routes
router.use('/marketplace', marketplaceRoutes);

// Islamic Finance routes
router.use('/islamic-finance', islamicFinanceRoutes);

// Analytics routes
router.use('/analytics', analyticsRoutes);

// Feedback routes
router.use('/feedback', feedbackRoutes);

// Internal routes (service-to-service, API key auth)
// These are protected by internalApiAuth middleware within the routes file
router.use('/internal', internalRoutes);

export default router;
