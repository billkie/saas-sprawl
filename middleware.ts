import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withMiddlewareAuthRequired(
  function middleware(request: NextRequest) {
    // Public paths that don't require authentication
    const publicPaths = ['/', '/auth/signin', '/pricing', '/privacy', '/terms'];
    const path = request.nextUrl.pathname;
    
    if (publicPaths.includes(path)) {
      return NextResponse.next();
    }

    // Protect API routes except auth endpoints
    if (path.startsWith('/api') && !path.startsWith('/api/auth')) {
      // Auth0 middleware already handles authentication
      return NextResponse.next();
    }

    // Protect dashboard routes
    if (path.startsWith('/dashboard')) {
      // Auth0 middleware already handles authentication
      return NextResponse.next();
    }

    return NextResponse.next();
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth routes (Auth0 handles these)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth/).*)',
  ],
}; 