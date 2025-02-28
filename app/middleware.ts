import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';

/**
 * This middleware ensures that:
 * 1. Auth0 environment variables are properly set for each request
 * 2. Users are redirected to appropriate pages based on authentication state
 * 3. New users are directed to onboarding
 */
export async function middleware(request: NextRequest) {
  // Get the current host from the request
  const host = request.headers.get('host') || '';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;
  
  // CRITICAL FIX: ALWAYS override AUTH0_BASE_URL for every request
  // This ensures it's set correctly for every request
  process.env.AUTH0_BASE_URL = baseUrl;
  
  // Skip processing for API routes (except auth callback) and static files
  const { pathname } = request.nextUrl;
  if (
    (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/callback')) || 
    pathname.startsWith('/_next/') || 
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }
  
  try {
    // Get the user session from Auth0
    const session = await getSession(request, NextResponse.next());
    
    // If there's no session and the user is trying to access protected routes, redirect to login
    if (!session?.user) {
      if (
        pathname.startsWith('/dashboard') || 
        pathname.startsWith('/settings') || 
        pathname === '/onboarding'
      ) {
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }
      return NextResponse.next();
    }
    
    // Set a flag to detect if this is a new user needing onboarding
    // In a real implementation, you'd check your database
    // For now, we'll use a simplified check based on the auth0 metadata
    const isNewUser = !session.user.updated_at;
    const needsOnboarding = isNewUser || pathname === '/onboarding';
    
    // If user is authenticated but accessing the homepage, redirect to the appropriate page
    if (pathname === '/') {
      if (needsOnboarding) {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      } else {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    // If user is at the callback and needs onboarding, redirect to onboarding
    if (pathname === '/api/auth/callback' && needsOnboarding) {
      // Let the callback process complete first, it will redirect automatically
      return NextResponse.next();
    }
  } catch (error) {
    console.error('Middleware error:', error);
  }
  
  // Continue processing the request
  return NextResponse.next();
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public directory
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 