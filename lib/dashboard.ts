import prisma from '@/lib/prisma';

export interface DashboardData {
  totalSpend: number;
  activeSubscriptions: number;
  upcomingRenewals: number;
  spendTrend: number;
  subscriptionTrend: number;
  currency: string;
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  // Get user's company
  const userWithCompany = await prisma.user.findFirst({
    where: { id: userId },
    include: {
      companies: {
        include: {
          company: {
            include: {
              subscriptions: {
                where: {
                  status: 'ACTIVE',
                },
              },
            },
          },
        },
      },
    },
  });

  const company = userWithCompany?.companies[0]?.company;
  if (!company) {
    throw new Error('No company found');
  }

  // Get active subscriptions
  const activeSubscriptions = await prisma.subscription.count({
    where: {
      companyId: company.id,
      status: 'ACTIVE',
    },
  });

  // Get last month's subscription count for trend
  const lastMonthSubscriptions = await prisma.subscription.count({
    where: {
      companyId: company.id,
      status: 'ACTIVE',
      createdAt: {
        lt: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      },
    },
  });

  // Calculate subscription trend
  const subscriptionTrend = lastMonthSubscriptions > 0
    ? ((activeSubscriptions - lastMonthSubscriptions) / lastMonthSubscriptions) * 100
    : 0;

  // Get current month's total spend
  const currentMonthSpend = await prisma.subscription.aggregate({
    where: {
      companyId: company.id,
      status: 'ACTIVE',
    },
    _sum: {
      monthlyAmount: true,
    },
  });

  // Get last month's total spend for trend
  const lastMonthSpend = await prisma.subscription.aggregate({
    where: {
      companyId: company.id,
      status: 'ACTIVE',
      createdAt: {
        lt: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      },
    },
    _sum: {
      monthlyAmount: true,
    },
  });

  // Calculate spend trend
  const currentTotal = currentMonthSpend._sum.monthlyAmount || 0;
  const lastTotal = lastMonthSpend._sum.monthlyAmount || 0;
  const spendTrend = lastTotal > 0
    ? ((currentTotal - lastTotal) / lastTotal) * 100
    : 0;

  // Get upcoming renewals (next 30 days)
  const upcomingRenewals = await prisma.subscription.count({
    where: {
      companyId: company.id,
      status: 'ACTIVE',
      nextChargeDate: {
        lte: new Date(new Date().setDate(new Date().getDate() + 30)),
        gte: new Date(),
      },
    },
  });

  return {
    totalSpend: currentTotal,
    activeSubscriptions,
    upcomingRenewals,
    spendTrend,
    subscriptionTrend,
    currency: 'USD', // Default currency, could be made dynamic based on company settings
  };
} 