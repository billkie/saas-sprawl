import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { getSubscriptions } from '@/lib/subscriptions';
import { SubscriptionList } from '@/components/subscriptions/subscription-list';
import { AddSubscriptionButton } from '@/components/subscriptions/add-subscription-button';

export const metadata: Metadata = {
  title: 'Subscriptions - Ziruna',
  description: 'Manage your SaaS subscriptions',
};

export default async function SubscriptionsPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const subscriptions = await getSubscriptions(session.user.id);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Subscriptions</h2>
        <AddSubscriptionButton />
      </div>
      <SubscriptionList subscriptions={subscriptions} />
    </div>
  );
} 