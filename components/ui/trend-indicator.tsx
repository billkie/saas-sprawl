'use client';

import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendIndicatorProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  reversed?: boolean;
  showZero?: boolean;
}

export function TrendIndicator({
  value,
  className,
  prefix = '',
  suffix = '%',
  reversed = false,
  showZero = false,
}: TrendIndicatorProps) {
  const isPositive = reversed ? value < 0 : value > 0;
  const isZero = value === 0;

  if (isZero && !showZero) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center text-xs',
        isZero
          ? 'text-muted-foreground'
          : isPositive
          ? 'text-green-500'
          : 'text-red-500',
        className
      )}
    >
      {isZero ? (
        <MinusIcon className="mr-1 h-3 w-3" />
      ) : isPositive ? (
        <ArrowUpIcon className="mr-1 h-3 w-3" />
      ) : (
        <ArrowDownIcon className="mr-1 h-3 w-3" />
      )}
      <span>
        {prefix}
        {Math.abs(value).toFixed(1)}
        {suffix}
      </span>
    </div>
  );
} 