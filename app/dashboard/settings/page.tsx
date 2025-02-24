import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BillingSettings } from '@/components/settings/billing-settings';
import { AccountSettings } from '@/components/settings/account-settings';
import { TeamSettings } from '@/components/settings/team-settings';
import { getSubscriptionDetails } from '@/lib/billing';

export const metadata: Metadata = {
  title: 'Settings - Ziruna',
  description: 'Manage your account settings and subscription',
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const subscriptionDetails = await getSubscriptionDetails(session.user.id);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      <Tabs defaultValue="billing" className="space-y-4">
        <TabsList>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        <TabsContent value="billing" className="space-y-4">
          <BillingSettings subscriptionDetails={subscriptionDetails} />
        </TabsContent>
        <TabsContent value="account" className="space-y-4">
          <AccountSettings user={session.user} />
        </TabsContent>
        <TabsContent value="team" className="space-y-4">
          <TeamSettings userId={session.user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 