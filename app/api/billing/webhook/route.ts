import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe, stripeConfig } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';
import type { SubscriptionTier } from '@/lib/config/pricing';
import { PRICING_TIERS } from '@/lib/config/pricing';
import {
  sendSubscriptionConfirmation,
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCanceledEmail,
} from '@/lib/email';

type CompanyUpdateData = {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  subscriptionStatus?: SubscriptionTier | null;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
};

// Disable body parser for raw body access
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getStripeEvent(req: Request): Promise<Stripe.Event> {
  const body = await req.text();
  const headersList = headers();
  const sig = headersList.has('stripe-signature') ? headersList.get('stripe-signature')! : null;

  if (!sig) {
    throw new Error('No Stripe signature found');
  }

  // Verify webhook signature
  return stripe.webhooks.constructEvent(
    body,
    sig,
    stripeConfig.webhookSecret
  );
}

async function getCompanyWithOwner(companyId: string) {
  return prisma.company.findUnique({
    where: { id: companyId },
    include: {
      users: {
        where: { role: 'OWNER' },
        include: { user: true },
      },
    },
  });
}

export async function POST(req: Request) {
  try {
    const event = await getStripeEvent(req);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        
        // Update company subscription status
        await prisma.company.update({
          where: { id: session.metadata?.companyId },
          data: {
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: session.metadata?.tier || null,
            subscriptionStartDate: new Date(subscription.current_period_start * 1000),
            subscriptionEndDate: new Date(subscription.current_period_end * 1000),
          } as CompanyUpdateData,
        });

        // Create billing log
        await (prisma as any).billingLog.create({
          data: {
            companyId: session.metadata?.companyId!,
            amount: session.amount_total! / 100,
            currency: session.currency!,
            status: 'PAID',
            stripeInvoiceId: session.invoice as string,
            description: `Subscription payment - ${session.metadata?.tier} tier`,
          },
        });

        // Send confirmation email
        const company = await getCompanyWithOwner(session.metadata?.companyId!);
        if (company && company.users[0]?.user.email) {
          const tier = session.metadata?.tier as SubscriptionTier;
          await sendSubscriptionConfirmation(
            company.users[0].user.email,
            {
              companyName: company.name,
              planName: PRICING_TIERS[tier].name,
              amount: session.amount_total! / 100,
              currency: session.currency!,
              nextBillingDate: new Date(subscription.current_period_end * 1000).toISOString(),
            }
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await prisma.company.update({
          where: { id: subscription.metadata?.companyId },
          data: {
            subscriptionStatus: subscription.metadata?.tier || null,
            subscriptionEndDate: new Date(subscription.current_period_end * 1000),
          } as CompanyUpdateData,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await prisma.company.update({
          where: { id: subscription.metadata?.companyId },
          data: {
            subscriptionStatus: null,
            subscriptionEndDate: new Date(),
          } as CompanyUpdateData,
        });

        // Send cancellation email
        const company = await getCompanyWithOwner(subscription.metadata?.companyId!);
        if (company && company.users[0]?.user.email) {
          const tier = subscription.metadata?.tier as SubscriptionTier;
          await sendSubscriptionCanceledEmail(
            company.users[0].user.email,
            {
              companyName: company.name,
              planName: PRICING_TIERS[tier].name,
              endDate: new Date(subscription.current_period_end * 1000).toISOString(),
            }
          );
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription && invoice.metadata?.companyId) {
          await (prisma as any).billingLog.create({
            data: {
              companyId: invoice.metadata.companyId,
              amount: invoice.amount_paid / 100,
              currency: invoice.currency,
              status: 'PAID',
              stripeInvoiceId: invoice.id,
              description: `Subscription renewal - ${invoice.metadata.tier} tier`,
            },
          });

          // Send success email
          const company = await getCompanyWithOwner(invoice.metadata.companyId);
          if (company && company.users[0]?.user.email) {
            const tier = invoice.metadata.tier as SubscriptionTier;
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            await sendPaymentSuccessEmail(
              company.users[0].user.email,
              {
                companyName: company.name,
                planName: PRICING_TIERS[tier].name,
                amount: invoice.amount_paid / 100,
                currency: invoice.currency,
                nextBillingDate: new Date(subscription.current_period_end * 1000).toISOString(),
              }
            );
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription && invoice.metadata?.companyId) {
          await (prisma as any).billingLog.create({
            data: {
              companyId: invoice.metadata.companyId,
              amount: invoice.amount_due / 100,
              currency: invoice.currency,
              status: 'FAILED',
              stripeInvoiceId: invoice.id,
              description: `Failed payment - ${invoice.metadata.tier} tier`,
            },
          });

          // Send failure email
          const company = await getCompanyWithOwner(invoice.metadata.companyId);
          if (company && company.users[0]?.user.email) {
            const tier = invoice.metadata.tier as SubscriptionTier;
            await sendPaymentFailedEmail(
              company.users[0].user.email,
              {
                companyName: company.name,
                planName: PRICING_TIERS[tier].name,
                amount: invoice.amount_due / 100,
                currency: invoice.currency,
                retryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
              }
            );
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
} 