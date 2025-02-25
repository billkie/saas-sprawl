import prisma from '@/lib/prisma';

export interface Notification {
  id: string;
  type: 'renewal' | 'discovery' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  data?: {
    subscriptionId?: string;
    appId?: string;
    amount?: number;
    currency?: string;
    renewalDate?: Date;
  };
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const userWithCompany = await prisma.user.findFirst({
    where: { id: userId },
    include: {
      companies: {
        include: {
          company: {
            include: {
              notifications: {
                orderBy: {
                  createdAt: 'desc',
                },
                take: 100, // Limit to last 100 notifications
              },
            },
          },
        },
      },
    },
  });

  const notifications = userWithCompany?.companies[0]?.company?.notifications || [];
  return notifications.map(notification => ({
    id: notification.id,
    type: notification.type as Notification['type'],
    title: notification.title,
    message: notification.message,
    read: notification.read,
    createdAt: notification.createdAt,
    data: notification.data as Notification['data'],
  }));
}

export async function markNotificationAsRead(notificationId: string) {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  const userWithCompany = await prisma.user.findFirst({
    where: { id: userId },
    include: {
      companies: {
        include: {
          company: true,
        },
      },
    },
  });

  const companyId = userWithCompany?.companies[0]?.company?.id;
  if (!companyId) return;

  await prisma.notification.updateMany({
    where: { companyId },
    data: { read: true },
  });
}

export async function deleteNotification(notificationId: string) {
  await prisma.notification.delete({
    where: { id: notificationId },
  });
}

export async function createNotification({
  companyId,
  type,
  title,
  message,
  data,
}: {
  companyId: string;
  type: Notification['type'];
  title: string;
  message: string;
  data?: Notification['data'];
}) {
  await prisma.notification.create({
    data: {
      type,
      title,
      message,
      data,
      companyId,
    },
  });
} 