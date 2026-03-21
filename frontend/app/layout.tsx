import type { Metadata, Viewport } from "next";
import { Inter, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import { OrganizationSchema } from "@/components/seo";
import { 
  generateHomepageMetadata, 
  defaultViewport,
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

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
  preload: true,
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: 'swap',
  preload: true,
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = generateHomepageMetadata();
export const viewport: Viewport = defaultViewport;

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
          {/* ClerkProvider must be inside body for App Router */}
          <ClerkProvider
            appearance={{
              layout: {
                socialButtonsVariant: 'iconButton',
                helpPageUrl: '/help',
                termsPageUrl: '/terms',
                privacyPageUrl: '/privacy',
                logoImageUrl: '/logo.png',
                logoPlacement: 'inside',
                showOptionalFields: true,
              },
              variables: {
                colorPrimary: '#059669',
                colorText: '#1f2937',
                colorBackground: '#ffffff',
                colorInputBackground: '#f9fafb',
                colorInputText: '#1f2937',
                borderRadius: '0.5rem',
                fontFamily: 'var(--font-inter), system-ui, sans-serif',
              },
              elements: {
                formButtonPrimary: 
                  'bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors',
                formFieldInput: 
                  'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
                footerActionLink: 
                  'text-emerald-600 hover:text-emerald-700 font-medium',
                identityPreviewEditButton: 
                  'text-emerald-600 hover:text-emerald-700',
              },
            }}
          >
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
