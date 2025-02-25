import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import prisma from '@/lib/prisma';
import { QuickBooksClient } from '@/lib/clients/quickbooks';

const QUICKBOOKS_CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID!;
const QUICKBOOKS_CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET!;
const QUICKBOOKS_REDIRECT_URI = `${process.env.AUTH0_BASE_URL}/api/integrations/quickbooks/callback`;
const QUICKBOOKS_ENVIRONMENT = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';

// Initialize QuickBooks client
const quickbooksClient = new QuickBooksClient({
  clientId: QUICKBOOKS_CLIENT_ID,
  clientSecret: QUICKBOOKS_CLIENT_SECRET,
  environment: QUICKBOOKS_ENVIRONMENT as 'sandbox' | 'production',
  redirectUri: QUICKBOOKS_REDIRECT_URI,
});

// Helper function to get user's company
async function getUserCompany(userEmail: string) {
  const userWithCompany = await prisma.user.findFirst({
    where: { email: userEmail },
    include: {
      companies: {
        include: {
          company: true,
        },
      },
    },
  });

  return userWithCompany?.companies[0]?.company;
}

// GET /api/integrations/quickbooks/callback - OAuth callback handler
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const company = await getUserCompany(session.user.email);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get tokens from the callback URL
    const tokens = await quickbooksClient.createToken(request.url);

    // Store the tokens in the database
    await prisma.quickBooksIntegration.upsert({
      where: { companyId: company.id },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.tokenExpiresAt,
        realmId: tokens.realmId,
      },
      create: {
        companyId: company.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.tokenExpiresAt,
        realmId: tokens.realmId,
      },
    });

    // Initialize the client and get company info
    quickbooksClient.initializeClient(tokens);
    const companyInfo = await quickbooksClient.getCompanyInfo();

    // Redirect to the dashboard with success message
    const redirectUrl = new URL('/dashboard', request.url);
    redirectUrl.searchParams.set('integration', 'quickbooks');
    redirectUrl.searchParams.set('status', 'success');
    redirectUrl.searchParams.set('message', `Successfully connected to ${companyInfo.CompanyName}`);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Error handling QuickBooks callback:', error);
    
    // Redirect to dashboard with error message
    const redirectUrl = new URL('/dashboard', request.url);
    redirectUrl.searchParams.set('integration', 'quickbooks');
    redirectUrl.searchParams.set('status', 'error');
    redirectUrl.searchParams.set('message', 'Failed to connect QuickBooks');

    return NextResponse.redirect(redirectUrl.toString());
  }
} 