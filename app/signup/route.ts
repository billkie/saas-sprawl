import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://dev.quacco.com';
    const authUrl = process.env.AUTH0_ISSUER_BASE_URL;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const redirectUri = `${baseUrl}/api/auth/callback`;
    const returnToUrl = `${baseUrl}/auth/onboarding`;
    
    // Build Auth0 signup URL
    const signupUrl = new URL(`${authUrl}/authorize`);
    signupUrl.searchParams.append('client_id', clientId);
    signupUrl.searchParams.append('redirect_uri', redirectUri);
    signupUrl.searchParams.append('response_type', 'code');
    signupUrl.searchParams.append('scope', 'openid profile email');
    signupUrl.searchParams.append('screen_hint', 'signup');
    signupUrl.searchParams.append('state', Buffer.from(JSON.stringify({
      returnTo: returnToUrl
    })).toString('base64'));
    
    return NextResponse.redirect(signupUrl.toString());
  } catch (error) {
    console.error('Error building signup URL:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://dev.quacco.com'}/auth/signup?error=signup_error`);
  }
} 