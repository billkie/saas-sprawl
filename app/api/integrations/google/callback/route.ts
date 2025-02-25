import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import prisma from '@/lib/prisma';
import { GoogleWorkspaceClient } from '@/lib/clients/google';
import { processDiscoveredApps } from '@/lib/utils/google-integration';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = `${process.env.AUTH0_BASE_URL}/api/integrations/google/callback`;

// Initialize Google client
const googleClient = new GoogleWorkspaceClient({
  clientId: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  redirectUri: GOOGLE_REDIRECT_URI,
});

// Helper function to get user's company
async function getUserCompany(userEmail: string) {
  const userWithCompany = await prisma.user.findFirst({
    where: { email: userEmail },
    include: {
      companies: {
        include: {
          company: true,
        },
      },
    },
  });

  return userWithCompany?.companies[0]?.company;
}

// GET /api/integrations/google/callback - OAuth callback handler
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const company = await getUserCompany(session.user.email);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get the authorization code from the URL
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    if (!code) {
      return NextResponse.json({ error: 'No authorization code' }, { status: 400 });
    }

    // Exchange code for tokens
    const tokens = await googleClient.createToken(code);

    // Check admin privileges
    googleClient.setCredentials(tokens);
    const isAdmin = await googleClient.checkAdminPrivileges();

    // Store the tokens in the database
    await prisma.googleWorkspaceIntegration.upsert({
      where: { companyId: company.id },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.tokenExpiresAt,
        domain: tokens.domain,
        isAdmin,
      },
      create: {
        companyId: company.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.tokenExpiresAt,
        domain: tokens.domain!,
        isAdmin,
      },
    });

    // If admin, trigger initial sync
    if (isAdmin) {
      const apps = await googleClient.getThirdPartyApps();
      const processedCount = await processDiscoveredApps(apps, company.id);
      console.log(`Initially discovered ${processedCount} apps`);
    }

    // Redirect to the dashboard with success message
    const redirectUrl = new URL('/dashboard', request.url);
    redirectUrl.searchParams.set('integration', 'google');
    redirectUrl.searchParams.set('status', 'success');
    redirectUrl.searchParams.set('message', `Successfully connected to ${tokens.domain}`);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Error handling Google callback:', error);
    
    // Redirect to dashboard with error message
    const redirectUrl = new URL('/dashboard', request.url);
    redirectUrl.searchParams.set('integration', 'google');
    redirectUrl.searchParams.set('status', 'error');
    redirectUrl.searchParams.set('message', 'Failed to connect Google Workspace');

    return NextResponse.redirect(redirectUrl.toString());
  }
} 