import { scheduleRecurringJobs } from '@/lib/queue';

// Initialize application services
export async function initializeApp() {
  try {
    // Schedule recurring jobs using BullMQ
    await scheduleRecurringJobs();
    console.log('Successfully scheduled recurring jobs');
  } catch (error) {
    console.error('Error scheduling recurring jobs:', error);
  }
}

// Call initialization on app startup
initializeApp(); 