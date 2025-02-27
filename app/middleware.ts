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
  
  // Fix environment variables if they contain unresolved placeholders
  if (process.env.AUTH0_BASE_URL?.includes('${')) {
    // Dynamically set AUTH0_BASE_URL using request host
    process.env.AUTH0_BASE_URL = baseUrl;
    console.log(`Middleware: Fixed AUTH0_BASE_URL to ${baseUrl}`);
  }
  
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