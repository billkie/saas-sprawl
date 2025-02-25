import { NextRequest } from 'next/server';

declare module 'next/server' {
  export interface RouteHandlerContext {
    params: Promise<Record<string, string | string[]>>;
  }
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      DATABASE_URL: string;
      AUTH0_SECRET: string;
      AUTH0_BASE_URL: string;
      AUTH0_ISSUER_BASE_URL: string;
      AUTH0_CLIENT_ID: string;
      AUTH0_CLIENT_SECRET: string;
      QUICKBOOKS_CLIENT_ID: string;
      QUICKBOOKS_CLIENT_SECRET: string;
      QUICKBOOKS_ENVIRONMENT: 'sandbox' | 'production';
      QUICKBOOKS_REDIRECT_URI: string;
      STRIPE_SECRET_KEY: string;
      STRIPE_WEBHOOK_SECRET: string;
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
      NEXT_PUBLIC_APP_URL: string;
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      REDIS_URL: string;
      STRIPE_TEST_SECRET_KEY: string;
      STRIPE_TEST_PUBLISHABLE_KEY: string;
      STRIPE_TEST_WEBHOOK_SECRET: string;
      STRIPE_LIVE_SECRET_KEY: string;
      STRIPE_LIVE_PUBLISHABLE_KEY: string;
      STRIPE_LIVE_WEBHOOK_SECRET: string;
      STRIPE_USE_LIVE_MODE: string;
      SENDGRID_API_KEY: string;
      SENDGRID_FROM_EMAIL: string;
      SENDGRID_FROM_NAME: string;
    }
  }
} 