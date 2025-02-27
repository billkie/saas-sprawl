import { NextResponse } from 'next/server';

// Force dynamic to prevent static optimization
export const dynamic = 'force-dynamic';

// Validate required environment variables at runtime
function validateEnvVars() {
  const requiredVars = [
    'AUTH0_SECRET',
    'AUTH0_BASE_URL',
    'AUTH0_ISSUER_BASE_URL', 
    'AUTH0_CLIENT_ID',
    'AUTH0_CLIENT_SECRET'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Create a safe Auth0 handler that handles all errors
async function getSafeAuthHandler(operation: string) {
  try {
    validateEnvVars();
    
    // Import Auth0 SDK dynamically to prevent build-time evaluation
    const { handleAuth, handleLogin, handleCallback, handleLogout } = await import('@auth0/nextjs-auth0');
    
    // Create and return the Auth0 handler with detailed configuration
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
        returnTo: '/',
      }),
    });
  } catch (error) {
    console.error(`Auth0 ${operation} handler error:`, error);
    
    // Return a function that produces an appropriate error response
    return () => {
      return NextResponse.json(
        { 
          error: 'Authentication service configuration error',
          message: `Failed to initialize Auth0 ${operation} handler` 
        },
        { status: 500 }
      );
    };
  }
}

/**
 * Handle all GET requests to /api/auth/* routes
 * This handles login, signup, callback, and logout
 */
export async function GET(
  req: Request, 
  context: { params: Promise<{ auth0: string }> }
) {
  try {
    // In Next.js 15 App Router, params is a Promise that must be awaited
    const params = await context.params;
    console.log(`Auth0 GET request for: ${params.auth0}`, { url: req.url });
    
    // Get the appropriate handler and process the request
    const handler = await getSafeAuthHandler('GET');
    return await handler(req);
  } catch (error) {
    console.error('Unhandled Auth0 GET error:', error);
    return NextResponse.json(
      { error: 'Authentication error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Handle all POST requests to /api/auth/* routes
 * This is primarily used for callbacks
 */
export async function POST(
  req: Request, 
  context: { params: Promise<{ auth0: string }> }
) {
  try {
    // In Next.js 15 App Router, params is a Promise that must be awaited
    const params = await context.params;
    console.log(`Auth0 POST request for: ${params.auth0}`, { url: req.url });
    
    // Get the appropriate handler and process the request
    const handler = await getSafeAuthHandler('POST');
    return await handler(req);
  } catch (error) {
    console.error('Unhandled Auth0 POST error:', error);
    return NextResponse.json(
      { error: 'Authentication error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
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