import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Email sender configuration
const sender = {
  email: process.env.SENDGRID_FROM_EMAIL!,
  name: process.env.SENDGRID_FROM_NAME!,
};

// Email template IDs
export const TEMPLATE_IDS = {
  RENEWAL_REMINDER: 'd-0123456789abcdef0123456789abcdef',
  RENEWAL_DUE: 'd-b875dbafc43f41d481f398861784a5cb',
  RENEWAL_OVERDUE: 'd-6a3cbadc430f4528a6c3a32fbf74f2d5',
  SYNC_SUCCESS: 'd-d3020900a5d14df9acca37ebf995b593',
  SYNC_FAILURE: 'd-32ca7365db2c41e8b338fa7d62b0ae75',
  SUBSCRIPTION_CONFIRMATION: 'd-1234567890abcdef1234567890abcdef',
  SUBSCRIPTION_CANCELED: 'd-abcdef1234567890abcdef1234567890',
  PAYMENT_SUCCESS: 'd-7890abcdef1234567890abcdef123456',
  PAYMENT_FAILED: 'd-def1234567890abcdef1234567890abc',
};

export interface EmailData {
  to: string;
  templateId: string;
  dynamicTemplateData: Record<string, any>;
  attachments?: any[];
  cc?: string[];
  bcc?: string[];
}

/**
 * Send a templated email using SendGrid
 */
export async function sendEmail({
  to,
  templateId,
  dynamicTemplateData,
  attachments,
  cc,
  bcc,
}: EmailData) {
  try {
    const msg = {
      to,
      from: sender,
      templateId,
      dynamicTemplateData,
      attachments,
      cc,
      bcc,
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send sync success notification
 */
export async function sendSyncSuccessEmail(
  to: string,
  data: {
    userName: string;
    companyName: string;
    integrationType: 'QuickBooks' | 'Google Workspace';
    syncResults: {
      newItems: number;
      updatedItems: number;
      totalProcessed: number;
    };
    syncDate: string;
  }
) {
  return sendEmail({
    to,
    templateId: TEMPLATE_IDS.SYNC_SUCCESS,
    dynamicTemplateData: {
      userName: data.userName,
      companyName: data.companyName,
      integrationType: data.integrationType,
      newItems: data.syncResults.newItems,
      updatedItems: data.syncResults.updatedItems,
      totalProcessed: data.syncResults.totalProcessed,
      syncDate: formatDate(data.syncDate),
    },
  });
}

/**
 * Send sync failure notification
 */
export async function sendSyncFailureEmail(
  to: string,
  data: {
    userName: string;
    companyName: string;
    integrationType: 'QuickBooks' | 'Google Workspace';
    error: string;
    errorDetails?: string;
    syncDate: string;
    nextRetry?: string;
  }
) {
  return sendEmail({
    to,
    templateId: TEMPLATE_IDS.SYNC_FAILURE,
    dynamicTemplateData: {
      userName: data.userName,
      companyName: data.companyName,
      integrationType: data.integrationType,
      error: data.error,
      errorDetails: data.errorDetails,
      syncDate: formatDate(data.syncDate),
      nextRetry: data.nextRetry ? formatDate(data.nextRetry) : undefined,
    },
  });
}

/**
 * Send renewal reminder email
 */
export async function sendRenewalReminder(
  to: string,
  data: {
    userName: string;
    companyName: string;
    vendorName: string;
    subscriptionName: string;
    amount: number;
    currency: string;
    renewalDate: string;
    daysUntilRenewal: number;
    managementUrl: string;
    source: string;
    category?: string;
    lastChargeDate?: string;
  }
) {
  let templateId = TEMPLATE_IDS.RENEWAL_REMINDER;
  
  // Use different templates based on urgency
  if (data.daysUntilRenewal === 0) {
    templateId = TEMPLATE_IDS.RENEWAL_DUE;
  } else if (data.daysUntilRenewal < 0) {
    templateId = TEMPLATE_IDS.RENEWAL_OVERDUE;
  }

  return sendEmail({
    to,
    templateId,
    dynamicTemplateData: {
      userName: data.userName,
      companyName: data.companyName,
      vendorName: data.vendorName,
      subscriptionName: data.subscriptionName,
      amount: formatAmount(data.amount, data.currency),
      renewalDate: formatDate(data.renewalDate),
      daysUntilRenewal: Math.abs(data.daysUntilRenewal),
      managementUrl: data.managementUrl,
      source: data.source,
      category: data.category,
      lastChargeDate: data.lastChargeDate ? formatDate(data.lastChargeDate) : undefined,
      isOverdue: data.daysUntilRenewal < 0,
      isDueToday: data.daysUntilRenewal === 0,
    },
  });
}

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionConfirmation(
  to: string,
  data: {
    userName: string;
    companyName: string;
    subscriptionName: string;
    amount: number;
    currency: string;
    startDate: string;
    managementUrl: string;
  }
) {
  return sendEmail({
    to,
    templateId: TEMPLATE_IDS.SUBSCRIPTION_CONFIRMATION,
    dynamicTemplateData: {
      userName: data.userName,
      companyName: data.companyName,
      subscriptionName: data.subscriptionName,
      amount: formatAmount(data.amount, data.currency),
      startDate: formatDate(data.startDate),
      managementUrl: data.managementUrl,
    },
  });
}

/**
 * Send subscription canceled email
 */
export async function sendSubscriptionCanceledEmail(
  to: string,
  data: {
    userName: string;
    companyName: string;
    subscriptionName: string;
    endDate: string;
  }
) {
  return sendEmail({
    to,
    templateId: TEMPLATE_IDS.SUBSCRIPTION_CANCELED,
    dynamicTemplateData: {
      userName: data.userName,
      companyName: data.companyName,
      subscriptionName: data.subscriptionName,
      endDate: formatDate(data.endDate),
    },
  });
}

/**
 * Send payment success email
 */
export async function sendPaymentSuccessEmail(
  to: string,
  data: {
    userName: string;
    companyName: string;
    subscriptionName: string;
    amount: number;
    currency: string;
    paymentDate: string;
    nextBillingDate: string;
  }
) {
  return sendEmail({
    to,
    templateId: TEMPLATE_IDS.PAYMENT_SUCCESS,
    dynamicTemplateData: {
      userName: data.userName,
      companyName: data.companyName,
      subscriptionName: data.subscriptionName,
      amount: formatAmount(data.amount, data.currency),
      paymentDate: formatDate(data.paymentDate),
      nextBillingDate: formatDate(data.nextBillingDate),
    },
  });
}

/**
 * Send payment failed email
 */
export async function sendPaymentFailedEmail(
  to: string,
  data: {
    userName: string;
    companyName: string;
    subscriptionName: string;
    amount: number;
    currency: string;
    failureDate: string;
    retryDate: string;
    error: string;
  }
) {
  return sendEmail({
    to,
    templateId: TEMPLATE_IDS.PAYMENT_FAILED,
    dynamicTemplateData: {
      userName: data.userName,
      companyName: data.companyName,
      subscriptionName: data.subscriptionName,
      amount: formatAmount(data.amount, data.currency),
      failureDate: formatDate(data.failureDate),
      retryDate: formatDate(data.retryDate),
      error: data.error,
    },
  });
}

// Helper function to format currency amounts
function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Helper function to format dates
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
} 