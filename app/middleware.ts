import { NextRequest, NextResponse } from 'next/server';

/**
 * This middleware ensures that Auth0 environment variables are properly set
 * for each request, handling cases where placeholders aren't properly resolved.
 */
export function middleware(request: NextRequest) {
  // Get the current host from the request
  const host = request.headers.get('host') || '';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;
  
  // CRITICAL FIX: ALWAYS override AUTH0_BASE_URL regardless of whether it has placeholders
  // This ensures it's set correctly for every request
  process.env.AUTH0_BASE_URL = baseUrl;
  console.log(`Middleware: Force set AUTH0_BASE_URL to ${baseUrl} for all requests`);
  
  // Continue processing the request
  return NextResponse.next();
}

/**
 * Configure middleware to run only on auth routes
 */
export const config = {
  matcher: [
    '/api/auth/:path*',
    '/auth/:path*',
  ],
}; 