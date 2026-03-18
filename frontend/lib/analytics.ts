/**
 * Analytics Library
 * Track user behavior and send to backend
 */

interface AnalyticsEvent {
  event: string;
  userId?: string;
  timestamp: number;
  sessionId: string;
  path?: string;
  metadata?: Record<string, unknown>;
}

const SESSION_KEY = 'meen_session_id';
const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 30000; // 30 seconds

let eventQueue: AnalyticsEvent[] = [];
let flushTimer: NodeJS.Timeout | null = null;

/**
 * Get or create session ID
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Track a single event
 */
export function trackEvent(event: string, metadata?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  const analyticsEvent: AnalyticsEvent = {
    event,
    timestamp: Date.now(),
    sessionId: getSessionId(),
    path: window.location.pathname,
    metadata,
  };

  eventQueue.push(analyticsEvent);

  // Flush immediately if batch size reached
  if (eventQueue.length >= BATCH_SIZE) {
    flushEvents();
  } else {
    // Schedule flush
    if (!flushTimer) {
      flushTimer = setTimeout(flushEvents, FLUSH_INTERVAL);
    }
  }
}

/**
 * Flush events to backend
 */
export async function flushEvents(): Promise<void> {
  if (eventQueue.length === 0) return;

  // Clear timer
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  // Copy and clear queue
  const events = [...eventQueue];
  eventQueue = [];

  try {
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ events }),
    });
  } catch (error) {
    // Silently fail - analytics should never break functionality
    console.debug('Analytics flush failed:', error);
    // Re-queue events for retry
    eventQueue.unshift(...events);
  }
}

/**
 * Track page view
 */
export function trackPageView(pageName?: string): void {
  trackEvent('page_view', { page: pageName || window.location.pathname });
}

/**
 * Track user action
 */
export function trackAction(action: string, details?: Record<string, unknown>): void {
  trackEvent(`action_${action}`, details);
}

/**
 * Track error
 */
export function trackError(error: Error, context?: string): void {
  trackEvent('error_encountered', {
    message: error.message,
    stack: error.stack,
    context,
  });
}

/**
 * Track onboarding step
 */
export function trackOnboardingStep(step: string, success: boolean = true): void {
  trackEvent(`onboarding_${step}`, { success });
}

/**
 * Track feature usage
 */
export function trackFeature(feature: string, action: string): void {
  trackEvent('feature_used', { feature, action });
}

/**
 * Initialize analytics
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined') return;

  // Track session start
  trackEvent('session_started');

  // Track initial page view
  trackPageView();

  // Flush on page unload
  window.addEventListener('beforeunload', () => {
    flushEvents();
  });

  // Flush on visibility change (tab switch)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushEvents();
    }
  });

  // Setup automatic error tracking
  window.addEventListener('error', (event) => {
    trackError(event.error, 'window_error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    trackError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      'unhandled_promise_rejection'
    );
  });
}

/**
 * Get current session metrics
 */
export function getSessionMetrics() {
  return {
    eventsInQueue: eventQueue.length,
    sessionId: getSessionId(),
  };
}
