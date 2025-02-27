import { NextRequest, NextResponse } from 'next/server';
import { 
  handleAuth, 
  handleLogin, 
  handleCallback, 
  handleLogout,
  handleProfile,
  LoginOptions,
  CallbackOptions,
  LogoutOptions,
  ProfileOptions
} from '@auth0/nextjs-auth0';

// Force this route to be dynamic and evaluated only at runtime
export const dynamic = 'force-dynamic';

/**
 * Auth0 route handler for Next.js 15 App Router
 */

// This function creates a properly configured Auth0 handler
async function createAuthHandler(
  request: NextRequest, 
  auth0Route: string
) {
  // Parse the URL to get query parameters
  const url = new URL(request.url);
  const returnTo = url.searchParams.get('returnTo') || '/dashboard';
  const screenHint = url.searchParams.get('screen_hint');
  
  // Set up options for each Auth0 operation
  const loginOptions: LoginOptions = {
    authorizationParams: {
      // Add screen_hint for signup if provided
      ...(screenHint === 'signup' ? { screen_hint: 'signup' } : {}),
      // Standard login parameters
      scope: 'openid profile email',
      redirect_uri: process.env.AUTH0_CALLBACK_URL
    },
    returnTo
  };
  
  const callbackOptions: CallbackOptions = {
    redirectUri: process.env.AUTH0_CALLBACK_URL
  };
  
  const logoutOptions: LogoutOptions = {
    returnTo: '/'
  };

  const profileOptions: ProfileOptions = {};
  
  // Create the Auth0 handler with configured options
  const handler = handleAuth({
    login: handleLogin(loginOptions),
    callback: handleCallback(callbackOptions),
    logout: handleLogout(logoutOptions),
    profile: handleProfile(profileOptions)
  });
  
  return handler;
}

// Route handler with correct parameter type handling for Next.js 15
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auth0: string }> }
) {
  // Get the params from the Promise
  const resolvedParams = await params;
  const auth0Route = resolvedParams.auth0;
  
  // Validate the route is supported
  const validRoutes = ['login', 'callback', 'logout', 'me'];
  if (!validRoutes.includes(auth0Route)) {
    return new NextResponse(`Auth route '${auth0Route}' not found`, { status: 404 });
  }
  
  try {
    // Create and use the handler
    const handler = await createAuthHandler(request, auth0Route);
    return await handler(request);
  } catch (error: any) {
    // Improved error handling
    console.error('Auth0 error:', error);
    const statusCode = error.status || 500;
    const message = error.message || 'Authentication error';
    return new NextResponse(message, { status: statusCode });
  }
}

// POST handler for Auth0 operations that require POST
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ auth0: string }> }
) {
  // Get the params from the Promise
  const resolvedParams = await params;
  const auth0Route = resolvedParams.auth0;
  
  try {
    const handler = await createAuthHandler(request, auth0Route);
    return await handler(request);
  } catch (error: any) {
    console.error('Auth0 error:', error);
    const statusCode = error.status || 500;
    const message = error.message || 'Authentication error';
    return new NextResponse(message, { status: statusCode });
  }
}

// This handles all Auth0 routes:
// /api/auth/login - Auth0 login with redirects
// /api/auth/logout - Auth0 logout
// /api/auth/callback - Callback URL from Auth0
// /api/auth/me - User profile information 