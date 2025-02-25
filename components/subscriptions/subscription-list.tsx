'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, AlertCircle } from 'lucide-react';
import { type SubscriptionWithDetails } from '@/lib/subscriptions';

interface SubscriptionListProps {
  subscriptions: SubscriptionWithDetails[];
}

export function SubscriptionList({ subscriptions }: SubscriptionListProps) {
  const [sortColumn, setSortColumn] = useState<keyof SubscriptionWithDetails>('nextChargeDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const sortedSubscriptions = [...subscriptions].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (aValue === null) return 1;
    if (bValue === null) return -1;
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendor</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Monthly Cost</TableHead>
            <TableHead>Next Charge</TableHead>
            <TableHead>Auto-Renew</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedSubscriptions.map((subscription) => (
            <TableRow key={subscription.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {subscription.vendorName}
                  {subscription.discoveredApps.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {subscription.discoveredApps.length} apps
                    </Badge>
                  )}
                </div>
                {subscription.description && (
                  <div className="text-sm text-muted-foreground">
                    {subscription.description}
                  </div>
                )}
              </TableCell>
              <TableCell>{subscription.category || '-'}</TableCell>
              <TableCell>
                <Badge
                  variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'}
                >
                  {subscription.status}
                </Badge>
              </TableCell>
              <TableCell>
                {formatCurrency(subscription.monthlyAmount, subscription.currency)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {subscription.nextChargeDate ? (
                    format(subscription.nextChargeDate, 'MMM d, yyyy')
                  ) : (
                    '-'
                  )}
                  {subscription.nextChargeDate && 
                   new Date(subscription.nextChargeDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                {subscription.autoRenewal ? (
                  <Badge variant="default">Yes</Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{subscription.source}</Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Edit subscription</DropdownMenuItem>
                    <DropdownMenuItem>View billing history</DropdownMenuItem>
                    <DropdownMenuItem>View discovered apps</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      Cancel subscription
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 