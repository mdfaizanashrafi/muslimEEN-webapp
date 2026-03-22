/**
 * Analytics API Routes
 * Collect and aggregate user behavior data
 */

import { Router, Request, Response } from 'express';
import { clerkAuthenticate } from '../iam/middleware/clerkAuth';
import { logger } from '../shared/utils/logger';

const router = Router();

// In-memory store for beta analytics (use Redis/DB in production)
interface AnalyticsEvent {
  event: string;
  userId?: string;
  timestamp: number;
  sessionId: string;
  path?: string;
  metadata?: Record<string, unknown>;
}

const eventsStore: AnalyticsEvent[] = [];
const MAX_STORE_SIZE = 10000;

// POST /api/analytics/events
router.post('/events', async (req: Request, res: Response) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events)) {
      res.status(400).json({ success: false, error: { code: 'INVALID_DATA', message: 'Events must be an array' } });
      return;
    }

    const userId = req.user?.id;
    events.forEach((event: AnalyticsEvent) => {
      eventsStore.push({ ...event, userId: userId || event.userId });
    });

    if (eventsStore.length > MAX_STORE_SIZE) {
      eventsStore.splice(0, eventsStore.length - MAX_STORE_SIZE);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Analytics error', { error: (error as Error).message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process events' } });
  }
});

// GET /api/analytics/metrics (Admin only)
router.get('/metrics', clerkAuthenticate, async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const metrics = {
      totalUsers: new Set(eventsStore.filter(e => e.event === 'registration_completed').map(e => e.userId)).size,
      activeUsers24h: new Set(eventsStore.filter(e => e.timestamp > oneDayAgo && e.userId).map(e => e.userId)).size,
      activeUsers7d: new Set(eventsStore.filter(e => e.timestamp > sevenDaysAgo && e.userId).map(e => e.userId)).size,
      totalSessions: new Set(eventsStore.filter(e => e.event === 'session_started').map(e => e.sessionId)).size,
      onboarding: {
        inviteReceived: countEvents('invite_received'),
        registrationStarted: countEvents('registration_started'),
        registrationCompleted: countEvents('registration_completed'),
        firstLogin: countEvents('login_success'),
        profileCompleted: countEvents('profile_updated'),
      },
      connectionsCreated: countEvents('connection_request_sent'),
      invitesSent: countEvents('invite_created'),
      errors24h: eventsStore.filter(e => e.event === 'error_encountered' && e.timestamp > oneDayAgo).length,
      loginFailures24h: eventsStore.filter(e => e.event === 'login_failed' && e.timestamp > oneDayAgo).length,
    };

    res.json({ success: true, metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate metrics' } });
  }
});

// GET /api/analytics/funnel
router.get('/funnel', clerkAuthenticate, async (req: Request, res: Response) => {
  try {
    interface FunnelStep {
      name: string;
      count: number;
      conversionRate?: number;
    }

    const steps: FunnelStep[] = [
      { name: 'Invite Received', count: countUniqueUsers('invite_received') },
      { name: 'Registration Started', count: countUniqueUsers('registration_started') },
      { name: 'Registration Completed', count: countUniqueUsers('registration_completed') },
      { name: 'First Login', count: countUniqueUsers('login_success') },
      { name: 'Profile Updated', count: countUniqueUsers('profile_updated') },
      { name: 'First Connection', count: countUniqueUsers('connection_request_sent') },
    ];

    for (let i = 1; i < steps.length; i++) {
      steps[i].conversionRate = steps[i - 1].count > 0 
        ? Math.round((steps[i].count / steps[i - 1].count) * 100) 
        : 0;
    }

    res.json({ success: true, funnel: { steps } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate funnel' } });
  }
});

// GET /api/analytics/errors
router.get('/errors', clerkAuthenticate, async (req: Request, res: Response) => {
  try {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const errors = eventsStore
      .filter(e => e.event === 'error_encountered' && e.timestamp > oneDayAgo)
      .reduce((acc, event) => {
        const key = event.metadata?.message as string || 'Unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topErrors = Object.entries(errors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));

    res.json({ success: true, errors: topErrors });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate error report' } });
  }
});

function countEvents(eventName: string, since?: number): number {
  return eventsStore.filter(e => e.event === eventName && (!since || e.timestamp >= since)).length;
}

function countUniqueUsers(eventName: string): number {
  return new Set(eventsStore.filter(e => e.event === eventName && e.userId).map(e => e.userId)).size;
}

export default router;
