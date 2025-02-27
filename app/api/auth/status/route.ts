import { NextResponse } from 'next/server';

// Force dynamic to prevent static optimization
export const dynamic = 'force-dynamic';

// Define types for the health check data
interface Auth0Connectivity {
  success: boolean;
  statusCode?: number;
  statusText?: string;
  error?: string;
}

interface Auth0Status {
  configured: boolean;
  endpoints: {
    login: string;
    signup: string;
    callback: string;
    logout: string;
  };
  connectivity?: Auth0Connectivity;
}

interface HealthData {
  status: 'up' | 'error';
  timestamp: string;
  auth0: Auth0Status;
  environment: string;
  version: string;
}

/**
 * This endpoint checks the health of Auth0 integration
 * and attempts to verify connectivity to Auth0 services.
 */
export async function GET(req: Request) {
  try {
    console.log('Auth0 status check requested', { url: req.url });
    
    // Basic health check data
    const healthData: HealthData = {
      status: 'up',
      timestamp: new Date().toISOString(),
      auth0: {
        configured: isAuth0Configured(),
        endpoints: {
          login: '/api/auth/login',
          signup: '/api/auth/signup',
          callback: '/api/auth/callback',
          logout: '/api/auth/logout'
        }
      },
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
    };

    // Add Auth0 connectivity test result if Auth0 is configured
    if (healthData.auth0.configured) {
      try {
        // Check if we can fetch Auth0 metadata without authenticating
        // This just verifies network connectivity to Auth0
        const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL?.replace('https://', '');
        const metadataUrl = `https://${auth0Domain}/.well-known/openid-configuration`;
        
        const response = await fetch(metadataUrl, { 
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        });
        
        healthData.auth0.connectivity = {
          success: response.ok,
          statusCode: response.status,
          statusText: response.statusText
        };
      } catch (error) {
        healthData.auth0.connectivity = {
          success: false,
          error: 'Failed to connect to Auth0'
        };
      }
    }
    
    return NextResponse.json(healthData);
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to retrieve health information',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Check if Auth0 is configured with all required environment variables
 */
function isAuth0Configured(): boolean {
  const requiredVars = [
    'AUTH0_SECRET',
    'AUTH0_BASE_URL',
    'AUTH0_ISSUER_BASE_URL',
    'AUTH0_CLIENT_ID',
    'AUTH0_CLIENT_SECRET'
  ];
  
  return requiredVars.every(varName => !!process.env[varName]);
} 