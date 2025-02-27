import { NextRequest } from 'next/server';

// Prevent Next.js from statically optimizing this route
export const dynamic = 'force-dynamic';

/**
 * Auth0 handler for Next.js App Router
 * 
 * Following the official Next.js App Router integration pattern from Auth0
 * See: https://auth0.com/docs/quickstart/webapp/nextjs
 */

// This makes it clear we're intentionally not importing Auth0 at the top level
// to prevent build-time execution issues

// Only dynamically import Auth0 handlers at runtime, not during build
async function getAuthHandler() {
  try {
    // This is only imported at runtime, preventing build-time evaluation issues
    const { handleAuth, handleLogin, handleCallback, handleLogout } = await import('@auth0/nextjs-auth0');
    
    // Create and return the Auth0 handler with proper configuration
    return handleAuth({
      login: handleLogin({
        returnTo: '/dashboard',
        authorizationParams: {
          scope: 'openid profile email',
        },
      }),
      signup: handleLogin({
        returnTo: '/onboarding',
        authorizationParams: {
          screen_hint: 'signup',
          scope: 'openid profile email',
        },
      }),
      callback: handleCallback(),
      logout: handleLogout({
        returnTo: '/'
      })
    });
  } catch (error) {
    console.error('Failed to initialize Auth0 handler:', error);
    throw error;
  }
}

// The GET handler for Auth0 routes
export async function GET(req: Request) {
  // Only load the Auth0 handler at runtime
  const handler = await getAuthHandler();
  return handler(req);
}

// The POST handler for Auth0 routes
export async function POST(req: Request) {
  // Only load the Auth0 handler at runtime
  const handler = await getAuthHandler();
  return handler(req);
}

/**
 * This handles all Auth0 routes:
 * /api/auth/login - Auth0 login with redirects
 * /api/auth/signup - Auth0 signup with screen_hint=signup
 * /api/auth/callback - Callback URL from Auth0
 * /api/auth/logout - Auth0 logout
 */

// This handles all Auth0 routes:
// /api/auth/login - Auth0 login with redirects
// /api/auth/logout - Auth0 logout
// /api/auth/callback - Callback URL from Auth0
// /api/auth/me - User profile information 