import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { getDashboardData } from '@/lib/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendIndicator } from '@/components/ui/trend-indicator';
import { CreditCard, Package, Bell } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard - Ziruna',
  description: 'Manage your SaaS subscriptions and spend',
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const dashboardData = await getDashboardData(session.user.id);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Subscriptions
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">
                {dashboardData.activeSubscriptions}
              </div>
              <TrendIndicator
                value={dashboardData.subscriptionTrend}
                reversed={false}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Active SaaS subscriptions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Spend
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardData.totalSpend, dashboardData.currency)}
              </div>
              <TrendIndicator
                value={dashboardData.spendTrend}
                reversed={true}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Total monthly subscription costs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Renewals
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.upcomingRenewals}
            </div>
            <p className="text-xs text-muted-foreground">
              Renewals in the next 30 days
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 