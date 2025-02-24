import prisma from '@/lib/prisma';
import { GoogleWorkspaceClient } from '@/lib/clients/google';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = `${process.env.AUTH0_BASE_URL}/api/integrations/google/callback`;

export async function syncGoogleWorkspace() {
  const integrations = await prisma.googleWorkspaceIntegration.findMany({
    include: {
      company: true,
    },
  });

  const results = {
    success: 0,
    failed: 0,
    total: integrations.length,
    errors: [] as string[],
  };

  for (const integration of integrations) {
    try {
      const googleClient = new GoogleWorkspaceClient({
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        redirectUri: GOOGLE_REDIRECT_URI,
      });

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

        googleClient.setCredentials(tokens);
      } else {
        googleClient.setCredentials({
          accessToken: integration.accessToken,
          refreshToken: integration.refreshToken,
          tokenExpiresAt: integration.tokenExpiresAt,
        });
      }

      // Skip if not admin
      if (!integration.isAdmin) {
        console.log(`Skipping sync for ${integration.company.name} - not an admin`);
        continue;
      }

      // Get third-party apps
      const apps = await googleClient.getThirdPartyApps();

      // Process discovered apps
      for (const app of apps) {
        await prisma.discoveredApp.upsert({
          where: {
            companyId_appId: {
              companyId: integration.companyId,
              appId: app.id || app.name,
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
            companyId: integration.companyId,
            name: app.name,
            appId: app.id,
            website: app.website,
            description: app.description,
            logoUrl: app.iconUrl,
            source: 'GOOGLE_WORKSPACE',
            scopes: app.scopes || [],
          },
        });
      }

      // Update last sync time
      await prisma.googleWorkspaceIntegration.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date() },
      });

      console.log(`Successfully synced ${apps.length} apps for company ${integration.company.name}`);
      results.success++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error syncing Google Workspace for company ${integration.company.name}:`, error);
      results.failed++;
      results.errors.push(`${integration.company.name}: ${errorMessage}`);
    }
  }

  return results;
} 