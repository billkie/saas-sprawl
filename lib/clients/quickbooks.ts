import QuickBooks from 'node-quickbooks';
import { z } from 'zod';

// Validation schemas for QuickBooks data
const transactionSchema = z.object({
  TxnDate: z.string(),
  TotalAmt: z.number(),
  AccountRef: z.object({
    value: z.union([z.string(), z.number()]),
    name: z.string()
  }).optional(),
});

const queryResponseSchema = z.object({
  QueryResponse: z.object({
    Purchase: z.array(transactionSchema).optional(),
    maxResults: z.number().optional()
  })
});

const companyInfoSchema = z.object({
  CompanyName: z.string(),
  LegalName: z.string().optional(),
  CompanyAddr: z.object({
    Line1: z.string().optional(),
    City: z.string().optional(),
    Country: z.string().optional(),
    CountrySubDivisionCode: z.string().optional(),
    PostalCode: z.string().optional()
  }).optional(),
  Email: z.object({
    Address: z.string().optional()
  }).optional(),
  WebAddr: z.object({
    URI: z.string().optional()
  }).optional()
});

export type Transaction = z.infer<typeof transactionSchema>;
export type QueryResponse = z.infer<typeof queryResponseSchema>;
export type CompanyInfo = z.infer<typeof companyInfoSchema>;

interface QuickBooksConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
  redirectUri: string;
}

interface TokenSet {
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  realmId: string;
}

interface ExtendedQuickBooks extends QuickBooks {
  realmId: string;
  getCompanyInfo: (params: unknown, callback: (err: Error | null, companyInfo: unknown) => void) => void;
}

// Function to safely create an OAuthClient instance
async function createOAuthClient(config: QuickBooksConfig): Promise<any> {
  try {
    // Dynamically import the OAuthClient to avoid build-time issues
    const { OAuthClient } = await import('intuit-oauth');
    return new OAuthClient({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      environment: config.environment,
      redirectUri: config.redirectUri,
    });
  } catch (error) {
    console.error('Error creating OAuthClient:', error);
    // Return a minimal mock implementation for build time
    return {
      authorizeUri: (options: any) => {
        return `https://appcenter.intuit.com/connect/oauth2?client_id=${config.clientId}&redirect_uri=${config.redirectUri}&scope=com.intuit.quickbooks.accounting&response_type=code&state=${options.state}`;
      },
      createToken: async () => ({ token: { access_token: '', refresh_token: '', expires_in: 3600 } }),
      refreshUsingToken: async () => ({ token: { access_token: '', refresh_token: '', expires_in: 3600 } }),
    };
  }
}

export class QuickBooksClient {
  private oauthClient: any;
  private qboClient: ExtendedQuickBooks | null = null;
  private config: QuickBooksConfig;
  private oauthClientInitialized: boolean = false;

  constructor(config: QuickBooksConfig) {
    this.config = config;
    // Initialize with placeholder - we'll create the real client lazily when needed
    this.oauthClient = null;
  }

  // Initialize the OAuthClient when needed
  private async ensureOAuthClient() {
    if (!this.oauthClientInitialized) {
      this.oauthClient = await createOAuthClient(this.config);
      this.oauthClientInitialized = true;
    }
    return this.oauthClient;
  }

  /**
   * Get the authorization URL for OAuth flow
   */
  async getAuthorizationUrl(state: string): Promise<string> {
    const client = await this.ensureOAuthClient();
    // Create a scopes array with the Accounting scope
    const scopes = ['com.intuit.quickbooks.accounting'];
    
    return client.authorizeUri({
      scope: scopes,
      state,
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async createToken(url: string): Promise<TokenSet> {
    const client = await this.ensureOAuthClient();
    const response = await client.createToken(url);
    const { access_token, refresh_token, expires_in } = response.token;
    const realmId = new URL(url).searchParams.get('realmId');

    if (!realmId) {
      throw new Error('No realmId found in callback URL');
    }

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
      realmId,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenSet> {
    const client = await this.ensureOAuthClient();
    const response = await client.refreshUsingToken(refreshToken);
    const { access_token, refresh_token, expires_in } = response.token;

    if (!this.qboClient?.realmId) {
      throw new Error('No realmId available');
    }

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
      realmId: this.qboClient.realmId,
    };
  }

  /**
   * Initialize the QuickBooks SDK client
   */
  initializeClient(tokens: TokenSet): void {
    this.qboClient = new QuickBooks(
      this.config.clientId,
      this.config.clientSecret,
      tokens.accessToken,
      false, // no token secret needed
      tokens.realmId,
      this.config.environment === 'production',
      true, // debug
      null, // minor version
      '2.0', // oauth version
      tokens.refreshToken
    ) as ExtendedQuickBooks;
  }

  /**
   * Query transactions with validation
   */
  async queryTransactions(startDate: Date): Promise<Transaction[]> {
    if (!this.qboClient) {
      throw new Error('QuickBooks client not initialized');
    }

    const formattedDate = startDate.toISOString().split('T')[0];
    const query = `SELECT * FROM Purchase WHERE MetaData.LastUpdatedTime >= '${formattedDate}'`;

    return new Promise((resolve, reject) => {
      this.qboClient!.query(query, (err, response) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          const validatedResponse = queryResponseSchema.parse(response);
          return resolve(validatedResponse.QueryResponse.Purchase || []);
        } catch (error) {
          reject(new Error('Invalid response format from QuickBooks API'));
        }
      });
    });
  }

  /**
   * Get company info
   */
  async getCompanyInfo(): Promise<CompanyInfo> {
    if (!this.qboClient) {
      throw new Error('QuickBooks client not initialized');
    }

    return new Promise((resolve, reject) => {
      this.qboClient!.getCompanyInfo(null, (err, companyInfo) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          const validatedInfo = companyInfoSchema.parse(companyInfo);
          resolve(validatedInfo);
        } catch (error) {
          reject(new Error('Invalid company info format from QuickBooks API'));
        }
      });
    });
  }
} 