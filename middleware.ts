import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';

export const middleware = withMiddlewareAuthRequired();

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/subscriptions/:path*',
    '/api/integrations/:path*',
    '/api/billing/:path*',
  ],
}; 