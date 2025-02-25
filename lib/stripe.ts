import Stripe from 'stripe';

// Environment-based configuration
const config = {
  secretKey: process.env.STRIPE_USE_LIVE_MODE === 'true'
    ? process.env.STRIPE_LIVE_SECRET_KEY!
    : process.env.STRIPE_TEST_SECRET_KEY!,
  publishableKey: process.env.STRIPE_USE_LIVE_MODE === 'true'
    ? process.env.STRIPE_LIVE_PUBLISHABLE_KEY!
    : process.env.STRIPE_TEST_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_USE_LIVE_MODE === 'true'
    ? process.env.STRIPE_LIVE_WEBHOOK_SECRET!
    : process.env.STRIPE_TEST_WEBHOOK_SECRET!,
  isLiveMode: process.env.STRIPE_USE_LIVE_MODE === 'true',
};

// Initialize Stripe with API version and type information
const stripe = new Stripe(config.secretKey, {
  apiVersion: '2025-01-27.acacia', // Lock to specific API version
  typescript: true,
});

export { stripe, config as stripeConfig }; 