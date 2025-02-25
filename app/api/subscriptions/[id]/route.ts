import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const subscriptionSchema = z.object({
  planId: z.string().optional(),
  status: z.enum(['ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING', 'EXPIRED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Helper function to check subscription access
async function checkSubscriptionAccess(subscriptionId: string, userEmail: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      id: subscriptionId,
      company: {
        users: {
          some: {
            user: {
              email: userEmail
            }
          }
        }
      }
    },
  });

  return subscription;
}

// PUT /api/subscriptions/[id]
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await checkSubscriptionAccess(context.params.id, session.user.email);
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = subscriptionSchema.parse(body);

    const updatedSubscription = await prisma.subscription.update({
      where: { id: context.params.id },
      data: validatedData,
    });

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/subscriptions/[id]
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await checkSubscriptionAccess(context.params.id, session.user.email);
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    await prisma.subscription.delete({
      where: { id: context.params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 