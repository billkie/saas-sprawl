import { handleAuth, HandlerError } from '@auth0/nextjs-auth0';

// Create handlers for each auth endpoint
const handlers = handleAuth({
  async login(req: Request) {
    return handleAuth()(req);
  },
  async logout(req: Request) {
    return handleAuth()(req);
  },
  async callback(req: Request) {
    return handleAuth()(req);
  },
  async me(req: Request) {
    return handleAuth()(req);
  },
  onError(req: Request, error: Error) {
    console.error(error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof HandlerError ? error.message : 'Internal Server Error' 
      }),
      { 
        status: error instanceof HandlerError ? error.status : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper function to handle route parameters and requests
async function handleRoute(req: Request) {
  try {
    return handlers(req);
  } catch (error) {
    console.error('Auth0 handler error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Export route handlers
export const GET = handleRoute;
export const POST = handleRoute;

// This handles all Auth0 routes:
// /api/auth/login
// /api/auth/logout
// /api/auth/callback
// /api/auth/me 