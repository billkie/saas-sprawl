import { NextResponse } from 'next/server';

// Force dynamic to prevent static optimization
export const dynamic = 'force-dynamic';

/**
 * Validates and normalizes Auth0 environment variables
 * Handles cases where placeholders like ${VERCEL_URL} aren't properly interpolated
 */
function getValidatedEnvVars(req: Request) {
  // Get required environment variables
  const auth0Secret = process.env.AUTH0_SECRET;
  let auth0BaseUrl = process.env.AUTH0_BASE_URL || '';
  const auth0IssuerBaseUrl = process.env.AUTH0_ISSUER_BASE_URL;
  const auth0ClientId = process.env.AUTH0_CLIENT_ID;
  const auth0ClientSecret = process.env.AUTH0_CLIENT_SECRET;
  
  // Check if any required variables are missing
  const missingVars = [];
  if (!auth0Secret) missingVars.push('AUTH0_SECRET');
  if (!auth0BaseUrl) missingVars.push('AUTH0_BASE_URL');
  if (!auth0IssuerBaseUrl) missingVars.push('AUTH0_ISSUER_BASE_URL');
  if (!auth0ClientId) missingVars.push('AUTH0_CLIENT_ID');
  if (!auth0ClientSecret) missingVars.push('AUTH0_CLIENT_SECRET');
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Special handling for BASE_URL - detect if it contains unresolved ${VERCEL_URL} or similar
  if (auth0BaseUrl.includes('${VERCEL_URL}')) {
    console.log('Detected unresolved ${VERCEL_URL} in AUTH0_BASE_URL');
    
    // Get actual VERCEL_URL from environment
    const vercelUrl = process.env.VERCEL_URL;
    
    if (vercelUrl) {
      // Replace the placeholder with the actual value
      auth0BaseUrl = `https://${vercelUrl}`;
      console.log(`Replaced \${VERCEL_URL} with actual value: ${auth0BaseUrl}`);
    } else {
      // Try to get hostname from request as fallback
      const host = req.headers.get('host');
      if (host) {
        const protocol = host.includes('localhost') ? 'http' : 'https';
        auth0BaseUrl = `${protocol}://${host}`;
        console.log(`Using request host as fallback: ${auth0BaseUrl}`);
      } else {
        console.error('Could not determine base URL from request or environment');
      }
    }
  }
  
  return {
    auth0Secret,
    auth0BaseUrl,
    auth0IssuerBaseUrl,
    auth0ClientId,
    auth0ClientSecret
  };
}

/**
 * Creates an Auth0 handler with detailed error reporting
 */
async function getSafeAuthHandler(operation: string, req: Request) {
  try {
    // Get and validate environment variables
    const envVars = getValidatedEnvVars(req);
    console.log(`Auth0 ${operation} handler initialized with base URL: ${envVars.auth0BaseUrl}`);
    
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
    // Log detailed error information
    console.error(`Auth0 ${operation} handler error:`, error);
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      console.error(`Stack trace: ${error.stack}`);
    }
    
    // Check for common Auth0 configuration issues
    let errorMessage = `Failed to initialize Auth0 ${operation} handler`;
    if (error instanceof Error) {
      if (error.message.includes('AUTH0_BASE_URL')) {
        errorMessage = `Auth0 base URL configuration error: ${error.message}`;
      } else if (error.message.includes('AUTH0_SECRET')) {
        errorMessage = `Auth0 secret configuration error: ${error.message}`;
      } else {
        errorMessage = `Auth0 configuration error: ${error.message}`;
      }
    }
    
    // Return a function that produces an appropriate error response
    return () => {
      return NextResponse.json(
        { 
          error: 'Authentication service configuration error',
          message: errorMessage,
          url: req.url,
          timestamp: new Date().toISOString()
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
    const handler = await getSafeAuthHandler('GET', req);
    return await handler(req);
  } catch (error) {
    console.error('Unhandled Auth0 GET error:', error);
    return NextResponse.json(
      { 
        error: 'Authentication error', 
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        url: req.url,
        timestamp: new Date().toISOString()
      },
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
    const handler = await getSafeAuthHandler('POST', req);
    return await handler(req);
  } catch (error) {
    console.error('Unhandled Auth0 POST error:', error);
    return NextResponse.json(
      { 
        error: 'Authentication error', 
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        url: req.url,
        timestamp: new Date().toISOString()
      },
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