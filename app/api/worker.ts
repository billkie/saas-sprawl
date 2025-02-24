import { scheduleRecurringJobs } from '@/lib/queue';

// Initialize background jobs
export async function initializeWorker() {
  try {
    await scheduleRecurringJobs();
    console.log('Successfully scheduled recurring jobs');
  } catch (error) {
    console.error('Error scheduling recurring jobs:', error);
  }
}

// Call initialization when the file is imported
initializeWorker(); 