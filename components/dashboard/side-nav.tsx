'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CreditCard,
  Settings,
  Package,
  Bell,
} from 'lucide-react';
import type { Route } from 'next';

const items = [
  {
    title: 'Dashboard',
    href: '/dashboard' as Route,
    icon: LayoutDashboard,
  },
  {
    title: 'Subscriptions',
    href: '/dashboard/subscriptions' as Route,
    icon: Package,
  },
  {
    title: 'Billing',
    href: '/dashboard/billing' as Route,
    icon: CreditCard,
  },
  {
    title: 'Notifications',
    href: '/dashboard/notifications' as Route,
    icon: Bell,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings' as Route,
    icon: Settings,
  },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="grid items-start gap-2 p-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
              pathname === item.href ? 'bg-accent' : 'transparent'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
} 