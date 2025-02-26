import { handleAuth } from '@auth0/nextjs-auth0';

// Create the base handler with async params support - no custom auth options
const auth0Handler = handleAuth({
  async params() {
    return { auth0: ['login', 'logout', 'callback', 'me'] };
  }
});

export const GET = auth0Handler;
export const POST = auth0Handler;

// This handles all Auth0 routes:
// /api/auth/login - handled via /login route
// /api/auth/logout
// /api/auth/callback
// /api/auth/me 