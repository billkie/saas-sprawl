import { handleAuth } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

// Force dynamic to prevent static optimization
export const dynamic = 'force-dynamic';

// Set AUTH0_BASE_URL based on the request domain
if (process.env.AUTH0_BASE_URL?.includes('${VERCEL_URL}')) {
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    process.env.AUTH0_BASE_URL = `https://${vercelUrl}`;
    console.log(`Set AUTH0_BASE_URL to ${process.env.AUTH0_BASE_URL}`);
  }
}

// Create a simple handler for GET and POST requests
async function createAuthHandler() {
  try {
    // Get Auth0 handler with minimal configuration
    const handler = handleAuth();
    return handler;
  } catch (error) {
    console.error('Auth0 handler error:', error);
    return () => {
      return NextResponse.json(
        { 
          error: 'Authentication service configuration error',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    };
  }
}

// Handle all GET requests to /api/auth/* routes
export async function GET(req: Request) {
  try {
    const handler = await createAuthHandler();
    // CRITICAL FIX: The 'return await' pattern is necessary for Next.js App Router
    return await handler(req);
  } catch (error) {
    console.error('Auth0 GET error:', error);
    return NextResponse.json(
      { 
        error: 'Authentication error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Handle all POST requests to /api/auth/* routes
export async function POST(req: Request) {
  try {
    const handler = await createAuthHandler();
    // CRITICAL FIX: The 'return await' pattern is necessary for Next.js App Router
    return await handler(req);
  } catch (error) {
    console.error('Auth0 POST error:', error);
    return NextResponse.json(
      { 
        error: 'Authentication error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 