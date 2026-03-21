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
    
    // Get backend API URL from env
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
 * Minimal, secure CSP for Clerk default CDN
 */
function buildCSP({ isDev, apiHost }) {
  // Standard Clerk CDN domains (default CDN)
  const clerkDomains = [
    'https://*.clerk.accounts.dev',
    'https://*.clerk.com',
    'https://clerk.com',
  ];

  const directives = {
    // Default fallback
    'default-src': ["'self'"],
    
    // Scripts: Self + inline + Clerk + Sentry
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      ...clerkDomains,
      'https://browser.sentry-cdn.com',
      'https://js.sentry-cdn.com',
      ...(isDev ? ['https://vercel.live'] : []),
    ],
    
    // script-src-elem for modern browsers
    'script-src-elem': [
      "'self'",
      ...clerkDomains,
      'https://browser.sentry-cdn.com',
      ...(isDev ? ['https://vercel.live'] : []),
    ],
    
    // Styles: Self + inline + Google Fonts
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
      ...clerkDomains,
    ],
    
    // Fonts: Self + Google Fonts + Clerk
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      ...clerkDomains,
    ],
    
    // Images: Self + data + HTTPS + Clerk
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      ...clerkDomains,
    ],
    
    // Connect: Self + Backend + Sentry + Clerk
    'connect-src': [
      "'self'",
      ...(apiHost ? [apiHost] : []),
      'https://*.sentry.io',
      'https://sentry.io',
      ...clerkDomains,
      ...(isDev ? ['https://vercel.live', 'wss://vercel.live'] : []),
    ],
    
    // Frame: Clerk iframes for OAuth
    'frame-src': [
      ...clerkDomains,
      ...(isDev ? ['https://vercel.live'] : []),
    ],
    
    // Media: Self + HTTPS
    'media-src': ["'self'", 'https:', ...clerkDomains],
    
    // Workers: Self + blob (Clerk may use Web Workers)
    'worker-src': ["'self'", 'blob:'],
    
    // Object: None
    'object-src': ["'none'"],
    
    // Frame ancestors: None
    'frame-ancestors': ["'none'"],
    
    // Form action: Self + Clerk
    'form-action': ["'self'", ...clerkDomains],
    
    // Base URI: Self
    'base-uri': ["'self'"],
    
    // Upgrade insecure requests
    'upgrade-insecure-requests': [],
  };
  
  // Convert to CSP string
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

module.exports = nextConfig;
