/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.muslimeen.space',
      },
    ],
  },
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },

  // Security headers with production-grade CSP
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    // Get backend API URL from env (remove protocol for cleaner CSP)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const apiHost = apiUrl ? new URL(apiUrl).origin : '';
    
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: buildCSP({ isDev, apiHost }),
          },
        ],
      },
    ];
  },
};

/**
 * Build CSP directive string
 * Security-first but functional for real-world use
 * Includes all required Clerk domains
 */
function buildCSP({ isDev, apiHost }) {
  // Clerk domains required for authentication
  const clerkDomains = [
    'https://*.clerk.accounts.dev',
    'https://*.clerk.com',
    'https://clerk.com',
    'https://*.clerkstage.dev',
    'https://*.clerk.dev',
    'https://npm.elemecdn.com',  // Alternative CDN for clerk.browser.js
    'https://esm.sh',              // ESM CDN
    'https://cdn.jsdelivr.net',    // jsDelivr CDN
    'https://unpkg.com',           // unpkg CDN
    'https://esm.run',             // esm.run CDN
  ];

  const directives = {
    // Default fallback - strict self-only
    'default-src': ["'self'"],
    
    // Scripts: Self + inline (Next.js requires) + Clerk + Sentry + Vercel Live (dev only)
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required by Next.js and Clerk
      "'unsafe-eval'",   // Required by Clerk for some functionality
      ...clerkDomains,
      'https://browser.sentry-cdn.com',
      'https://js.sentry-cdn.com',
      ...(isDev ? ['https://vercel.live'] : []),
    ],
    
    // Styles: Self + inline (Tailwind/common) + Google Fonts + Clerk
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Clerk's inline styles
      'https://fonts.googleapis.com',
      ...clerkDomains,
    ],
    
    // Fonts: Self + Google Fonts + Clerk
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      ...clerkDomains,
    ],
    
    // Images: Self + data URIs + HTTPS (for user uploads/external images) + Clerk
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      ...clerkDomains,
    ],
    
    // Connect (API calls): Self + Backend API + Sentry + Clerk
    'connect-src': [
      "'self'",
      ...(apiHost ? [apiHost] : []),
      'https://*.sentry.io',
      'https://sentry.io',
      ...clerkDomains,
      ...(isDev ? ['https://vercel.live', 'wss://vercel.live'] : []),
    ],
    
    // Frame: Clerk may use iframes for certain flows
    'frame-src': [
      ...clerkDomains,
      ...(isDev ? ['https://vercel.live'] : []),
    ],
    
    // Media: Self + HTTPS + Clerk
    'media-src': ["'self'", 'https:', ...clerkDomains],
    
    // Object: None (Flash/Java are dead)
    'object-src': ["'none'"],
    
    // Frame ancestors: None (prevent embedding)
    'frame-ancestors': ["'none'"],
    
    // Form action: Self + Clerk (for redirects)
    'form-action': ["'self'", ...clerkDomains],
    
    // Base URI: Self only
    'base-uri': ["'self'"],
    
    // Upgrade HTTP to HTTPS
    'upgrade-insecure-requests': [],
  };
  
  // Convert to CSP string format
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

module.exports = nextConfig;
