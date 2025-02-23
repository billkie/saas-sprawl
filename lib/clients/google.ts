import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';

// Required scopes for Admin SDK API
const SCOPES = [
  // Admin SDK Directory API scopes
  'https://www.googleapis.com/auth/admin.directory.user.readonly',
  'https://www.googleapis.com/auth/admin.directory.domain.readonly',
  // Admin SDK Reports API scopes
  'https://www.googleapis.com/auth/admin.reports.audit.readonly',
  'https://www.googleapis.com/auth/admin.reports.usage.readonly',
  // Optional: Add Chrome Management API scope if needed
  'https://www.googleapis.com/auth/chrome.management.reports.readonly',
];

interface GoogleWorkspaceConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface TokenSet {
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  domain?: string;
}

// Validation schemas for API responses
const appSchema = z.object({
  name: z.string(),
  id: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
  iconUrl: z.string().optional(),
  installCount: z.number().optional(),
  scopes: z.array(z.string()).optional(),
});

const appsListSchema = z.array(appSchema);

export type App = z.infer<typeof appSchema>;
export type AppsList = z.infer<typeof appsListSchema>;

export class GoogleWorkspaceClient {
  private oauth2Client: OAuth2Client;
  private config: GoogleWorkspaceConfig;

  constructor(config: GoogleWorkspaceConfig) {
    this.config = config;
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
  }

  /**
   * Get the authorization URL for OAuth flow
   */
  getAuthorizationUrl(state: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state,
      prompt: 'consent', // Force refresh token generation
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async createToken(code: string): Promise<TokenSet> {
    const { tokens } = await this.oauth2Client.getToken(code);
    const { access_token, refresh_token, expiry_date } = tokens;

    if (!access_token || !refresh_token || !expiry_date) {
      throw new Error('Invalid token response');
    }

    // Get domain information
    this.oauth2Client.setCredentials(tokens);
    const domain = await this.getPrimaryDomain();

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiresAt: new Date(expiry_date),
      domain,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenSet> {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();
    const { access_token, expiry_date } = credentials;

    if (!access_token || !expiry_date) {
      throw new Error('Invalid token refresh response');
    }

    return {
      accessToken: access_token,
      refreshToken: refreshToken, // Keep existing refresh token
      tokenExpiresAt: new Date(expiry_date),
    };
  }

  /**
   * Initialize the client with tokens
   */
  setCredentials(tokens: TokenSet): void {
    this.oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expiry_date: tokens.tokenExpiresAt.getTime(),
    });
  }

  /**
   * Get primary domain for the Google Workspace account
   */
  private async getPrimaryDomain(): Promise<string> {
    const admin = google.admin({ version: 'directory_v1', auth: this.oauth2Client });
    const response = await admin.domains.list({
      customer: 'my_customer',
    });

    const primaryDomain = response.data.domains?.find(domain => domain.isPrimary);
    if (!primaryDomain?.domainName) {
      throw new Error('No primary domain found');
    }

    return primaryDomain.domainName;
  }

  /**
   * Check if user has admin privileges
   */
  async checkAdminPrivileges(): Promise<boolean> {
    try {
      const admin = google.admin({ version: 'directory_v1', auth: this.oauth2Client });
      await admin.users.list({
        customer: 'my_customer',
        maxResults: 1,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get list of third-party apps and their usage using Admin SDK Reports API
   */
  async getThirdPartyApps(): Promise<AppsList> {
    // Initialize Admin SDK Reports API
    const reports = google.admin({ version: 'reports_v1', auth: this.oauth2Client });
    
    // Get OAuth 2.0 tokens report (part of Admin SDK Reports API)
    const tokens = await reports.activities.list({
      userKey: 'all',
      applicationName: 'token',
      maxResults: 1000,
      eventName: 'authorize', // Specifically look for app authorization events
    });

    // Get Chrome apps and extensions report (requires Chrome Management API)
    const apps = await reports.activities.list({
      userKey: 'all',
      applicationName: 'chrome',
      eventName: 'chrome_install',
      maxResults: 1000,
    });

    // Process and combine the results
    const processedApps: App[] = [];
    
    // Process OAuth tokens from Admin SDK Reports
    tokens.data.items?.forEach(item => {
      const events = item.events?.[0]?.parameters;
      if (!events) return;

      const app = {
        name: events.find(p => p.name === 'app_name')?.value || 'Unknown App',
        id: events.find(p => p.name === 'client_id')?.value,
        scopes: events.find(p => p.name === 'scope')?.value?.split(' '),
        discoveryMethod: 'oauth_token',
      };

      processedApps.push(app);
    });

    // Process Chrome apps (requires Chrome Management API)
    apps.data.items?.forEach(item => {
      const events = item.events?.[0]?.parameters;
      if (!events) return;

      const app = {
        name: events.find(p => p.name === 'app_name')?.value || 'Unknown Extension',
        id: events.find(p => p.name === 'app_id')?.value,
        website: events.find(p => p.name === 'app_website')?.value,
        discoveryMethod: 'chrome_extension',
      };

      processedApps.push(app);
    });

    // Validate and return unique apps
    const uniqueApps = Array.from(new Map(processedApps.map(app => [app.id, app])).values());
    return appsListSchema.parse(uniqueApps);
  }
} 