import { handleAuth } from '@auth0/nextjs-auth0';

// Export the handlers directly with no custom configuration
// This is the recommended way to use handleAuth in Next.js App Router
export const { GET, POST } = handleAuth();

// This handles all Auth0 routes:
// /api/auth/login
// /api/auth/logout
// /api/auth/callback
// /api/auth/me 