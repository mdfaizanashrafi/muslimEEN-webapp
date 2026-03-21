/** @type {import('next').NextConfig} */

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval'
    https://*.clerk.accounts.dev
    https://*.clerk.com
    https://clerk.com
    https://cdn.jsdelivr.net
    https://unpkg.com;
  connect-src 'self'
    https://*.clerk.accounts.dev
    https://*.clerk.com
    https://clerk.com;
  frame-src 'self'
    https://*.clerk.accounts.dev
    https://*.clerk.com;
  img-src 'self' data:
    https://*.clerk.accounts.dev
    https://*.clerk.com;
  style-src 'self' 'unsafe-inline';
  font-src 'self' data:;
`;

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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: ContentSecurityPolicy.replace(/\n/g, ""),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
