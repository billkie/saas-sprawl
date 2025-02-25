import { NextRequest, NextResponse } from 'next/server';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { PRICING_TIERS, SubscriptionTier } from '@/lib/config/pricing';

export const POST = withApiAuthRequired(async function POST(
  req: NextRequest
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { tier } = body as { tier: SubscriptionTier };

    if (!tier || !PRICING_TIERS[tier]) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { companies: true },
    });

    if (!user?.companies[0]) {
      return NextResponse.json(
        { error: 'No company found for user' },
        { status: 404 }
      );
    }

    const company = user.companies[0];
    
    // Create or retrieve Stripe customer
    let customerId = company.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          companyId: company.id,
        },
      });
      customerId = customer.id;
      
      await prisma.company.update({
        where: { id: company.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICING_TIERS[tier].stripePriceId.test,
          quantity: 1,
        },
      ],
      success_url: `${process.env.AUTH0_BASE_URL}/dashboard/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.AUTH0_BASE_URL}/dashboard/settings`,
      metadata: {
        companyId: company.id,
        tier,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}); 