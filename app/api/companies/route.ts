import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for company data
const companySchema = z.object({
  companyName: z.string().min(2).max(100),
  website: z.string().optional(),
  industry: z.string().optional(),
  employeeCount: z.number().optional(),
  description: z.string().optional(),
  userId: z.string(),
});

// Force dynamic to prevent static optimization
export const dynamic = 'force-dynamic';

/**
 * POST /api/companies
 * Create a new company and associate it with the current user
 */
export async function POST(req: Request) {
  try {
    // Get the authenticated user
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the company data from the request
    const data = await req.json();
    const { companyName, website, industry, employeeCount, description } = data;

    // Validate required fields
    if (!companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Find or create the user in the database
    const user = await prisma.user.upsert({
      where: { 
        email: session.user.email as string 
      },
      update: {
        name: session.user.name,
        image: session.user.picture,
      },
      create: {
        email: session.user.email as string,
        name: session.user.name,
        image: session.user.picture,
      },
    });

    // Generate a slug from company name
    const baseSlug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Add a timestamp to ensure uniqueness
    const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    // Create the company with the fields that exist in the schema
    const company = await prisma.company.create({
      data: {
        name: companyName,
        slug: slug,
        website: website || null,
        industry: industry || null,
        employeeCount: employeeCount ? parseInt(employeeCount) : null,
        description: description || null,
        users: {
          create: {
            userId: user.id,
            role: 'OWNER'
          }
        }
      }
    });

    // Return the created company
    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create company',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
} 