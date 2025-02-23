import QuickBooks from 'node-quickbooks';
import { OAuthClient } from 'intuit-oauth';
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

export type Transaction = z.infer<typeof transactionSchema>;
export type QueryResponse = z.infer<typeof queryResponseSchema>;

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

export class QuickBooksClient {
  private oauthClient: OAuthClient;
  private qboClient: QuickBooks | null = null;
  private config: QuickBooksConfig;

  constructor(config: QuickBooksConfig) {
    this.config = config;
    this.oauthClient = new OAuthClient({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      environment: config.environment,
      redirectUri: config.redirectUri,
    });
  }

  /**
   * Get the authorization URL for OAuth flow
   */
  getAuthorizationUrl(state: string): string {
    return this.oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting],
      state,
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async createToken(url: string): Promise<TokenSet> {
    const response = await this.oauthClient.createToken(url);
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
    const response = await this.oauthClient.refreshUsingToken(refreshToken);
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
    );
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
  async getCompanyInfo(): Promise<any> {
    if (!this.qboClient) {
      throw new Error('QuickBooks client not initialized');
    }

    return new Promise((resolve, reject) => {
      this.qboClient!.getCompanyInfo(null, (err, companyInfo) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(companyInfo);
      });
    });
  }
} 