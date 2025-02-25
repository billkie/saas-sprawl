import prisma from '@/lib/prisma';
import { PaymentFrequency, BillingType, AppSource, SubscriptionStatus } from '@prisma/client';

export interface SubscriptionWithDetails {
  id: string;
  vendorName: string;
  description: string | null;
  status: SubscriptionStatus;
  monthlyAmount: number;
  currency: string;
  lastTransactionDate: Date | null;
  nextChargeDate: Date | null;
  paymentFrequency: PaymentFrequency;
  billingType: BillingType | null;
  category: string | null;
  autoRenewal: boolean;
  notifyBefore: number | null;
  source: AppSource;
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

export async function getSubscriptions(userId: string): Promise<SubscriptionWithDetails[]> {
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
    select: {
      id: true,
      vendorName: true,
      description: true,
      status: true,
      monthlyAmount: true,
      currency: true,
      lastTransactionDate: true,
      nextChargeDate: true,
      paymentFrequency: true,
      billingType: true,
      category: true,
      autoRenewal: true,
      notifyBefore: true,
      source: true,
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

  return subscriptions as SubscriptionWithDetails[];
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
  currency?: string;
  paymentFrequency: PaymentFrequency;
  billingType?: BillingType;
  category?: string;
  autoRenewal?: boolean;
  notifyBefore?: number;
  nextChargeDate?: Date;
  planId: string;
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
      autoRenewal: data.autoRenewal ?? true,
      currency: data.currency ?? 'USD',
    },
  });

  return subscription;
} 