'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '@/lib/notifications';
import { UrlObject } from 'url';

interface NotificationsListProps {
  initialNotifications: Notification[];
  userId: string;
}

export function NotificationsList({
  initialNotifications,
  userId,
}: NotificationsListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [notificationType, setNotificationType] = useState<Notification['type'] | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);

  const filteredNotifications = notifications.filter((notification) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'unread' && !notification.read) ||
      (filter === 'read' && notification.read);

    const matchesType =
      notificationType === 'all' || notification.type === notificationType;

    return matchesFilter && matchesType;
  });

  async function markAllAsRead() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }

      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications as read');
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteNotification(notificationId: string) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId)
      );
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select
          value={filter}
          onValueChange={(value: 'all' | 'unread' | 'read') => setFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter notifications" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All notifications</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={notificationType}
          onValueChange={(value: Notification['type'] | 'all') =>
            setNotificationType(value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="renewal">Renewals</SelectItem>
            <SelectItem value="discovery">Discoveries</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={markAllAsRead}
          disabled={isLoading || notifications.every((n) => n.read)}
        >
          Mark all as read
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredNotifications.map((notification) => (
          <Card key={notification.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-medium">{notification.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {notification.message}
                </p>
                {notification.data?.subscriptionId && (
                  <Link
                    href={{
                      pathname: '/dashboard/subscriptions/[id]',
                      query: { id: notification.data.subscriptionId }
                    } as UrlObject}
                    className="text-sm text-primary hover:underline"
                  >
                    View subscription
                  </Link>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteNotification(notification.id)}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}

        {filteredNotifications.length === 0 && (
          <p className="text-center text-muted-foreground">
            No notifications found
          </p>
        )}
      </div>
    </div>
  );
} 