import { NextResponse } from 'next/server';

// Force dynamic to prevent static optimization
export const dynamic = 'force-dynamic';

/**
 * This endpoint provides a direct login link to Auth0 without using the SDK
 * Useful as a fallback when the main Auth0 integration has configuration issues.
 */
export async function GET(req: Request) {
  try {
    // Extract query parameters
    const url = new URL(req.url);
    const screenHint = url.searchParams.get('screen_hint');
    const returnTo = url.searchParams.get('returnTo') || '/dashboard';
    
    // Get Auth0 configuration directly from environment variables
    const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL?.replace('https://', '').split('/')[0];
    const auth0ClientId = process.env.AUTH0_CLIENT_ID;
    
    // Determine host from request for redirect_uri
    const host = req.headers.get('host') || '';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    
    // Check if AUTH0_BASE_URL contains unresolved VERCEL_URL
    let auth0BaseUrl = process.env.AUTH0_BASE_URL || '';
    if (auth0BaseUrl.includes('${VERCEL_URL}')) {
      console.log('Direct login: Detected unresolved ${VERCEL_URL} in AUTH0_BASE_URL');
      
      // Use actual domain from request
      auth0BaseUrl = baseUrl;
      console.log(`Direct login: Using request origin as AUTH0_BASE_URL: ${auth0BaseUrl}`);
    }
    
    // Create redirect URI
    const redirectUri = `${baseUrl}/api/auth/callback`;
    
    // Check if critical variables are available
    if (!auth0Domain || !auth0ClientId) {
      return NextResponse.json(
        { 
          error: 'Configuration error',
          message: 'Auth0 domain or client ID is not configured correctly'
        },
        { status: 500 }
      );
    }
    
    // Construct Auth0 universal login URL
    let auth0Url = `https://${auth0Domain}/authorize?`;
    auth0Url += `client_id=${encodeURIComponent(auth0ClientId)}`;
    auth0Url += `&response_type=code`;
    auth0Url += `&redirect_uri=${encodeURIComponent(redirectUri)}`;
    auth0Url += `&scope=openid+profile+email`;
    auth0Url += `&state=${encodeURIComponent(JSON.stringify({ returnTo }))}`;
    
    // Add screen_hint for signup if provided
    if (screenHint === 'signup') {
      auth0Url += `&screen_hint=signup`;
    }
    
    // Redirect to Auth0 login
    return NextResponse.redirect(auth0Url);
    
  } catch (error) {
    console.error('Direct login error:', error);
    
    return NextResponse.json(
      { 
        error: 'Authentication error',
        message: 'Failed to redirect to authentication service'
      },
      { status: 500 }
    );
  }
} 