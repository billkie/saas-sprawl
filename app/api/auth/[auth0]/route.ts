import { handleAuth, handleLogin, handleCallback } from '@auth0/nextjs-auth0';

// Create the Auth0 handler with all supported authentication operations
const auth0Handler = handleAuth({
  async params() {
    return { auth0: ['login', 'logout', 'callback', 'me'] };
  },
  login: handleLogin({
    returnTo: '/dashboard'
  }),
  callback: handleCallback({
    redirectUri: process.env.AUTH0_BASE_URL ? `${process.env.AUTH0_BASE_URL}/api/auth/callback` : undefined
  })
});

export const GET = auth0Handler;
export const POST = auth0Handler;

// This handles all Auth0 routes:
// /api/auth/login - Auth0 login with redirects
// /api/auth/logout - Auth0 logout
// /api/auth/callback - Callback URL from Auth0
// /api/auth/me - User profile information 