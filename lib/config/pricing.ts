import { Prisma } from '@prisma/client';

export interface PricingTier {
  id: Prisma.SubscriptionTier;
  name: string;
  price: number;
  appLimit: number;
  stripePriceId: {
    test: string;
    live: string;
  };
  features: string[];
}

export const PRICING_TIERS: Record<Prisma.SubscriptionTier, PricingTier> = {
  BASIC: {
    id: 'BASIC',
    name: 'Basic',
    price: 29,
    appLimit: 20,
    stripePriceId: {
      test: 'prod_RplwWtraFEKoeU', // You'll add these after creating products in Stripe
      live: '',
    },
    features: [
      'Track up to 20 apps',
      'Basic app discovery',
      'Renewal tracking',
      'Email notifications',
    ],
  },
  GROWTH: {
    id: 'GROWTH',
    name: 'Growth',
    price: 99,
    appLimit: 100,
    stripePriceId: {
      test: 'prod_RplwkpVBZNlR5N',
      live: '',
    },
    features: [
      'Track up to 100 apps',
      'Advanced app discovery',
      'Renewal tracking',
      'Email notifications',
      'Slack integration',
      'Usage analytics',
    ],
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 1000,
    appLimit: -1, // -1 indicates unlimited
    stripePriceId: {
      test: 'prod_RplxWvnjNCn8QN',
      live: '',
    },
    features: [
      'Unlimited apps',
      'Advanced app discovery',
      'Renewal tracking',
      'Priority notifications',
      'All integrations',
      'Advanced analytics',
      'Dedicated support',
      'Custom features',
    ],
  },
}; 