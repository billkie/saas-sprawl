import { prisma } from '@/lib/prisma';

export interface SubscriptionDetails {
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  plan: 'free' | 'pro' | 'enterprise';
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
  free: {
    subscriptions: 5,
    features: {
      multiUser: false,
      customIntegrations: false,
      advancedAnalytics: false,
    },
  },
  pro: {
    subscriptions: 50,
    features: {
      multiUser: true,
      customIntegrations: false,
      advancedAnalytics: true,
    },
  },
  enterprise: {
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
  const userWithCompany = await prisma.user.findFirst({
    where: { id: userId },
    include: {
      companies: {
        include: {
          company: {
            include: {
              subscription: true,
              subscriptions: true,
            },
          },
        },
      },
    },
  });

  const company = userWithCompany?.companies[0]?.company;
  if (!company) {
    throw new Error('No company found');
  }

  const subscription = company.subscription;
  const trackedSubscriptions = company.subscriptions.length;

  const plan = (subscription?.plan as 'free' | 'pro' | 'enterprise') || 'free';
  const planLimits = PLAN_LIMITS[plan];

  return {
    status: (subscription?.status as SubscriptionDetails['status']) || 'trialing',
    plan,
    currentPeriodEnd: subscription?.currentPeriodEnd || null,
    subscriptionId: subscription?.stripeSubscriptionId || null,
    usage: {
      trackedSubscriptions,
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