import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://dev.quacco.com';
    const authUrl = process.env.AUTH0_ISSUER_BASE_URL;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const redirectUri = `${baseUrl}/api/auth/callback`;
    const returnToUrl = `${baseUrl}/dashboard`;
    
    // Build Auth0 login URL
    const loginUrl = new URL(`${authUrl}/authorize`);
    loginUrl.searchParams.append('client_id', clientId);
    loginUrl.searchParams.append('redirect_uri', redirectUri);
    loginUrl.searchParams.append('response_type', 'code');
    loginUrl.searchParams.append('scope', 'openid profile email');
    loginUrl.searchParams.append('state', Buffer.from(JSON.stringify({
      returnTo: returnToUrl
    })).toString('base64'));
    
    return NextResponse.redirect(loginUrl.toString());
  } catch (error) {
    console.error('Error building login URL:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://dev.quacco.com'}/auth/signin?error=login_error`);
  }
} 