import { Queue, Worker, QueueScheduler } from 'bullmq';
import redis from '@/lib/redis';
import { syncQuickBooks } from './processors/quickbooks';
import { syncGoogleWorkspace } from './processors/google';
import { checkRenewals } from './processors/renewals';

// Queue names
export const SYNC_QUEUE = 'sync';
export const NOTIFICATION_QUEUE = 'notification';

// Create queues
export const syncQueue = new Queue(SYNC_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export const notificationQueue = new Queue(NOTIFICATION_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

// Create queue schedulers (for delayed/recurring jobs)
export const syncScheduler = new QueueScheduler(SYNC_QUEUE, {
  connection: redis,
});

export const notificationScheduler = new QueueScheduler(NOTIFICATION_QUEUE, {
  connection: redis,
});

// Create workers
const syncWorker = new Worker(
  SYNC_QUEUE,
  async (job) => {
    switch (job.name) {
      case 'syncQuickBooks':
        return syncQuickBooks(job.data);
      case 'syncGoogleWorkspace':
        return syncGoogleWorkspace(job.data);
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  },
  { connection: redis }
);

const notificationWorker = new Worker(
  NOTIFICATION_QUEUE,
  async (job) => {
    switch (job.name) {
      case 'checkRenewals':
        return checkRenewals(job.data);
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  },
  { connection: redis }
);

// Error handling
syncWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error:`, err);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error:`, err);
});

// Schedule recurring jobs
export async function scheduleRecurringJobs() {
  // Daily sync at midnight
  await syncQueue.add(
    'syncQuickBooks',
    {},
    {
      repeat: {
        pattern: '0 0 * * *', // Every day at midnight
      },
    }
  );

  await syncQueue.add(
    'syncGoogleWorkspace',
    {},
    {
      repeat: {
        pattern: '0 0 * * *', // Every day at midnight
      },
    }
  );

  // Check renewals every morning at 8 AM
  await notificationQueue.add(
    'checkRenewals',
    {},
    {
      repeat: {
        pattern: '0 8 * * *', // Every day at 8 AM
      },
    }
  );
}

// Clean up function for graceful shutdown
export async function closeQueues() {
  await syncWorker.close();
  await notificationWorker.close();
  await syncQueue.close();
  await notificationQueue.close();
  await syncScheduler.close();
  await notificationScheduler.close();
} 