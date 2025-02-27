import { NextRequest, NextResponse } from 'next/server';
import { handleAuth, handleLogin, handleCallback, handleLogout } from '@auth0/nextjs-auth0';

// Force this route to be dynamic and evaluated only at runtime
export const dynamic = 'force-dynamic';

/**
 * Auth0 route handler
 * 
 * Next.js 15 requires route parameters to be accessed asynchronously,
 * so we create a custom handler that works with the Promise-based params.
 */

// Create the Auth0 handler configuration
const authOptions = {
  login: handleLogin({
    authorizationParams: {
      scope: 'openid profile email'
    },
    returnTo: '/dashboard'
  }),
  callback: handleCallback({
    redirectUri: process.env.AUTH0_CALLBACK_URL
  }),
  logout: handleLogout({
    returnTo: '/'
  })
};

// This function defines a custom auth handler that matches Next.js 15's expectations
async function createHandler(request: NextRequest, auth0Route: string) {
  // Validate route
  const validRoutes = ['login', 'callback', 'logout', 'me'];
  if (!validRoutes.includes(auth0Route)) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    // Create a dynamic handler per request to avoid type issues
    const handler = handleAuth(authOptions);
    return await handler(request);
  } catch (error) {
    console.error('Auth0 error:', error);
    return new NextResponse('Authentication error', { status: 500 });
  }
}

// Route handler with correct parameter type handling for Next.js 15
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auth0: string }> }
) {
  // Get the params from the Promise
  const resolvedParams = await params;
  return createHandler(request, resolvedParams.auth0);
}

// POST handler with correct parameter type handling for Next.js 15
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ auth0: string }> }
) {
  // Get the params from the Promise
  const resolvedParams = await params;
  return createHandler(request, resolvedParams.auth0);
}

// This handles all Auth0 routes:
// /api/auth/login - Auth0 login with redirects
// /api/auth/logout - Auth0 logout
// /api/auth/callback - Callback URL from Auth0
// /api/auth/me - User profile information 