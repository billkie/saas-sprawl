import prisma from '@/lib/prisma';
import { QuickBooksClient } from '@/lib/clients/quickbooks';
import { processTransactions } from '@/lib/utils/transaction-analysis';

const QUICKBOOKS_CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID!;
const QUICKBOOKS_CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET!;
const QUICKBOOKS_REDIRECT_URI = `${process.env.AUTH0_BASE_URL}/api/integrations/quickbooks/callback`;
const QUICKBOOKS_ENVIRONMENT = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';

export async function syncQuickBooks() {
  const integrations = await prisma.quickBooksIntegration.findMany({
    include: {
      company: true,
    },
  });

  const results = {
    success: 0,
    failed: 0,
    total: integrations.length,
    errors: [] as string[],
  };

  for (const integration of integrations) {
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

      // Process transactions
      const processedCount = await processTransactions(transactions, integration.companyId);

      // Update last sync time
      await prisma.quickBooksIntegration.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date() },
      });

      console.log(`Successfully synced ${processedCount} transactions for company ${integration.company.name}`);
      results.success++;
    } catch (error) {
      console.error(`Error syncing QuickBooks for company ${integration.company.name}:`, error);
      results.failed++;
      results.errors.push(`${integration.company.name}: ${error.message}`);
    }
  }

  return results;
} 