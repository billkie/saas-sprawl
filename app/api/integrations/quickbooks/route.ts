import { NextResponse } from 'next/server';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import prisma from '@/lib/prisma';
import { QuickBooksClient, Transaction } from '@/lib/clients/quickbooks';

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

// POST /api/integrations/quickbooks - Start OAuth flow
export const POST = withApiAuthRequired(async (request: Request) => {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authUri = quickbooksClient.getAuthorizationUrl(session.user.email);
    return NextResponse.json({ authUri });
  } catch (error) {
    console.error('Error initiating QuickBooks OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate QuickBooks integration' },
      { status: 500 }
    );
  }
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

// Helper function to process transactions
async function processTransactions(transactions: Transaction[], companyId: string) {
  for (const transaction of transactions) {
    const vendor = transaction.AccountRef;
    if (!vendor) continue;

    // Check if this is a recurring payment
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        companyId,
        quickbooksVendorId: vendor.value.toString(),
      },
    });

    if (existingSubscription) {
      // Update existing subscription
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          lastTransactionDate: new Date(transaction.TxnDate),
          lastChargeAmount: transaction.TotalAmt,
          quickbooksLastSync: new Date(),
        },
      });
    } else {
      // Create new subscription if it seems recurring
      await prisma.subscription.create({
        data: {
          companyId,
          planId: vendor.name,
          status: 'ACTIVE',
          quickbooksVendorId: vendor.value.toString(),
          lastTransactionDate: new Date(transaction.TxnDate),
          lastChargeAmount: transaction.TotalAmt,
          quickbooksLastSync: new Date(),
          paymentFrequency: 'UNKNOWN',
        },
      });
    }
  }

  return transactions.length;
}

// GET /api/integrations/quickbooks/sync - Manual sync
export const GET = withApiAuthRequired(async (request: Request) => {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const company = await getUserCompany(session.user.email);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const integration = await prisma.quickBooksIntegration.findUnique({
      where: { companyId: company.id },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'QuickBooks not connected' },
        { status: 404 }
      );
    }

    // Check if token is expired and refresh if needed
    if (new Date() >= integration.tokenExpiresAt) {
      const tokens = await quickbooksClient.refreshToken(integration.refreshToken);
      
      await prisma.quickBooksIntegration.update({
        where: { id: integration.id },
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: tokens.tokenExpiresAt,
        },
      });

      // Update the tokens in the client
      quickbooksClient.initializeClient(tokens);
    } else {
      // Initialize client with existing tokens
      quickbooksClient.initializeClient({
        accessToken: integration.accessToken,
        refreshToken: integration.refreshToken,
        tokenExpiresAt: integration.tokenExpiresAt,
        realmId: integration.realmId,
      });
    }

    // Get transactions from the last 30 days or last sync date
    const startDate = integration.lastSyncAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const transactions = await quickbooksClient.queryTransactions(startDate);

    // Process transactions
    const transactionCount = await processTransactions(transactions, company.id);

    // Update last sync time
    await prisma.quickBooksIntegration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      message: `Successfully synced ${transactionCount} transactions`,
    });
  } catch (error) {
    console.error('Error syncing with QuickBooks:', error);
    return NextResponse.json(
      { error: 'Failed to sync with QuickBooks' },
      { status: 500 }
    );
  }
}); 