import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';

export const middleware = withMiddlewareAuthRequired();

// Set up routing protection for dashboard
export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
}; 