import prisma from '@/lib/prisma';

export interface App {
  id?: string;
  name: string;
  website?: string;
  description?: string;
  iconUrl?: string;
  scopes?: string[];
}

export async function processDiscoveredApps(apps: App[], companyId: string) {
  let processedCount = 0;

  for (const app of apps) {
    // Update or create discovered app
    await prisma.discoveredApp.upsert({
      where: {
        id: app.id || `${companyId}-${app.name}`,
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
        id: app.id || `${companyId}-${app.name}`,
        companyId,
        name: app.name,
        appId: app.id || app.name,
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