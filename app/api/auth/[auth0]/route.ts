import { handleAuth } from '@auth0/nextjs-auth0';

export const GET = async (req: Request, { params }: { params: { auth0: string[] } }) => {
  const auth0Params = await Promise.resolve(params.auth0);
  return handleAuth()(req);
}; 