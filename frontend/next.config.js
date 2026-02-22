/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Static export for deployment to Vercel or other static hosts
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
  // Enable trailing slashes for static export compatibility
  trailingSlash: true,
  // Webpack configuration for path aliases
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, '.'),
    };
    return config;
  },
};

module.exports = nextConfig;
