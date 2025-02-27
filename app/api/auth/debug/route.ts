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
    
    // Get the actual domain that's being used
    const host = req.headers.get('host') || '';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const actualBaseUrl = `${protocol}://${host}`;
    
    // CRITICAL FIX: Always override AUTH0_BASE_URL
    // This ensures it's set correctly for the entire application
    const originalBaseUrl = process.env.AUTH0_BASE_URL || '';
    process.env.AUTH0_BASE_URL = actualBaseUrl;
    console.log(`Debug: FORCE SET AUTH0_BASE_URL to ${actualBaseUrl}`);
    
    // Get the raw base URL value to check for interpolation issues
    const hasPlaceholders = originalBaseUrl.includes('${') && originalBaseUrl.includes('}');
    
    // Collect relevant environment variables for diagnosis
    const auth0Config = {
      // Check if essential Auth0 variables are defined (without revealing values)
      auth0SecretDefined: !!process.env.AUTH0_SECRET,
      auth0BaseUrlDefined: !!process.env.AUTH0_BASE_URL,
      auth0IssuerBaseUrlDefined: !!process.env.AUTH0_ISSUER_BASE_URL,
      auth0ClientIdDefined: !!process.env.AUTH0_CLIENT_ID,
      auth0ClientSecretDefined: !!process.env.AUTH0_CLIENT_SECRET,
      
      // Show base URL information
      originalBaseUrl: originalBaseUrl.substring(0, 25) + '...',
      currentBaseUrl: process.env.AUTH0_BASE_URL,
      
      // Show partial values for debugging (first few chars only)
      issuerUrlPrefix: process.env.AUTH0_ISSUER_BASE_URL?.substring(0, 25) + '...',
      
      // Environment variable quality checks
      originalBaseUrlHasPlaceholders: hasPlaceholders,
      forceOverridden: true,
      actualDomain: actualBaseUrl,
      vercelSystem: {
        vercelUrl: process.env.VERCEL_URL,
        vercelEnv: process.env.VERCEL_ENV,
        vercelRegion: process.env.VERCEL_REGION,
        vercelId: process.env.VERCEL_ID,
        vercelTimestamp: process.env.VERCEL_TIMESTAMP
      },
      potentialFallbacks: {
        vercelUrlAvailable: !!process.env.VERCEL_URL,
        vercelUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
        publicVercelUrlAvailable: !!process.env.NEXT_PUBLIC_VERCEL_URL,
        publicVercelUrl: process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null,
        hostHeader: req.headers.get('host') ? `https://${req.headers.get('host')}` : null
      },
      
      // Environment information
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      
      // System information
      timestamp: new Date().toISOString(),
      serverTimeUtc: new Date().toUTCString(),
      requestUrl: req.url
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
        directLogin: '/api/auth/direct-login',
        directSignup: '/api/auth/direct-signup',
        debug: '/api/auth/debug',
        status: '/api/auth/status'
      },
      recommendedAction: hasPlaceholders 
        ? `Your original AUTH0_BASE_URL contained unresolved placeholders. We've automatically fixed this by setting it to '${actualBaseUrl}' for this request. To fix this permanently, you should update all environments (Production, Preview, Development) in the Vercel dashboard.` 
        : `Your AUTH0_BASE_URL is correctly configured, but we're still overriding it with '${actualBaseUrl}' for consistency.`
    });
  } catch (error) {
    console.error('Auth0 diagnostic error:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to retrieve Auth0 configuration information',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 