import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequestWithAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(request: NextRequestWithAuth) {
    // Add auth header to all API requests
    if (request.nextUrl.pathname.startsWith('/api')) {
      if (request.nextauth.token) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('Authorization', `Bearer ${request.nextauth.token.sub}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Public paths that don't require authentication
        if (
          req.nextUrl.pathname === '/' ||
          req.nextUrl.pathname === '/auth/signin' ||
          req.nextUrl.pathname === '/pricing' ||
          req.nextUrl.pathname === '/privacy' ||
          req.nextUrl.pathname === '/terms'
        ) {
          return true;
        }

        // Protect API routes except auth endpoints
        if (
          req.nextUrl.pathname.startsWith('/api') &&
          !req.nextUrl.pathname.startsWith('/api/auth')
        ) {
          return !!token;
        }

        // Protect dashboard routes
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return !!token;
        }

        return true;
      },
    },
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
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 