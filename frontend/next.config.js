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
 */
function buildCSP({ isDev, apiHost }) {
  const directives = {
    // Default fallback - strict self-only
    'default-src': ["'self'"],
    
    // Scripts: Self + inline (Next.js requires) + Sentry + Vercel Live (dev only)
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required by Next.js
      'https://browser.sentry-cdn.com',
      'https://js.sentry-cdn.com',
      ...(isDev ? ['https://vercel.live', "'unsafe-eval'"] : []),
    ],
    
    // Styles: Self + inline (Tailwind/common) + Google Fonts
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
    ],
    
    // Fonts: Self + Google Fonts
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
    ],
    
    // Images: Self + data URIs + HTTPS (for user uploads/external images)
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
    ],
    
    // Connect (API calls): Self + Backend API + Sentry
    'connect-src': [
      "'self'",
      ...(apiHost ? [apiHost] : []),
      'https://*.sentry.io',
      'https://sentry.io',
      ...(isDev ? ['https://vercel.live', 'wss://vercel.live'] : []),
    ],
    
    // Frame: None (prevent clickjacking) unless you need iframes
    'frame-src': [
      ...(isDev ? ['https://vercel.live'] : []),
    ],
    
    // Media: Self + HTTPS
    'media-src': ["'self'", 'https:'],
    
    // Object: None (Flash/Java are dead)
    'object-src': ["'none'"],
    
    // Frame ancestors: None (prevent embedding)
    'frame-ancestors': ["'none'"],
    
    // Form action: Self only
    'form-action': ["'self'"],
    
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
