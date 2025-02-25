import prisma from '@/lib/prisma';

export interface IntegrationStatus {
  quickbooks: {
    isConnected: boolean;
    lastSyncAt: Date | null;
    discoveredSubscriptions: number;
    realmId: string | null;
  };
  googleWorkspace: {
    isConnected: boolean;
    lastSyncAt: Date | null;
    discoveredApps: number;
    domain: string | null;
    isAdmin: boolean;
  };
}

export async function getIntegrationStatus(userId: string): Promise<IntegrationStatus> {
  // Get user's company
  const userWithCompany = await prisma.user.findFirst({
    where: { id: userId },
    include: {
      companies: {
        include: {
          company: {
            include: {
              quickbooksIntegration: true,
              googleWorkspaceIntegration: true,
              subscriptions: {
                where: {
                  OR: [
                    { quickbooksVendorId: { not: null } },
                    { discoveredApps: { some: {} } },
                  ],
                },
              },
            },
          },
        },
      },
    },
  });

  const company = userWithCompany?.companies[0]?.company;
  if (!company) {
    throw new Error('No company found');
  }

  // Count discovered subscriptions from QuickBooks
  const quickbooksSubscriptions = company.subscriptions.filter(
    sub => sub.quickbooksVendorId !== null
  ).length;

  // Count discovered apps from Google Workspace
  const googleApps = company.subscriptions.filter(
    sub => sub.discoveredApps && sub.discoveredApps.length > 0
  ).length;

  return {
    quickbooks: {
      isConnected: !!company.quickbooksIntegration,
      lastSyncAt: company.quickbooksIntegration?.lastSyncAt || null,
      discoveredSubscriptions: quickbooksSubscriptions,
      realmId: company.quickbooksIntegration?.realmId || null,
    },
    googleWorkspace: {
      isConnected: !!company.googleWorkspaceIntegration,
      lastSyncAt: company.googleWorkspaceIntegration?.lastSyncAt || null,
      discoveredApps: googleApps,
      domain: company.googleWorkspaceIntegration?.domain || null,
      isAdmin: company.googleWorkspaceIntegration?.isAdmin || false,
    },
  };
}

export async function initiateQuickBooksAuth() {
  const response = await fetch('/api/integrations/quickbooks', {
    method: 'POST',
  });
  const data = await response.json();
  return data.authUri;
}

export async function initiateGoogleAuth() {
  const response = await fetch('/api/integrations/google', {
    method: 'POST',
  });
  const data = await response.json();
  return data.authUri;
}

export async function syncIntegration(type: 'quickbooks' | 'google') {
  const response = await fetch(`/api/integrations/${type}/sync`, {
    method: 'GET',
  });
  return response.json();
}

export async function disconnectIntegration(type: 'quickbooks' | 'google') {
  const response = await fetch(`/api/integrations/${type}`, {
    method: 'DELETE',
  });
  return response.json();
} 