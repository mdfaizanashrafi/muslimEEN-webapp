/**
 * Analytics & Tracking Components
 * 
 * Google Analytics 4 and Search Console integration.
 * GDPR-compliant with consent-based loading.
 */

import Script from 'next/script';

interface GoogleAnalyticsProps {
  measurementId: string;
}

/**
 * Google Analytics 4 Component
 * 
 * Usage in layout.tsx:
 * ```tsx
 * <GoogleAnalytics measurementId="G-XXXXXXXXXX" />
 * ```
 * 
 * Note: Replace G-XXXXXXXXXX with your actual GA4 measurement ID
 */
export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  if (!measurementId || process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_title: document.title,
            page_location: window.location.href,
            send_page_view: true,
            cookie_flags: 'SameSite=None;Secure',
            cookie_expires: 63072000, // 2 years
            custom_map: {
              'custom_parameter_1': 'trust_score',
              'custom_parameter_2': 'verification_level',
            }
          });
        `}
      </Script>
    </>
  );
}

/**
 * Google Tag Manager Component
 * 
 * For more advanced tracking and tag management.
 */
interface GoogleTagManagerProps {
  containerId: string;
}

export function GoogleTagManager({ containerId }: GoogleTagManagerProps) {
  if (!containerId || process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <Script id="gtm" strategy="afterInteractive">
      {`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${containerId}');
      `}
    </Script>
  );
}

/**
 * GTM Noscript Fallback
 * 
 * Place this in the body for users with JavaScript disabled.
 */
export function GoogleTagManagerNoScript({ containerId }: GoogleTagManagerProps) {
  if (!containerId || process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}

/**
 * Event Tracking Helper
 * 
 * Track custom events in your components:
 * ```tsx
 * <button onClick={() => trackEvent('job_apply', { job_id: '123' })}>
 *   Apply Now
 * </button>
 * ```
 */
export function trackEvent(
  eventName: string,
  parameters?: Record<string, string | number | boolean>
) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, parameters);
  }
}

/**
 * Predefined event names for consistency
 */
export const AnalyticsEvents = {
  // Profile Events
  PROFILE_VIEW: 'profile_view',
  PROFILE_CONNECT: 'profile_connect',
  PROFILE_MESSAGE: 'profile_message',
  
  // Job Events
  JOB_VIEW: 'job_view',
  JOB_APPLY: 'job_apply',
  JOB_SAVE: 'job_save',
  JOB_SHARE: 'job_share',
  
  // Marketplace Events
  MARKETPLACE_VIEW: 'marketplace_view',
  LISTING_CONTACT: 'listing_contact',
  LISTING_SAVE: 'listing_save',
  
  // Islamic Finance Events
  ZAKAT_CALCULATE: 'zakat_calculate',
  SADAQAH_DONATE: 'sadaqah_donate',
  WAQF_VIEW: 'waqf_view',
  
  // Auth Events
  SIGNUP_START: 'signup_start',
  SIGNUP_COMPLETE: 'signup_complete',
  LOGIN: 'login',
  INVITATION_SENT: 'invitation_sent',
  
  // Search Events
  SEARCH: 'search',
  SEARCH_FILTER: 'search_filter',
  
  // Engagement Events
  PAGE_SCROLL: 'page_scroll',
  TIME_ON_PAGE: 'time_on_page',
  EXTERNAL_LINK_CLICK: 'external_link_click',
} as const;

/**
 * Search Console Verification Component
 * 
 * Add this to your layout's <head> for Search Console verification.
 */
interface SearchConsoleVerificationProps {
  verificationCode: string | undefined;
}

export function SearchConsoleVerification({ verificationCode }: SearchConsoleVerificationProps) {
  if (!verificationCode) return null;

  return (
    <meta name="google-site-verification" content={verificationCode} />
  );
}

/**
 * Microsoft Clarity Tracking
 * 
 * For heatmaps and user session recordings.
 */
interface MicrosoftClarityProps {
  projectId: string;
}

export function MicrosoftClarity({ projectId }: MicrosoftClarityProps) {
  if (!projectId || process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${projectId}");
      `}
    </Script>
  );
}

/**
 * Hotjar Tracking
 * 
 * For heatmaps, recordings, and surveys.
 */
interface HotjarProps {
  siteId: string;
}

export function Hotjar({ siteId }: HotjarProps) {
  if (!siteId || process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <Script id="hotjar" strategy="afterInteractive">
      {`
        (function(h,o,t,j,a,r){
          h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
          h._hjSettings={hjid:${siteId},hjsv:6};
          a=o.getElementsByTagName('head')[0];
          r=o.createElement('script');r.async=1;
          r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
          a.appendChild(r);
        })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
      `}
    </Script>
  );
}
