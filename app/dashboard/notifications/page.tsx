import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { getNotifications } from '@/lib/notifications';
import { NotificationsList } from '@/components/notifications/notifications-list';

export const metadata: Metadata = {
  title: 'Notifications - Ziruna',
  description: 'View and manage your notifications',
};

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const notifications = await getNotifications(session.user.id);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
      </div>
      <NotificationsList initialNotifications={notifications} userId={session.user.id} />
    </div>
  );
} 