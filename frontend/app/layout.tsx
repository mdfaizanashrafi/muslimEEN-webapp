import type { Metadata, Viewport } from "next";
import { Inter, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import { OrganizationSchema } from "@/components/seo";
import { 
  generateHomepageMetadata, 
  defaultViewport,
  SITE_CONFIG 
} from "@/lib/seo/metadata";
import { 
  GoogleAnalytics, 
  GoogleTagManager,
  GoogleTagManagerNoScript,
  SearchConsoleVerification,
  MicrosoftClarity 
} from "@/components/seo/Analytics";
import { ClerkProvider } from '@clerk/nextjs';
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { ToastContainer } from "@/components/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";

/**
 * Primary font - Inter
 * Optimized with next/font for performance
 */
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap', // Prevents FOIT (Flash of Invisible Text)
  preload: true,
});

/**
 * Arabic font - Noto Naskh Arabic
 * Optimized with next/font for Arabic text
 */
const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: 'swap',
  preload: true,
  weight: ["400", "500", "600", "700"],
});

/**
 * Site-wide metadata
 * This provides base metadata for all pages
 * Individual pages can override using generateMetadata
 */
export const metadata: Metadata = generateHomepageMetadata();

/**
 * Viewport configuration
 * Moved to separate export as per Next.js 14 best practices
 */
export const viewport: Viewport = defaultViewport;

/**
 * Environment-based configuration
 * Replace with your actual tracking IDs in production
 */
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GTM_CONTAINER_ID = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID;
const SEARCH_CONSOLE_VERIFICATION = process.env.NEXT_PUBLIC_SEARCH_CONSOLE_VERIFICATION;
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" className={`${inter.variable} ${notoNaskhArabic.variable}`}>
      <head>
        {/* Preconnect to critical domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch for analytics */}
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        
        {/* Favicon and App Icons */}
        <link rel="icon" type="image/png" href="/favicon.png?v=2" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Search Console Verification */}
        <SearchConsoleVerification verificationCode={SEARCH_CONSOLE_VERIFICATION} />
        
        {/* Organization Schema - included on all pages */}
        <OrganizationSchema includeWebSite={true} />
        
        {/* Analytics - Only loaded in production */}
        {GA_MEASUREMENT_ID && <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />}
        {GTM_CONTAINER_ID && <GoogleTagManager containerId={GTM_CONTAINER_ID} />}
        {CLARITY_PROJECT_ID && <MicrosoftClarity projectId={CLARITY_PROJECT_ID} />}
      </head>
      
      <body className={`${inter.className} ${notoNaskhArabic.className}`}>
        {/* GTM NoScript Fallback */}
        <GoogleTagManagerNoScript containerId={GTM_CONTAINER_ID || ''} />
        
        <ErrorBoundary>
          <ClerkProvider>
            <AnalyticsProvider>
              {children}
              <ToastContainer />
            </AnalyticsProvider>
          </ClerkProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
