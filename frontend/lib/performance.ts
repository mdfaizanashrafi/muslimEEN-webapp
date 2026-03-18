/**
 * Performance Monitoring
 * Track Core Web Vitals and custom performance metrics
 */

import { trackEvent } from './analytics';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

// Performance thresholds based on Google's Core Web Vitals
const THRESHOLDS: Record<string, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
};

function getRating(name: string, value: number): PerformanceMetric['rating'] {
  const threshold = THRESHOLDS[name];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value >= threshold.poor) return 'poor';
  return 'needs-improvement';
}

/**
 * Report a performance metric
 */
function reportMetric(name: string, value: number): void {
  const rating = getRating(name, value);
  
  trackEvent('web_vital', {
    metric: name,
    value: Math.round(value),
    rating,
  });

  // Log poor metrics for debugging
  if (rating === 'poor') {
    console.warn(`[Performance] ${name} is poor: ${value}`);
  }
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;

  // Track LCP (Largest Contentful Paint)
  observeLCP();
  
  // Track FID (First Input Delay)
  observeFID();
  
  // Track CLS (Cumulative Layout Shift)
  observeCLS();
  
  // Track FCP (First Contentful Paint)
  observeFCP();
  
  // Track TTFB (Time to First Byte)
  observeTTFB();
  
  // Track custom navigation timing
  trackNavigationTiming();
}

function observeLCP(): void {
  if (!('PerformanceObserver' in window)) return;
  
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      reportMetric('LCP', lastEntry.startTime);
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // LCP not supported
  }
}

function observeFID(): void {
  if (!('PerformanceObserver' in window)) return;
  
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fidEntry = entry as PerformanceEntry & { processingStart: number; startTime: number };
        reportMetric('FID', fidEntry.processingStart - fidEntry.startTime);
      }
    });
    
    observer.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    // FID not supported
  }
}

function observeCLS(): void {
  if (!('PerformanceObserver' in window)) return;
  
  let clsValue = 0;
  
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value;
        }
      }
    });
    
    observer.observe({ entryTypes: ['layout-shift'] });
    
    // Report CLS when page is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        reportMetric('CLS', clsValue);
      }
    });
  } catch (e) {
    // CLS not supported
  }
}

function observeFCP(): void {
  if (!('PerformanceObserver' in window)) return;
  
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const paintEntry = entry as PerformanceEntry & { startTime: number };
        if (entry.name === 'first-contentful-paint') {
          reportMetric('FCP', paintEntry.startTime);
        }
      }
    });
    
    observer.observe({ entryTypes: ['paint'] });
  } catch (e) {
    // FCP not supported
  }
}

function observeTTFB(): void {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      reportMetric('TTFB', navigation.responseStart - navigation.startTime);
    }
  });
}

function trackNavigationTiming(): void {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        trackEvent('navigation_timing', {
          dns: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
          connect: Math.round(navigation.connectEnd - navigation.connectStart),
          response: Math.round(navigation.responseEnd - navigation.responseStart),
          dom: Math.round(navigation.domComplete - navigation.domInteractive),
          load: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
        });
      }
    }, 0);
  });
}

/**
 * Track custom timing
 */
export function trackTiming(name: string, startTime: number): void {
  const duration = performance.now() - startTime;
  trackEvent('custom_timing', { name, duration: Math.round(duration) });
}

/**
 * Measure API call performance
 */
export function measureApiCall<T>(endpoint: string, promise: Promise<T>): Promise<T> {
  const start = performance.now();
  
  return promise
    .then((result) => {
      trackEvent('api_call', {
        endpoint,
        duration: Math.round(performance.now() - start),
        success: true,
      });
      return result;
    })
    .catch((error) => {
      trackEvent('api_call', {
        endpoint,
        duration: Math.round(performance.now() - start),
        success: false,
        error: error.message,
      });
      throw error;
    });
}
