import { handleAuth, HandlerError } from '@auth0/nextjs-auth0';

// Create a handler instance
const handler = handleAuth();

// Export route handlers with proper parameter handling
export async function GET(
  req: Request,
  context: { params: { auth0: string } }
) {
  try {
    // Wait for params to be resolved
    await Promise.resolve(context.params);
    return handler(req);
  } catch (error) {
    return new Response(
      (error instanceof HandlerError ? error.message : 'Internal Server Error'),
      { status: error instanceof HandlerError ? error.status : 500 }
    );
  }
}

export async function POST(
  req: Request,
  context: { params: { auth0: string } }
) {
  try {
    // Wait for params to be resolved
    await Promise.resolve(context.params);
    return handler(req);
  } catch (error) {
    return new Response(
      (error instanceof HandlerError ? error.message : 'Internal Server Error'),
      { status: error instanceof HandlerError ? error.status : 500 }
    );
  }
}

// This handles all Auth0 routes:
// /api/auth/login
// /api/auth/logout
// /api/auth/callback
// /api/auth/me 