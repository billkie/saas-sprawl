import { handleAuth } from '@auth0/nextjs-auth0';

// Create the base handler
const auth0Handler = handleAuth();

export const GET = auth0Handler;
export const POST = auth0Handler;

// This handles all Auth0 routes:
// /api/auth/login
// /api/auth/logout
// /api/auth/callback
// /api/auth/me 