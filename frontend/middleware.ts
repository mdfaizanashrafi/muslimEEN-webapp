/**
 * Next.js Middleware
 * Authentication guards using Clerk
 * 
 * MIGRATED: From custom JWT-based auth to Clerk authMiddleware
 * DATE: 2026-03-20
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/login",
  "/invite",        // Required for invite-only onboarding flow
  "/signup",        // Required for invite-only onboarding flow
  "/about",
  "/blog",
  "/blog/(.*)",
  "/api/webhook/clerk",
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect all routes except public ones
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
