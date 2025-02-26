import prisma from '@/lib/prisma';
import { SubscriptionTier } from '@prisma/client';

export interface SubscriptionDetails {
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING';
  plan: SubscriptionTier;
  currentPeriodEnd: Date | null;
  subscriptionId: string | null;
  usage: {
    trackedSubscriptions: number;
    allowedSubscriptions: number;
  };
  features: {
    multiUser: boolean;
    customIntegrations: boolean;
    advancedAnalytics: boolean;
  };
}

const PLAN_LIMITS = {
  BASIC: {
    subscriptions: 20,
    features: {
      multiUser: false,
      customIntegrations: false,
      advancedAnalytics: false,
    },
  },
  GROWTH: {
    subscriptions: 100,
    features: {
      multiUser: true,
      customIntegrations: false,
      advancedAnalytics: true,
    },
  },
  ENTERPRISE: {
    subscriptions: Infinity,
    features: {
      multiUser: true,
      customIntegrations: true,
      advancedAnalytics: true,
    },
  },
} as const;

export async function getSubscriptionDetails(
  userId: string
): Promise<SubscriptionDetails> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      companies: {
        include: {
          company: true,
        },
      },
    },
  });

  if (!user?.companies[0]?.company) {
    throw new Error('No company found');
  }

  const company = user.companies[0].company;
  const subscriptionTier = company.subscriptionStatus || 'BASIC';
  const planLimits = PLAN_LIMITS[subscriptionTier];

  const subscriptions = await prisma.subscription.count({
    where: { companyId: company.id },
  });

  return {
    status: 'ACTIVE',
    plan: subscriptionTier,
    currentPeriodEnd: company.subscriptionEndDate,
    subscriptionId: company.stripeSubscriptionId,
    usage: {
      trackedSubscriptions: subscriptions,
      allowedSubscriptions: planLimits.subscriptions,
    },
    features: planLimits.features,
  };
}

export async function createCheckoutSession(priceId: string, userId: string) {
  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ priceId }),
  });
  
  const data = await response.json();
  return data.sessionUrl;
}

export async function createBillingPortalSession(userId: string) {
  const response = await fetch('/api/billing/portal', {
    method: 'POST',
  });
  
  const data = await response.json();
  return data.portalUrl;
} 