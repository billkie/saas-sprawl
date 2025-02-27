import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { LoginOptions, LogoutOptions } from '@auth0/nextjs-auth0';
import prisma from '@/lib/prisma';

// Force dynamic to prevent static optimization
export const dynamic = 'force-dynamic';

// CRITICAL FIX: Explicitly set AUTH0_BASE_URL at the module level
// This ensures it's set before any Auth0 SDK code runs
if (process.env.AUTH0_BASE_URL?.includes('${VERCEL_URL}')) {
  // Get actual VERCEL_URL from environment
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    process.env.AUTH0_BASE_URL = `https://${vercelUrl}`;
    console.log(`Module-level fix: Set AUTH0_BASE_URL to ${process.env.AUTH0_BASE_URL}`);
  }
}

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
      // CRITICAL FIX: Also update the process.env value for other modules
      process.env.AUTH0_BASE_URL = auth0BaseUrl;
      console.log(`Replaced \${VERCEL_URL} with actual value: ${auth0BaseUrl}`);
    } else {
      // Try to get hostname from request as fallback
      const host = req.headers.get('host');
      if (host) {
        const protocol = host.includes('localhost') ? 'http' : 'https';
        auth0BaseUrl = `${protocol}://${host}`;
        // CRITICAL FIX: Also update the process.env value for other modules
        process.env.AUTH0_BASE_URL = auth0BaseUrl;
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

// Setup database hooks for Auth0 users
async function setupUserInDb() {
  // This function is called after authentication to set up users in our database
  const { getSession } = await import('@auth0/nextjs-auth0');
  const session = await getSession();
  
  if (!session?.user?.email) {
    console.log('No user in session, skipping database setup');
    return false;
  }
  
  try {
    // Find or create user in the database
    const user = await prisma.user.upsert({
      where: { 
        email: session.user.email 
      },
      update: {
        name: session.user.name,
        image: session.user.picture,
      },
      create: {
        email: session.user.email,
        name: session.user.name,
        image: session.user.picture,
      },
      include: {
        companies: true
      }
    });
    
    const isNewUser = user.id && !user.createdAt;
    const needsOnboarding = isNewUser || user.companies.length === 0;
    
    console.log(`User ${user.email} setup complete. Needs onboarding: ${needsOnboarding}`);
    return needsOnboarding;
  } catch (error) {
    console.error('Error setting up user in database:', error);
    return false;
  }
}

/**
 * Creates an Auth0 handler with detailed error reporting
 */
async function getSafeAuthHandler(operation: string, req: Request) {
  try {
    // Get and validate environment variables
    const envVars = getValidatedEnvVars(req);
    console.log(`Auth0 ${operation} handler initialized with base URL: ${envVars.auth0BaseUrl}`);
    
    // Import Auth0 handler with dynamic import
    const { handleAuth } = await import('@auth0/nextjs-auth0');
    
    // For all routes, use the standard handleAuth without custom handlers
    // This is the most reliable pattern for Next.js App Router
    return handleAuth();
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
    
    // Special handling for signup route - redirect to login with screen_hint=signup
    if (params.auth0 === 'signup') {
      console.log('Processing signup request through login with screen_hint...');
      
      // For signup, we redirect to the login endpoint with screen_hint=signup
      const loginUrl = new URL(`${req.url.split('/signup')[0]}/login`);
      loginUrl.searchParams.set('screen_hint', 'signup');
      
      return NextResponse.redirect(loginUrl);
    }
    
    // For callback route, we'll handle user creation/checks after Auth0 processing
    if (params.auth0 === 'callback') {
      console.log('Processing callback request...');
    }
    
    // Get the appropriate handler and process the request
    const handler = await getSafeAuthHandler(params.auth0, req);
    // CRITICAL FIX: Add 'return' before await per StackOverflow solution
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
    const handler = await getSafeAuthHandler(params.auth0, req);
    // CRITICAL FIX: Add 'return' before await per StackOverflow solution
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
 * /api/auth/signup - Auth0 signup with screen_hint=signup (handled by redirecting to login)
 * /api/auth/callback - Callback URL from Auth0 with simple user processing
 * /api/auth/logout - Auth0 logout
 */ 