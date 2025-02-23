import { NextResponse } from 'next/server';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import prisma from '@/lib/prisma';
import { GoogleWorkspaceClient } from '@/lib/clients/google';

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

// Helper function to process discovered apps
async function processDiscoveredApps(apps: App[], companyId: string) {
  let processedCount = 0;

  for (const app of apps) {
    // Update or create discovered app
    await prisma.discoveredApp.upsert({
      where: {
        companyId_appId: {
          companyId,
          appId: app.id || app.name, // Use name as ID if no app ID
        },
      },
      update: {
        lastSeen: new Date(),
        installCount: { increment: 1 },
        website: app.website,
        description: app.description,
        logoUrl: app.iconUrl,
        scopes: app.scopes || [],
      },
      create: {
        companyId,
        name: app.name,
        appId: app.id,
        website: app.website,
        description: app.description,
        logoUrl: app.iconUrl,
        source: 'GOOGLE_WORKSPACE',
        scopes: app.scopes || [],
      },
    });

    processedCount++;
  }

  return processedCount;
}

// POST /api/integrations/google - Start OAuth flow
export const POST = withApiAuthRequired(async (request: Request) => {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authUri = googleClient.getAuthorizationUrl(session.user.email);
    return NextResponse.json({ authUri });
  } catch (error) {
    console.error('Error initiating Google OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google Workspace integration' },
      { status: 500 }
    );
  }
});

// GET /api/integrations/google/sync - Manual sync
export const GET = withApiAuthRequired(async (request: Request) => {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const company = await getUserCompany(session.user.email);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const integration = await prisma.googleWorkspaceIntegration.findUnique({
      where: { companyId: company.id },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Google Workspace not connected' },
        { status: 404 }
      );
    }

    // Check if token is expired and refresh if needed
    if (new Date() >= integration.tokenExpiresAt) {
      const tokens = await googleClient.refreshToken(integration.refreshToken);
      
      await prisma.googleWorkspaceIntegration.update({
        where: { id: integration.id },
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: tokens.tokenExpiresAt,
        },
      });

      // Update the tokens in the client
      googleClient.setCredentials(tokens);
    } else {
      // Initialize client with existing tokens
      googleClient.setCredentials({
        accessToken: integration.accessToken,
        refreshToken: integration.refreshToken,
        tokenExpiresAt: integration.tokenExpiresAt,
      });
    }

    // Check admin privileges
    const isAdmin = await googleClient.checkAdminPrivileges();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'User does not have admin privileges' },
        { status: 403 }
      );
    }

    // Get third-party apps
    const apps = await googleClient.getThirdPartyApps();

    // Process discovered apps
    const processedCount = await processDiscoveredApps(apps, company.id);

    // Update last sync time
    await prisma.googleWorkspaceIntegration.update({
      where: { id: integration.id },
      data: { 
        lastSyncAt: new Date(),
        isAdmin: true,
      },
    });

    return NextResponse.json({
      message: `Successfully processed ${processedCount} apps`,
      totalApps: apps.length,
    });
  } catch (error) {
    console.error('Error syncing with Google Workspace:', error);
    return NextResponse.json(
      { error: 'Failed to sync with Google Workspace' },
      { status: 500 }
    );
  }
}); 