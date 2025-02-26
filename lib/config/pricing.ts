export enum SubscriptionTier {
  BASIC = 'BASIC',
  GROWTH = 'GROWTH',
  ENTERPRISE = 'ENTERPRISE',
}

export interface PricingTier {
  id: SubscriptionTier;
  name: string;
  price: number;
  appLimit: number;
  stripePriceId: {
    test: string;
    live: string;
  };
  features: string[];
}

export const PRICING_TIERS: Record<SubscriptionTier, PricingTier> = {
  [SubscriptionTier.BASIC]: {
    id: SubscriptionTier.BASIC,
    name: 'Basic',
    price: 29,
    appLimit: 20,
    stripePriceId: {
      test: 'prod_RqUiV4ZDUc1131', // You'll add these after creating products in Stripe
      live: '',
    },
    features: [
      'Track up to 20 apps',
      'Basic app discovery',
      'Renewal tracking',
      'Email notifications',
    ],
  },
  [SubscriptionTier.GROWTH]: {
    id: SubscriptionTier.GROWTH,
    name: 'Growth',
    price: 99,
    appLimit: 100,
    stripePriceId: {
      test: 'prod_RqUjZlaJ4emygv',
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
  [SubscriptionTier.ENTERPRISE]: {
    id: SubscriptionTier.ENTERPRISE,
    name: 'Enterprise',
    price: 1000,
    appLimit: -1, // -1 indicates unlimited
    stripePriceId: {
      test: 'prod_RqUjZDUPEzwjfC',
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