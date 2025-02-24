import prisma from '@/lib/prisma';
import { QuickBooksClient } from '@/lib/clients/quickbooks';
import { analyzeTransactions } from '@/lib/utils/transaction-analysis';
import { sendSyncSuccessEmail, sendSyncFailureEmail } from '@/lib/email';

const QUICKBOOKS_CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID!;
const QUICKBOOKS_CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET!;
const QUICKBOOKS_REDIRECT_URI = `${process.env.AUTH0_BASE_URL}/api/integrations/quickbooks/callback`;
const QUICKBOOKS_ENVIRONMENT = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';

export async function syncQuickBooks() {
  const integrations = await prisma.quickBooksIntegration.findMany({
    include: {
      company: {
        include: {
          users: {
            where: {
              role: {
                in: ['OWNER', 'ADMIN'],
              },
            },
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  const results = {
    success: 0,
    failed: 0,
    total: integrations.length,
    errors: [] as string[],
  };

  for (const integration of integrations) {
    const syncResults = {
      newItems: 0,
      updatedItems: 0,
      totalProcessed: 0,
    };

    try {
      const quickbooksClient = new QuickBooksClient({
        clientId: QUICKBOOKS_CLIENT_ID,
        clientSecret: QUICKBOOKS_CLIENT_SECRET,
        environment: QUICKBOOKS_ENVIRONMENT as 'sandbox' | 'production',
        redirectUri: QUICKBOOKS_REDIRECT_URI,
      });

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

        quickbooksClient.initializeClient(tokens);
      } else {
        quickbooksClient.initializeClient({
          accessToken: integration.accessToken,
          refreshToken: integration.refreshToken,
          tokenExpiresAt: integration.tokenExpiresAt,
          realmId: integration.realmId,
        });
      }

      // Get transactions from the last sync date or last 30 days
      const startDate = integration.lastSyncAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const transactions = await quickbooksClient.queryTransactions(startDate);

      // Get existing subscriptions for comparison
      const existingSubscriptions = await prisma.subscription.findMany({
        where: {
          companyId: integration.companyId,
          quickbooksVendorId: { not: null },
        },
      });

      // Process transactions using analyzeTransactions
      const analyses = analyzeTransactions(transactions);
      const processedCount = analyses.length;
      
      // Get updated subscriptions to calculate changes
      const updatedSubscriptions = await prisma.subscription.findMany({
        where: {
          companyId: integration.companyId,
          quickbooksVendorId: { not: null },
        },
      });

      syncResults.newItems = updatedSubscriptions.length - existingSubscriptions.length;
      syncResults.updatedItems = processedCount - syncResults.newItems;
      syncResults.totalProcessed = processedCount;

      // Update last sync time
      await prisma.quickBooksIntegration.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date() },
      });

      console.log(`Successfully synced ${processedCount} transactions for company ${integration.company.name}`);
      results.success++;

      // Send success notification to company owners and admins
      for (const companyUser of integration.company.users) {
        await sendSyncSuccessEmail(
          companyUser.user.email,
          {
            userName: companyUser.user.name || 'there',
            companyName: integration.company.name,
            integrationType: 'QuickBooks',
            syncResults,
            syncDate: new Date().toISOString(),
          }
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error syncing QuickBooks for company ${integration.company.name}:`, error);
      results.failed++;
      results.errors.push(`${integration.company.name}: ${errorMessage}`);

      // Send failure notification to company owners and admins
      for (const companyUser of integration.company.users) {
        await sendSyncFailureEmail(
          companyUser.user.email,
          {
            userName: companyUser.user.name || 'there',
            companyName: integration.company.name,
            integrationType: 'QuickBooks',
            error: 'Failed to sync with QuickBooks',
            errorDetails: errorMessage,
            syncDate: new Date().toISOString(),
            nextRetry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Next day
          }
        );
      }
    }
  }

  return results;
} 