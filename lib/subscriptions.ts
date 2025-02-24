import { prisma } from '@/lib/prisma';

export interface SubscriptionWithDetails {
  id: string;
  vendorName: string;
  description: string | null;
  status: string;
  monthlyAmount: number;
  currency: string;
  lastChargeDate: Date | null;
  nextChargeDate: Date | null;
  billingFrequency: string;
  category: string | null;
  autoRenew: boolean;
  notifyBefore: number | null;
  source: 'MANUAL' | 'QUICKBOOKS' | 'GOOGLE_WORKSPACE';
  discoveredApps: {
    name: string;
    website: string | null;
    logoUrl: string | null;
    source: string;
    lastSeen: Date;
  }[];
  _count: {
    billingLogs: number;
  };
}

export async function getSubscriptions(userId: string) {
  // Get user's company
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

  const company = userWithCompany?.companies[0]?.company;
  if (!company) {
    throw new Error('No company found');
  }

  // Get all subscriptions with related data
  const subscriptions = await prisma.subscription.findMany({
    where: {
      companyId: company.id,
    },
    include: {
      discoveredApps: {
        select: {
          name: true,
          website: true,
          logoUrl: true,
          source: true,
          lastSeen: true,
        },
      },
      _count: {
        select: {
          billingLogs: true,
        },
      },
    },
    orderBy: [
      { status: 'asc' },
      { nextChargeDate: 'asc' },
    ],
  });

  return subscriptions;
}

export async function getSubscriptionCategories() {
  // Get unique categories from the database
  const categories = await prisma.subscription.findMany({
    where: {
      category: {
        not: null,
      },
    },
    select: {
      category: true,
    },
    distinct: ['category'],
  });

  return categories.map(c => c.category!).sort();
}

export interface CreateSubscriptionData {
  vendorName: string;
  description?: string;
  monthlyAmount: number;
  currency: string;
  billingFrequency: string;
  category?: string;
  autoRenew: boolean;
  notifyBefore?: number;
  nextChargeDate?: Date;
}

export async function createSubscription(
  userId: string,
  data: CreateSubscriptionData
) {
  // Get user's company
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

  const company = userWithCompany?.companies[0]?.company;
  if (!company) {
    throw new Error('No company found');
  }

  // Create subscription
  const subscription = await prisma.subscription.create({
    data: {
      ...data,
      companyId: company.id,
      status: 'ACTIVE',
      source: 'MANUAL',
    },
  });

  return subscription;
} 