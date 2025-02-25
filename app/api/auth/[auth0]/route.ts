import { handleAuth } from '@auth0/nextjs-auth0';

// Create a simple handler that manages all Auth0 routes
const auth0Handler = handleAuth();

// Export route handlers
export const GET = auth0Handler;
export const POST = auth0Handler;

// This handles all Auth0 routes:
// /api/auth/login
// /api/auth/logout
// /api/auth/callback
// /api/auth/me 