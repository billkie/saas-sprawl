import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { getIntegrationStatus } from '@/lib/integrations';
import { IntegrationCard } from '@/components/integrations/integration-card';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Integrations - Ziruna',
  description: 'Manage your integrations',
};

export default async function IntegrationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const status = await getIntegrationStatus(session.user.id);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Integrations</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <IntegrationCard
          title="QuickBooks"
          description="Connect your QuickBooks account to automatically discover and track subscriptions from your bills and expenses."
          icon="/icons/quickbooks.svg"
          status={status.quickbooks}
          type="quickbooks"
          stats={[
            {
              label: 'Discovered Subscriptions',
              value: status.quickbooks.discoveredSubscriptions.toString(),
            },
            {
              label: 'Last Sync',
              value: status.quickbooks.lastSyncAt
                ? new Date(status.quickbooks.lastSyncAt).toLocaleDateString()
                : 'Never',
            },
          ]}
        />
        <IntegrationCard
          title="Google Workspace"
          description="Connect your Google Workspace account to discover third-party apps and services used in your organization."
          icon="/icons/google.svg"
          status={status.googleWorkspace}
          type="google"
          stats={[
            {
              label: 'Discovered Apps',
              value: status.googleWorkspace.discoveredApps.toString(),
            },
            {
              label: 'Last Sync',
              value: status.googleWorkspace.lastSyncAt
                ? new Date(status.googleWorkspace.lastSyncAt).toLocaleDateString()
                : 'Never',
            },
          ]}
          additionalInfo={
            status.googleWorkspace.isConnected && !status.googleWorkspace.isAdmin
              ? 'Admin privileges required for app discovery'
              : undefined
          }
        />
      </div>
    </div>
  );
} 