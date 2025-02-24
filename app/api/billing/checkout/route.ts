import { NextResponse } from 'next/server';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { stripe } from '@/lib/stripe';
import { PRICING_TIERS, SubscriptionTier } from '@/lib/config/pricing';
import prisma from '@/lib/prisma';

export const POST = withApiAuthRequired(async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { tier } = body as { tier: SubscriptionTier };

    if (!tier || !PRICING_TIERS[tier]) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Get user's company
    const userWithCompany = await prisma.user.findFirst({
      where: { email: session.user.email },
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
      return NextResponse.json({ error: 'No company found' }, { status: 404 });
    }

    const pricingTier = PRICING_TIERS[tier];
    const priceId = process.env.STRIPE_USE_LIVE_MODE === 'true'
      ? pricingTier.stripePriceId.live
      : pricingTier.stripePriceId.test;

    // Create or get Stripe customer
    let stripeCustomerId = company.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          companyId: company.id,
          companyName: company.name,
        },
      });
      stripeCustomerId = customer.id;

      // Save Stripe customer ID
      await prisma.company.update({
        where: { id: company.id },
        data: { stripeCustomerId: customer.id },
      });
    }

    // Create Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        companyId: company.id,
        tier,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      success_url: `${process.env.AUTH0_BASE_URL}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.AUTH0_BASE_URL}/pricing?checkout=cancelled`,
      subscription_data: {
        metadata: {
          companyId: company.id,
          tier,
        },
      },
    });

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}); 