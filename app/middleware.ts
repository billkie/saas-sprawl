import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';
import prisma from '@/lib/prisma';

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
  
  // Handle post-authentication flows
  try {
    // Skip this processing for API routes and static files
    const { pathname } = request.nextUrl;
    if (
      pathname.startsWith('/api/') || 
      pathname.startsWith('/_next/') || 
      pathname.includes('.') ||
      pathname === '/favicon.ico'
    ) {
      return NextResponse.next();
    }
    
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
    
    // User is authenticated but might need onboarding
    if (pathname === '/') {
      // Check if the user has completed onboarding by checking if they have a company
      try {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: { companies: true }
        });
        
        // If user has no companies, redirect to onboarding
        if (!user || user.companies.length === 0) {
          return NextResponse.redirect(new URL('/onboarding', request.url));
        }
        
        // If user has completed onboarding, redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch (error) {
        console.error('Error checking user companies:', error);
        // In case of error, still allow access
        return NextResponse.next();
      }
    }
    
    // Special handling for callback - after authentication is complete
    if (pathname === '/api/auth/callback') {
      // The Auth0 handler will be applied first, then our middleware
      // No need for special handling here as Auth0 will redirect based on returnTo
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