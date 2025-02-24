import prisma from '@/lib/prisma';
import { notificationQueue } from '@/lib/queue';

interface RenewalNotification {
  companyId: string;
  companyName: string;
  subscriptionId: string;
  vendorName: string;
  renewalDate: Date;
  amount: number;
  currency: string;
  daysUntilRenewal: number;
}

export async function checkRenewals() {
  const results = {
    notificationsScheduled: 0,
    errors: [] as string[],
  };

  try {
    // Get all active subscriptions with upcoming renewals
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextChargeDate: {
          not: null,
        },
      },
      include: {
        company: true,
      },
    });

    const now = new Date();
    const notifications: RenewalNotification[] = [];

    // Check each subscription for upcoming renewals
    for (const subscription of subscriptions) {
      if (!subscription.nextChargeDate || !subscription.notifyBefore) continue;

      const daysUntilRenewal = Math.ceil(
        (subscription.nextChargeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // If renewal is within notification period
      if (daysUntilRenewal <= subscription.notifyBefore) {
        notifications.push({
          companyId: subscription.companyId,
          companyName: subscription.company.name,
          subscriptionId: subscription.id,
          vendorName: subscription.vendorName,
          renewalDate: subscription.nextChargeDate,
          amount: subscription.lastChargeAmount || subscription.monthlyAmount,
          currency: subscription.currency,
          daysUntilRenewal,
        });
      }
    }

    // Schedule notifications
    for (const notification of notifications) {
      await notificationQueue.add(
        'sendRenewalNotification',
        notification,
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        }
      );
      results.notificationsScheduled++;
    }

    console.log(`Scheduled ${results.notificationsScheduled} renewal notifications`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error checking renewals:', error);
    results.errors.push(errorMessage);
  }

  return results;
}

// Helper function to format currency
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
} 