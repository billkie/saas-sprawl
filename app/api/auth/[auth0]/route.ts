import { handleAuth } from '@auth0/nextjs-auth0';

// Create the base handler
const auth0Handler = handleAuth();

// Create route handlers that await params
export async function GET(req: Request, ctx: { params: { auth0: string } }) {
  // Await params resolution before using them
  const params = await Promise.resolve(ctx.params);
  return auth0Handler(req, { params });
}

export async function POST(req: Request, ctx: { params: { auth0: string } }) {
  // Await params resolution before using them
  const params = await Promise.resolve(ctx.params);
  return auth0Handler(req, { params });
}

// This handles all Auth0 routes:
// /api/auth/login
// /api/auth/logout
// /api/auth/callback
// /api/auth/me 