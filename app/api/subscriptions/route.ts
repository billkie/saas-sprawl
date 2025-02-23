import { NextResponse } from 'next/server';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Subscription input validation schema
const subscriptionSchema = z.object({
  planId: z.string(),
  status: z.enum(['ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING', 'EXPIRED']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});

// GET /api/subscriptions
export const GET = withApiAuthRequired(async function GET(req) {
  try {
    const session = await getSession(req);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const userWithCompany = await prisma.user.findFirst({
      where: { email: session.user.email },
      include: {
        companies: {
          include: {
            company: true
          }
        }
      }
    });

    if (!userWithCompany?.companies[0]?.companyId) {
      return NextResponse.json({ error: 'No company found' }, { status: 404 });
    }

    const companyId = userWithCompany.companies[0].companyId;

    // Get subscriptions for the company
    const subscriptions = await prisma.subscription.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/subscriptions
export const POST = withApiAuthRequired(async function POST(req) {
  try {
    const session = await getSession(req);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = subscriptionSchema.parse(body);

    // Get user's company
    const userWithCompany = await prisma.user.findFirst({
      where: { email: session.user.email },
      include: {
        companies: {
          include: {
            company: true
          }
        }
      }
    });

    if (!userWithCompany?.companies[0]?.companyId) {
      return NextResponse.json({ error: 'No company found' }, { status: 404 });
    }

    const companyId = userWithCompany.companies[0].companyId;

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        ...validatedData,
        companyId,
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}); 