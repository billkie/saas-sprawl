import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = ['/', '/auth/signin', '/pricing', '/privacy', '/terms'];
  if (publicPaths.includes(path)) {
    return NextResponse.next();
  }

  // Skip auth check for static files and auth endpoints
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api/auth') ||
    path.includes('favicon.ico') ||
    path.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  const session = await getSession();
  const isAuthenticated = !!session?.user;

  // If accessing dashboard without auth, redirect to login
  if (path.startsWith('/dashboard') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/api/auth/login', request.url));
  }

  // If authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthenticated && path === '/auth/signin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 