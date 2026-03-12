/**
 * Next.js Middleware
 * Authentication guards for protected routes
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/about',
  '/blog',
];

// Routes that are only for non-authenticated users
const AUTH_ONLY_ROUTES = [
  '/login',
];

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/connections',
  '/messages',
  '/settings',
  '/invites',
  '/trust-score',
  '/verification',
  '/marketplace',
  '/islamic-finance',
  '/people',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookies or localStorage (via cookie)
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  // Check if this is a public route
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith('/blog/')
  );
  
  // Check if this is an auth-only route (login, register)
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.includes(pathname);
  
  // Check if this is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Static files and API routes bypass
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // If user has token and tries to access auth-only route (login), redirect to dashboard
  if (token && isAuthOnlyRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If user doesn't have token and tries to access protected route, redirect to login
  if (!token && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
