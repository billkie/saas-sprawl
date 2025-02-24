'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  initiateQuickBooksAuth,
  initiateGoogleAuth,
  syncIntegration,
  disconnectIntegration,
} from '@/lib/integrations';

interface IntegrationCardProps {
  title: string;
  description: string;
  icon: string;
  type: 'quickbooks' | 'google';
  status: {
    isConnected: boolean;
    lastSyncAt: Date | null;
    domain?: string | null;
    realmId?: string | null;
  };
  stats: Array<{
    label: string;
    value: string;
  }>;
  additionalInfo?: string;
}

export function IntegrationCard({
  title,
  description,
  icon,
  type,
  status,
  stats,
  additionalInfo,
}: IntegrationCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  async function handleConnect() {
    try {
      setIsLoading(true);
      const authUri = await (type === 'quickbooks' ? initiateQuickBooksAuth() : initiateGoogleAuth());
      window.location.href = authUri;
    } catch (error) {
      console.error(`Failed to connect ${type}:`, error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSync() {
    try {
      setIsSyncing(true);
      await syncIntegration(type);
      router.refresh();
    } catch (error) {
      console.error(`Failed to sync ${type}:`, error);
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleDisconnect() {
    try {
      setIsLoading(true);
      await disconnectIntegration(type);
      router.refresh();
    } catch (error) {
      console.error(`Failed to disconnect ${type}:`, error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <div className="relative h-10 w-10">
            <Image
              src={icon}
              alt={title}
              fill
              className="rounded-lg object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.isConnected && (
          <>
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                {type === 'quickbooks' ? status.realmId : status.domain}
              </Badge>
              <Badge variant="default">Connected</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="space-y-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-semibold">{stat.value}</p>
                </div>
              ))}
            </div>
            {additionalInfo && (
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{additionalInfo}</AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {status.isConnected ? (
          <>
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disconnect
            </Button>
            <Button onClick={handleSync} disabled={isSyncing}>
              {isSyncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sync Now
            </Button>
          </>
        ) : (
          <Button onClick={handleConnect} disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect {title}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 