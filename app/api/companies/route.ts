import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for company data
const companySchema = z.object({
  companyName: z.string().min(2).max(100),
  industry: z.string().min(2).max(50),
  size: z.string().min(1).max(20),
  userId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    // Verify the user is authenticated
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate the request body
    const body = await req.json();
    const { companyName, industry, size, userId } = companySchema.parse(body);

    // Verify the authenticated user matches the user ID in the request
    if (session.user.sub !== userId && session.user.email !== body.email) {
      return NextResponse.json(
        { error: 'User ID does not match authenticated user' },
        { status: 403 }
      );
    }

    // Find the user by ID or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { email: session.user.email }
        ]
      },
      include: {
        companies: {
          include: {
            company: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the user already has a company
    if (user.companies.length > 0) {
      // Update existing company
      const companyId = user.companies[0].companyId;
      
      const updatedCompany = await prisma.company.update({
        where: { id: companyId },
        data: {
          name: companyName,
        },
      });

      return NextResponse.json(updatedCompany);
    }

    // Generate a slug from company name
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Create a new company
    const company = await prisma.company.create({
      data: {
        name: companyName,
        slug: `${slug}-${Date.now().toString().slice(-6)}`, // Ensure uniqueness
        users: {
          create: {
            user: {
              connect: { id: user.id }
            },
            role: 'OWNER',
          }
        }
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating company:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 