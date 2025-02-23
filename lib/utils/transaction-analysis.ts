import { Transaction } from '@/lib/clients/quickbooks';

export interface VendorAnalysis {
  vendorId: string;
  vendorName: string;
  transactions: Transaction[];
  averageAmount: number;
  paymentFrequency: PaymentFrequency;
  confidence: number;
  lastTransactionDate: Date;
}

export enum PaymentFrequency {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
  UNKNOWN = 'UNKNOWN',
}

interface TransactionGroup {
  [vendorId: string]: Transaction[];
}

/**
 * Group transactions by vendor
 */
function groupTransactionsByVendor(transactions: Transaction[]): TransactionGroup {
  return transactions.reduce((groups, transaction) => {
    if (!transaction.AccountRef?.value) return groups;
    
    const vendorId = transaction.AccountRef.value.toString();
    if (!groups[vendorId]) {
      groups[vendorId] = [];
    }
    groups[vendorId].push(transaction);
    return groups;
  }, {} as TransactionGroup);
}

/**
 * Calculate the average time between transactions in days
 */
function calculateAverageInterval(transactions: Transaction[]): number {
  if (transactions.length < 2) return 0;

  const dates = transactions
    .map(t => new Date(t.TxnDate))
    .sort((a, b) => a.getTime() - b.getTime());

  let totalDays = 0;
  for (let i = 1; i < dates.length; i++) {
    const diff = dates[i].getTime() - dates[i - 1].getTime();
    totalDays += diff / (1000 * 60 * 60 * 24);
  }

  return totalDays / (dates.length - 1);
}

/**
 * Calculate the standard deviation of transaction amounts
 */
function calculateAmountStdDev(transactions: Transaction[]): number {
  const amounts = transactions.map(t => t.TotalAmt);
  const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
  const squaredDiffs = amounts.map(amt => Math.pow(amt - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / amounts.length;
  return Math.sqrt(variance);
}

/**
 * Determine payment frequency based on average interval
 */
function determinePaymentFrequency(avgInterval: number): PaymentFrequency {
  if (avgInterval === 0) return PaymentFrequency.UNKNOWN;
  
  // Allow for some variance in payment dates
  if (avgInterval >= 25 && avgInterval <= 35) return PaymentFrequency.MONTHLY;
  if (avgInterval >= 85 && avgInterval <= 95) return PaymentFrequency.QUARTERLY;
  if (avgInterval >= 350 && avgInterval <= 380) return PaymentFrequency.ANNUAL;
  
  return PaymentFrequency.UNKNOWN;
}

/**
 * Calculate confidence score (0-1) that this is a recurring SaaS vendor
 */
function calculateConfidence(
  transactions: Transaction[],
  avgInterval: number,
  amountStdDev: number,
  frequency: PaymentFrequency
): number {
  let score = 0;

  // More transactions = higher confidence
  score += Math.min(transactions.length / 10, 0.3);

  // Regular intervals = higher confidence
  const hasRegularFrequency = frequency !== PaymentFrequency.UNKNOWN;
  score += hasRegularFrequency ? 0.3 : 0;

  // Consistent amounts = higher confidence
  const avgAmount = transactions.reduce((sum, t) => sum + t.TotalAmt, 0) / transactions.length;
  const amountVariance = amountStdDev / avgAmount;
  score += (1 - Math.min(amountVariance, 1)) * 0.2;

  // Recent activity = higher confidence
  const mostRecent = new Date(Math.max(...transactions.map(t => new Date(t.TxnDate).getTime())));
  const daysSinceLastTransaction = (Date.now() - mostRecent.getTime()) / (1000 * 60 * 60 * 24);
  score += Math.max(0, 0.2 - (daysSinceLastTransaction / 365) * 0.2);

  return Math.min(score, 1);
}

/**
 * Analyze transactions to identify recurring SaaS vendors
 */
export function analyzeTransactions(transactions: Transaction[]): VendorAnalysis[] {
  const groups = groupTransactionsByVendor(transactions);
  
  return Object.entries(groups).map(([vendorId, vendorTransactions]) => {
    const avgInterval = calculateAverageInterval(vendorTransactions);
    const amountStdDev = calculateAmountStdDev(vendorTransactions);
    const frequency = determinePaymentFrequency(avgInterval);
    
    const avgAmount = vendorTransactions.reduce((sum, t) => sum + t.TotalAmt, 0) / 
      vendorTransactions.length;
    
    const lastTransaction = vendorTransactions
      .sort((a, b) => new Date(b.TxnDate).getTime() - new Date(a.TxnDate).getTime())[0];
    
    return {
      vendorId,
      vendorName: lastTransaction.AccountRef?.name || 'Unknown Vendor',
      transactions: vendorTransactions,
      averageAmount: avgAmount,
      paymentFrequency: frequency,
      confidence: calculateConfidence(vendorTransactions, avgInterval, amountStdDev, frequency),
      lastTransactionDate: new Date(lastTransaction.TxnDate),
    };
  });
} 