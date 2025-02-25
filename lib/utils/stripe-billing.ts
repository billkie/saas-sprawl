import { stripe } from '@/lib/stripe';
import { PRICING_TIERS, SubscriptionTier } from '@/lib/config/pricing';
import type { Company, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

type CompanyWithStripe = Company & {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  subscriptionStatus: SubscriptionTier | null;
  subscriptionStartDate: Date | null;
  subscriptionEndDate: Date | null;
};

type CompanyUpdateData = {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  subscriptionStatus?: SubscriptionTier | null;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
};

export async function createOrUpdateCustomer(companyId: string, email: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  }) as CompanyWithStripe | null;

  if (!company) {
    throw new Error('Company not found');
  }

  let stripeCustomerId = company.stripeCustomerId;

  if (!stripeCustomerId) {
    // Create new customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        companyId,
        companyName: company.name,
      },
    });

    stripeCustomerId = customer.id;

    // Update company with Stripe customer ID
    await prisma.company.update({
      where: { id: companyId },
      data: {
        stripeCustomerId: customer.id,
      } as CompanyUpdateData,
    });
  }

  return stripeCustomerId;
}

export async function createSubscription(
  companyId: string,
  customerId: string,
  tier: SubscriptionTier
) {
  const pricingTier = PRICING_TIERS[tier];
  const priceId = process.env.STRIPE_USE_LIVE_MODE === 'true'
    ? pricingTier.stripePriceId.live
    : pricingTier.stripePriceId.test;

  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
    metadata: {
      companyId,
      tier,
    },
  });

  // Update company with subscription details
  await prisma.company.update({
    where: { id: companyId },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: tier,
      subscriptionStartDate: new Date(subscription.current_period_start * 1000),
      subscriptionEndDate: new Date(subscription.current_period_end * 1000),
    } as CompanyUpdateData,
  });

  // Create billing log
  const invoice = subscription.latest_invoice as any;
  await (prisma as any).billingLog.create({
    data: {
      companyId,
      amount: invoice.amount_due / 100, // Convert from cents
      currency: invoice.currency,
      status: 'PENDING',
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: invoice.payment_intent?.id,
      description: `Subscription started - ${pricingTier.name} tier`,
    },
  });

  return {
    subscriptionId: subscription.id,
    clientSecret: invoice.payment_intent?.client_secret,
  };
}

export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  
  const company = await prisma.company.findFirst({
    where: {
      stripeSubscriptionId: subscriptionId,
    } as Prisma.CompanyWhereInput,
  });

  if (company) {
    await prisma.company.update({
      where: { id: company.id },
      data: {
        subscriptionEndDate: new Date(subscription.current_period_end * 1000),
      } as CompanyUpdateData,
    });
  }

  return subscription;
}

export async function updateSubscription(
  subscriptionId: string,
  newTier: SubscriptionTier
) {
  const pricingTier = PRICING_TIERS[newTier];
  const priceId = process.env.STRIPE_USE_LIVE_MODE === 'true'
    ? pricingTier.stripePriceId.live
    : pricingTier.stripePriceId.test;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Update the subscription with the new price
  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: priceId,
    }],
    metadata: {
      tier: newTier,
    },
  });

  // Update company details
  const company = await prisma.company.findFirst({
    where: {
      stripeSubscriptionId: subscriptionId,
    } as Prisma.CompanyWhereInput,
  });

  if (company) {
    await prisma.company.update({
      where: { id: company.id },
      data: {
        subscriptionStatus: newTier,
        stripePriceId: priceId,
      } as CompanyUpdateData,
    });

    // Log the change
    await (prisma as any).billingLog.create({
      data: {
        companyId: company.id,
        amount: pricingTier.price,
        currency: 'USD',
        status: 'PENDING',
        description: `Subscription updated to ${pricingTier.name} tier`,
      },
    });
  }

  return updatedSubscription;
}

export async function handleSubscriptionUpdated(
  subscriptionId: string,
  status: string
) {
  const company = await prisma.company.findFirst({
    where: {
      stripeSubscriptionId: subscriptionId,
    } as Prisma.CompanyWhereInput,
  });

  if (!company) return;

  if (status === 'active') {
    // Update billing log status
    await (prisma as any).billingLog.updateMany({
      where: {
        companyId: company.id,
        status: 'PENDING',
      },
      data: {
        status: 'PAID',
      },
    });
  } else if (status === 'canceled' || status === 'unpaid') {
    await prisma.company.update({
      where: { id: company.id },
      data: {
        subscriptionStatus: null,
        subscriptionEndDate: new Date(),
      } as CompanyUpdateData,
    });
  }
} 