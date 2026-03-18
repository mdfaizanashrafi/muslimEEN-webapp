/**
 * Web App Manifest
 * Enables PWA (Progressive Web App) capabilities
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
 */

import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    // Basic information
    name: 'MuslimEEN - Muslim Economic Empowerment Network',
    short_name: 'MuslimEEN',
    description: 'A professional networking platform for Muslims with Shariah-compliant financial tools. Connect, collaborate, and grow your career the halal way.',
    
    // PWA configuration
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#059669',
    orientation: 'portrait-primary',
    
    // Scope and ID
    scope: '/',
    id: '/',
    
    // Language
    lang: 'en',
    dir: 'ltr',
    
    // Categories for app stores
    categories: [
      'business',
      'finance',
      'social',
      'productivity',
      'lifestyle',
    ],
    
    // Display mode preferences
    display_override: [
      'standalone',
      'fullscreen',
      'minimal-ui',
      'browser',
    ],
    
    // Icons for different platforms
    icons: [
      {
        src: '/favicon.png',
        sizes: '64x64',
        type: 'image/png',
      },
      {
        src: '/favicon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/favicon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/favicon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    
    // Related applications (native apps if available)
    // related_applications: [
    //   {
    //     platform: 'play',
    //     url: 'https://play.google.com/store/apps/details?id=org.muslimeen.app',
    //     id: 'org.muslimeen.app',
    //   },
    //   {
    //     platform: 'itunes',
    //     url: 'https://apps.apple.com/app/muslimeen/id123456789',
    //   },
    // ],
    // prefer_related_applications: false,
    
    // Shortcuts for quick actions (mobile home screen)
    shortcuts: [
      {
        name: 'My Dashboard',
        short_name: 'Dashboard',
        description: 'View your dashboard and updates',
        url: '/dashboard',
        icons: [{ src: '/icons/dashboard-96x96.png', sizes: '96x96' }],
      },
      {
        name: 'My Network',
        short_name: 'Network',
        description: 'View your professional connections',
        url: '/connections',
        icons: [{ src: '/icons/network-96x96.png', sizes: '96x96' }],
      },
      {
        name: 'Islamic Finance',
        short_name: 'Finance',
        description: 'Access Islamic finance tools',
        url: '/islamic-finance',
        icons: [{ src: '/icons/finance-96x96.png', sizes: '96x96' }],
      },
      {
        name: 'Messages',
        short_name: 'Messages',
        description: 'Check your messages',
        url: '/messages',
        icons: [{ src: '/icons/messages-96x96.png', sizes: '96x96' }],
      },
    ],
    
    // Screenshots for app stores / PWA install prompt
    screenshots: [
      {
        src: '/screenshots/homepage-wide.png',
        sizes: '1280x720',
        type: 'image/png',
      },
      {
        src: '/screenshots/dashboard-narrow.png',
        sizes: '750x1334',
        type: 'image/png',
      },
    ],
    
    // Protocol handlers (for deep linking)
    // protocol_handlers: [
    //   {
    //     protocol: 'web+musr',
    //     url: '/profile/%s',
    //   },
    // ],
    
    // Share target (for receiving shared content)
    // share_target: {
    //   action: '/share-target',
    //   method: 'POST',
    //   enctype: 'multipart/form-data',
    //   params: {
    //     title: 'name',
    //     text: 'description',
    //     url: 'link',
    //   },
    // },
  };
}
