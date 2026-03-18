'use client';

import { useEffect } from 'react';
import { initAnalytics } from '@/lib/analytics';
import { initPerformanceMonitoring } from '@/lib/performance';
import { FeedbackWidget } from './feedback/FeedbackWidget';

/**
 * Analytics Provider
 * Initializes analytics tracking on app mount
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize analytics tracking
    initAnalytics();
    
    // Initialize performance monitoring
    initPerformanceMonitoring();
  }, []);

  return (
    <>
      {children}
      {/* Global feedback widget */}
      <FeedbackWidget trigger="manual" context="global" />
    </>
  );
}

export default AnalyticsProvider;
