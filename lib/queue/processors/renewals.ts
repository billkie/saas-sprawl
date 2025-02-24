import prisma from '@/lib/prisma';
import { sendRenewalReminder } from '@/lib/email';
import type { Subscription } from '@prisma/client';

interface RenewalNotification {
  companyId: string;
  companyName: string;
  subscriptionId: string;
  vendorName: string;
  subscriptionName: string;
  amount: number;
  currency: string;
  renewalDate: Date;
  daysUntilRenewal: number;
  source: string;
  category?: string | null;
  lastChargeDate?: Date | null;
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
        notifyBefore: {
          not: null,
        },
      },
      include: {
        company: {
          include: {
            users: {
              where: {
                role: {
                  in: ['OWNER', 'ADMIN'],
                },
              },
              include: {
                user: true,
              },
            },
          },
        },
        discoveredApps: true,
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

      // If renewal is within notification period or overdue
      if (daysUntilRenewal <= subscription.notifyBefore) {
        notifications.push({
          companyId: subscription.companyId,
          companyName: subscription.company.name,
          subscriptionId: subscription.id,
          vendorName: subscription.vendorName,
          subscriptionName: subscription.description || subscription.vendorName,
          amount: subscription.lastChargeAmount || subscription.monthlyAmount,
          currency: subscription.currency,
          renewalDate: subscription.nextChargeDate,
          daysUntilRenewal,
          source: subscription.quickbooksVendorId ? 'QuickBooks' : 
                 subscription.discoveredApps.length > 0 ? 'Google Workspace' : 
                 'Manual Entry',
          category: subscription.category,
          lastChargeDate: subscription.lastTransactionDate,
        });
      }
    }

    // Send notifications
    for (const notification of notifications) {
      const subscription = subscriptions.find(s => s.id === notification.subscriptionId);
      if (!subscription) continue;

      // Send to all owners and admins
      for (const companyUser of subscription.company.users) {
        try {
          await sendRenewalReminder(
            companyUser.user.email,
            {
              userName: companyUser.user.name || 'there',
              companyName: notification.companyName,
              vendorName: notification.vendorName,
              subscriptionName: notification.subscriptionName,
              amount: notification.amount,
              currency: notification.currency,
              renewalDate: notification.renewalDate.toISOString(),
              daysUntilRenewal: notification.daysUntilRenewal,
              managementUrl: `${process.env.AUTH0_BASE_URL}/dashboard/subscriptions/${notification.subscriptionId}`,
              source: notification.source,
              category: notification.category || undefined,
              lastChargeDate: notification.lastChargeDate?.toISOString(),
            }
          );
          results.notificationsScheduled++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push(`Failed to send notification to ${companyUser.user.email}: ${errorMessage}`);
        }
      }
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