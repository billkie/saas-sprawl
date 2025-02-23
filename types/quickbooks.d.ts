declare module 'intuit-oauth' {
  export class OAuthClient {
    constructor(config: {
      clientId: string;
      clientSecret: string;
      environment: string;
      redirectUri: string;
    });

    static scopes: {
      Accounting: string;
      OpenId: string;
      Profile: string;
      Email: string;
    };

    authorizeUri(options: {
      scope: string[];
      state: string;
    }): string;

    createToken(url: string): Promise<{
      token: {
        access_token: string;
        refresh_token: string;
        expires_in: number;
      };
    }>;

    refreshUsingToken(refreshToken: string): Promise<{
      token: {
        access_token: string;
        refresh_token: string;
        expires_in: number;
      };
    }>;
  }
}

declare module 'node-quickbooks' {
  interface QueryResponse {
    QueryResponse: {
      Purchase?: Array<{
        TxnDate: string;
        TotalAmt: number;
        AccountRef: {
          value: string | number;
          name: string;
        };
      }>;
    };
  }

  class QuickBooks {
    constructor(
      clientId: string,
      clientSecret: string,
      accessToken: string,
      useOAuth2: boolean,
      realmId: string,
      useProd: boolean,
      debug?: boolean,
      minorversion?: string | null,
      oauthversion?: string,
      refreshToken?: string
    );

    query(
      query: string,
      callback: (err: Error | null, response: QueryResponse) => void
    ): void;
  }

  export = QuickBooks;
} 