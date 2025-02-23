import { NextResponse } from 'next/server';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { OAuthClient } from 'intuit-oauth';
import QuickBooks from 'node-quickbooks';
import prisma from '@/lib/prisma';

const QUICKBOOKS_CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID!;
const QUICKBOOKS_CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET!;
const QUICKBOOKS_REDIRECT_URI = `${process.env.AUTH0_BASE_URL}/api/integrations/quickbooks/callback`;
const QUICKBOOKS_ENVIRONMENT = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';

const oauthClient = new OAuthClient({
  clientId: QUICKBOOKS_CLIENT_ID,
  clientSecret: QUICKBOOKS_CLIENT_SECRET,
  environment: QUICKBOOKS_ENVIRONMENT,
  redirectUri: QUICKBOOKS_REDIRECT_URI,
});

// POST /api/integrations/quickbooks - Start OAuth flow
export const POST = withApiAuthRequired(async (req) => {
  try {
    const session = await getSession(req);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authUri = oauthClient.authorizeUri({
      scope: [
        OAuthClient.scopes.Accounting,  // For company and transaction data
      ],
      state: session.user.email,
    });

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
async function processTransactions(qbo: QuickBooks, companyId: string) {
  const query = "SELECT * FROM Purchase WHERE MetaData.LastUpdatedTime > '2024-01-01'";
  
  return new Promise((resolve, reject) => {
    qbo.query(query, async (err, queryResponse) => {
      if (err) {
        reject(err);
        return;
      }

      const transactions = queryResponse.QueryResponse.Purchase || [];
      
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

      resolve(transactions.length);
    });
  });
}

// GET /api/integrations/quickbooks/sync - Manual sync
export const GET = withApiAuthRequired(async (req) => {
  try {
    const session = await getSession(req);
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
      const authResponse = await oauthClient.refreshUsingToken(integration.refreshToken);
      
      await prisma.quickBooksIntegration.update({
        where: { id: integration.id },
        data: {
          accessToken: authResponse.token.access_token,
          refreshToken: authResponse.token.refresh_token,
          tokenExpiresAt: new Date(Date.now() + authResponse.token.expires_in * 1000),
        },
      });
    }

    // Initialize QuickBooks client
    const qbo = new QuickBooks(
      QUICKBOOKS_CLIENT_ID,
      QUICKBOOKS_CLIENT_SECRET,
      integration.accessToken,
      false, // no token secret needed
      integration.realmId,
      QUICKBOOKS_ENVIRONMENT === 'production',
      true, // debug
      null, // minor version
      '2.0', // oauth version
      integration.refreshToken
    );

    // Process transactions
    const transactionCount = await processTransactions(qbo, company.id);

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