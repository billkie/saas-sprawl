'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { SubscriptionDetails } from '@/lib/billing';
import { createCheckoutSession, createBillingPortalSession } from '@/lib/billing';

interface BillingSettingsProps {
  subscriptionDetails: SubscriptionDetails;
}

const PLAN_PRICES = {
  pro: 'price_pro',
  enterprise: 'price_enterprise',
} as const;

export function BillingSettings({ subscriptionDetails }: BillingSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const usagePercentage = Math.min(
    (subscriptionDetails.usage.trackedSubscriptions / subscriptionDetails.usage.allowedSubscriptions) * 100,
    100
  );

  async function handleUpgrade(plan: keyof typeof PLAN_PRICES) {
    try {
      setIsLoading(true);
      const checkoutUrl = await createCheckoutSession(PLAN_PRICES[plan], '');
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleManageSubscription() {
    try {
      setIsLoading(true);
      const portalUrl = await createBillingPortalSession('');
      window.location.href = portalUrl;
    } catch (error) {
      console.error('Failed to create portal session:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your subscription and usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium capitalize">{subscriptionDetails.plan}</span>
            <Badge variant={subscriptionDetails.status === 'ACTIVE' ? 'default' : 'destructive'}>
              {subscriptionDetails.status}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Tracked Subscriptions</span>
              <span>
                {subscriptionDetails.usage.trackedSubscriptions} /{' '}
                {subscriptionDetails.usage.allowedSubscriptions === Infinity
                  ? 'Unlimited'
                  : subscriptionDetails.usage.allowedSubscriptions}
              </span>
            </div>
            <Progress value={usagePercentage} />
          </div>
          {subscriptionDetails.currentPeriodEnd && (
            <div className="text-sm text-muted-foreground">
              Current period ends on{' '}
              {new Date(subscriptionDetails.currentPeriodEnd).toLocaleDateString()}
            </div>
          )}
        </CardContent>
        <CardFooter>
          {subscriptionDetails.status === 'ACTIVE' ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleManageSubscription}
              disabled={isLoading}
            >
              Manage Subscription
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={() => handleUpgrade('pro')}
              disabled={isLoading}
            >
              Upgrade to Pro
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>Your plan features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {Object.entries(subscriptionDetails.features).map(([feature, enabled]) => (
              <div key={feature} className="flex items-center gap-2">
                {enabled ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-300" />
                )}
                <span className="capitalize">{feature.replace(/([A-Z])/g, ' $1')}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 