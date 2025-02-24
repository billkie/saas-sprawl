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
  RENEWAL_REMINDER: 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  RENEWAL_DUE: 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  RENEWAL_OVERDUE: 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
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