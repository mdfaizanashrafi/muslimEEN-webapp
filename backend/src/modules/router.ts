/**
 * Central API Router - Modular Architecture
 * 
 * This router consolidates all module routes with proper
 * authentication middleware hierarchy.
 * 
 * Structure:
 * - Public routes (no auth): /auth/*
 * - Protected routes (with auth): all others
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

// Import shared middleware
import { authenticate } from './iam/middleware/auth';
import { apiLimiter } from './shared/middleware/rateLimiter';

const router = Router();

// ============================================================================
// API INDEX - Lists available endpoints
// ============================================================================
router.get('/', apiLimiter, (_req: Request, res: Response) => {
  res.json({
    name: 'MuslimEEN API',
    version: 'v1',
    status: 'running',
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
      { path: 'POST /api/auth/login', description: 'User login' },
      { path: 'POST /api/auth/register', description: 'User registration' },
      { path: 'POST /api/auth/logout', description: 'User logout' },
      { path: 'GET /api/auth/me', description: 'Get current user' },
      { path: 'POST /api/auth/validate-invitation', description: 'Validate invite code' },
      
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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// PUBLIC ROUTES - No authentication required
// ============================================================================
router.use('/auth', authRoutes);

// ============================================================================
// PROTECTED ROUTES - Authentication required
// ============================================================================
// All routes below this line require authentication
router.use(authenticate);

// User routes
router.use('/users', usersRoutes);

// Connection routes
router.use('/connections', connectionsRoutes);

// Invite routes
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

export default router;
