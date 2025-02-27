import { NextResponse } from 'next/server';

// Force dynamic to prevent static optimization
export const dynamic = 'force-dynamic';

/**
 * This endpoint provides diagnostic information about the Auth0 configuration
 * without exposing sensitive information. This helps debug authentication issues.
 */
export async function GET(req: Request) {
  try {
    console.log('Auth0 diagnostic request received', { url: req.url });
    
    // Collect relevant environment variables for diagnosis
    const auth0Config = {
      // Check if essential Auth0 variables are defined (without revealing values)
      auth0SecretDefined: !!process.env.AUTH0_SECRET,
      auth0BaseUrlDefined: !!process.env.AUTH0_BASE_URL,
      auth0IssuerBaseUrlDefined: !!process.env.AUTH0_ISSUER_BASE_URL,
      auth0ClientIdDefined: !!process.env.AUTH0_CLIENT_ID,
      auth0ClientSecretDefined: !!process.env.AUTH0_CLIENT_SECRET,
      
      // Show partial values for debugging (first few chars only)
      baseUrlPrefix: process.env.AUTH0_BASE_URL?.substring(0, 12) + '...',
      issuerUrlPrefix: process.env.AUTH0_ISSUER_BASE_URL?.substring(0, 12) + '...',
      
      // Environment information
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      
      // System information
      timestamp: new Date().toISOString(),
      serverTimeUtc: new Date().toUTCString(),
    };
    
    // Return diagnostic information
    return NextResponse.json({
      status: 'success',
      message: 'Auth0 configuration diagnosis',
      config: auth0Config,
      auth0Routes: {
        login: '/api/auth/login',
        signup: '/api/auth/signup',
        callback: '/api/auth/callback',
        logout: '/api/auth/logout',
        debug: '/api/auth/debug'
      }
    });
  } catch (error) {
    console.error('Auth0 diagnostic error:', error);
    
    return NextResponse.json(
      { status: 'error', message: 'Failed to retrieve Auth0 configuration information' },
      { status: 500 }
    );
  }
} 