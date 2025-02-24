import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Email sender configuration
const sender = {
  email: process.env.SENDGRID_FROM_EMAIL!,
  name: process.env.SENDGRID_FROM_NAME!,
};

// Email template IDs (you'll need to create these in SendGrid dashboard)
export const _IDS = {
  WELCOME: 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  SUBSCRIPTION_CONFIRMATION: 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  PAYMENT_SUCCESS: 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  PAYMENT_FAILED: 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  SUBSCRIPTION_CANCELED: 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  RENEWAL_REMINDER: 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
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
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(to: string, data: { name: string; companyName: string }) {
  return sendEmail({
    to,
    templateId: TEMPLATE_IDS.WELCOME,
    dynamicTemplateData: {
      name: data.name,
      companyName: data.companyName,
    },
  });
}

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionConfirmation(
  to: string,
  data: {
    companyName: string;
    planName: string;
    amount: number;
    currency: string;
    nextBillingDate: string;
  }
) {
  return sendEmail({
    to,
    templateId: TEMPLATE_IDS.SUBSCRIPTION_CONFIRMATION,
    dynamicTemplateData: {
      companyName: data.companyName,
      planName: data.planName,
      amount: formatAmount(data.amount, data.currency),
      nextBillingDate: formatDate(data.nextBillingDate),
    },
  });
}

/**
 * Send payment success email
 */
export async function sendPaymentSuccessEmail(
  to: string,
  data: {
    companyName: string;
    planName: string;
    amount: number;
    currency: string;
    nextBillingDate: string;
  }
) {
  return sendEmail({
    to,
    templateId: TEMPLATE_IDS.PAYMENT_SUCCESS,
    dynamicTemplateData: {
      companyName: data.companyName,
      planName: data.planName,
      amount: formatAmount(data.amount, data.currency),
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
    companyName: string;
    planName: string;
    amount: number;
    currency: string;
    retryDate: string;
  }
) {
  return sendEmail({
    to,
    templateId: TEMPLATE_IDS.PAYMENT_FAILED,
    dynamicTemplateData: {
      companyName: data.companyName,
      planName: data.planName,
      amount: formatAmount(data.amount, data.currency),
      retryDate: formatDate(data.retryDate),
    },
  });
}

/**
 * Send subscription canceled email
 */
export async function sendSubscriptionCanceledEmail(
  to: string,
  data: {
    companyName: string;
    planName: string;
    endDate: string;
  }
) {
  return sendEmail({
    to,
    templateId: TEMPLATE_IDS.SUBSCRIPTION_CANCELED,
    dynamicTemplateData: {
      companyName: data.companyName,
      planName: data.planName,
      endDate: formatDate(data.endDate),
    },
  });
}

/**
 * Send renewal reminder email
 */
export async function sendRenewalReminderEmail(
  to: string,
  data: {
    companyName: string;
    planName: string;
    amount: number;
    currency: string;
    renewalDate: string;
    daysUntilRenewal: number;
  }
) {
  return sendEmail({
    to,
    templateId: TEMPLATE_IDS.RENEWAL_REMINDER,
    dynamicTemplateData: {
      companyName: data.companyName,
      planName: data.planName,
      amount: formatAmount(data.amount, data.currency),
      renewalDate: formatDate(data.renewalDate),
      daysUntilRenewal: data.daysUntilRenewal,
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