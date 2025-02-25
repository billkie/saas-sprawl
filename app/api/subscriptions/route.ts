import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

// Subscription input validation schema
const subscriptionSchema = z.object({
  planId: z.string(),
  status: z.enum(['ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING', 'EXPIRED']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  vendorName: z.string(),
  monthlyAmount: z.number(),
  paymentFrequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'UNKNOWN']),
  autoRenewal: z.boolean().default(true),
  notifyBefore: z.number().default(14),
});

// GET /api/subscriptions
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
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
      include: {
        discoveredApps: true,
        _count: {
          select: {
            billingLogs: true
          }
        }
      }
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
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

    // Create subscription with proper Prisma input type
    const subscriptionData: Prisma.SubscriptionCreateInput = {
      planId: validatedData.planId,
      status: validatedData.status,
      startDate: new Date(validatedData.startDate),
      ...(validatedData.endDate && { endDate: new Date(validatedData.endDate) }),
      vendorName: validatedData.vendorName,
      monthlyAmount: validatedData.monthlyAmount,
      paymentFrequency: validatedData.paymentFrequency,
      autoRenewal: validatedData.autoRenewal,
      notifyBefore: validatedData.notifyBefore,
      company: {
        connect: { id: companyId }
      }
    };

    const subscription = await prisma.subscription.create({
      data: subscriptionData,
      include: {
        discoveredApps: true,
        _count: {
          select: {
            billingLogs: true
          }
        }
      }
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
} 