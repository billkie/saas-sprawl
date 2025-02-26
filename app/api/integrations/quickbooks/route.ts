import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';
import prisma from '@/lib/prisma';
import { QuickBooksClient, Transaction } from '@/lib/clients/quickbooks';
import { analyzeTransactions, PaymentFrequency } from '@/lib/utils/transaction-analysis';
import { BillingType } from '@prisma/client';

const QUICKBOOKS_CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID!;
const QUICKBOOKS_CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET!;
const QUICKBOOKS_REDIRECT_URI = `${process.env.AUTH0_BASE_URL}/api/integrations/quickbooks/callback`;
const QUICKBOOKS_ENVIRONMENT = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';

// Minimum confidence score to consider a vendor as a SaaS provider
const MIN_CONFIDENCE_SCORE = 0.5;

// Initialize QuickBooks client
const quickbooksClient = new QuickBooksClient({
  clientId: QUICKBOOKS_CLIENT_ID,
  clientSecret: QUICKBOOKS_CLIENT_SECRET,
  environment: QUICKBOOKS_ENVIRONMENT as 'sandbox' | 'production',
  redirectUri: QUICKBOOKS_REDIRECT_URI,
});

// Helper function to calculate next charge date
function calculateNextChargeDate(
  lastTransactionDate: Date,
  frequency: PaymentFrequency
): Date {
  const nextDate = new Date(lastTransactionDate);
  switch (frequency) {
    case PaymentFrequency.MONTHLY:
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case PaymentFrequency.QUARTERLY:
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case PaymentFrequency.ANNUAL:
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      nextDate.setMonth(nextDate.getMonth() + 1); // Default to monthly
  }
  return nextDate;
}

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
  // Analyze transactions to identify recurring vendors
  const vendorAnalyses = analyzeTransactions(transactions);
  let processedCount = 0;

  for (const analysis of vendorAnalyses) {
    // Skip vendors with low confidence scores
    if (analysis.confidence < MIN_CONFIDENCE_SCORE) continue;

    // Calculate monthly and annual amounts
    const monthlyAmount = analysis.paymentFrequency === PaymentFrequency.MONTHLY 
      ? analysis.averageAmount
      : analysis.paymentFrequency === PaymentFrequency.QUARTERLY
      ? analysis.averageAmount / 3
      : analysis.paymentFrequency === PaymentFrequency.ANNUAL
      ? analysis.averageAmount / 12
      : analysis.averageAmount;

    const annualAmount = monthlyAmount * 12;

    // Check if this vendor is already tracked
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        companyId,
        quickbooksVendorId: analysis.vendorId,
      },
    });

    const lastTransaction = analysis.transactions[analysis.transactions.length - 1];
    const nextChargeDate = calculateNextChargeDate(
      analysis.lastTransactionDate,
      analysis.paymentFrequency
    );

    const subscriptionData = {
      vendorName: analysis.vendorName,
      monthlyAmount,
      annualAmount,
      lastChargeAmount: lastTransaction.TotalAmt,
      paymentFrequency: analysis.paymentFrequency,
      lastTransactionDate: analysis.lastTransactionDate,
      quickbooksLastSync: new Date(),
      confidenceScore: analysis.confidence,
      nextChargeDate,
      // Default to notifying 14 days before next charge
      notifyBefore: 14,
      // Default to OTHER since we can't reliably detect payment type from QuickBooks
      billingType: BillingType.OTHER,
    };

    if (existingSubscription) {
      // Update existing subscription
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          ...subscriptionData,
          // Don't override these fields if they were manually set
          description: undefined,
          website: undefined,
          category: undefined,
          tags: undefined,
          notes: undefined,
        },
      });
    } else {
      // Create new subscription
      await prisma.subscription.create({
        data: {
          companyId,
          planId: analysis.vendorName,
          status: 'ACTIVE',
          quickbooksVendorId: analysis.vendorId,
          ...subscriptionData,
          // Initialize empty arrays/optional fields
          tags: [],
        },
      });
    }

    processedCount++;
  }

  return processedCount;
}

// POST /api/integrations/quickbooks - Start OAuth flow
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authUri = await quickbooksClient.getAuthorizationUrl(session.user.email);
    return NextResponse.json({ authUri });
  } catch (error) {
    console.error('Error initiating QuickBooks OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate QuickBooks integration' },
      { status: 500 }
    );
  }
}

// GET /api/integrations/quickbooks/sync - Manual sync
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
    const processedCount = await processTransactions(transactions, company.id);

    // Update last sync time
    await prisma.quickBooksIntegration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      message: `Successfully processed ${processedCount} recurring vendors`,
      totalTransactions: transactions.length,
    });
  } catch (error) {
    console.error('Error syncing with QuickBooks:', error);
    return NextResponse.json(
      { error: 'Failed to sync with QuickBooks' },
      { status: 500 }
    );
  }
} 