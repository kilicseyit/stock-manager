import { Resend } from 'resend';
import { render } from '@react-email/render';
import { LowStockAlert, type LowStockAlertProps } from './email-templates/LowStockAlert';
import { WeeklyReport, type WeeklyReportProps } from './email-templates/WeeklyReport';
import { OrderCreated, type OrderCreatedProps } from './email-templates/OrderCreated';
import { WelcomeEmail, type WelcomeEmailProps } from './email-templates/WelcomeEmail';

const FROM = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const DEFAULT_TO = process.env.NOTIFICATION_EMAIL || 'admin@example.com';

let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn('[Email] RESEND_API_KEY tanımlı değil. Email mock modunda çalışıyor.');
}

async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  component: React.ReactElement;
  attachments?: Array<{ filename: string; content: Buffer }>;
}): Promise<void> {
  const html = await render(opts.component);

  if (!resend) {
    const toList = Array.isArray(opts.to) ? opts.to.join(', ') : opts.to;
    console.log(`[Email Mock] Konu: "${opts.subject}" → ${toList}`);
    return;
  }

  const response = await resend.emails.send({
    from: `StockManager <${FROM}>`,
    to: opts.to,
    subject: opts.subject,
    html,
    ...(opts.attachments ? { attachments: opts.attachments } : {}),
  });

  if (response.error) {
    console.error('[Email Error]', response.error);
  } else {
    const toList = Array.isArray(opts.to) ? opts.to.join(', ') : opts.to;
    console.log(`[Email Sent] ID: ${response.data?.id} → ${toList}`);
  }
}

export async function sendLowStockAlert(
  data: LowStockAlertProps,
  to: string = DEFAULT_TO,
): Promise<void> {
  await sendEmail({
    to,
    subject: `🚨 Düşük Stok Uyarısı: ${data.productName}`,
    component: LowStockAlert(data) as React.ReactElement,
  });
}

export async function sendWeeklyReport(
  data: WeeklyReportProps,
  to: string[],
  excelBuffer?: Buffer,
): Promise<void> {
  await sendEmail({
    to,
    subject: `StockManager Haftalık Stok Raporu — ${data.dateStr}`,
    component: WeeklyReport(data) as React.ReactElement,
    attachments: excelBuffer
      ? [{ filename: `Haftalik_Stok_Raporu_${data.dateStr}.xlsx`, content: excelBuffer }]
      : undefined,
  });
}

export async function sendOrderCreatedEmail(
  data: OrderCreatedProps,
  to: string | string[],
): Promise<void> {
  await sendEmail({
    to,
    subject: `✅ Sipariş Oluşturuldu: ${data.orderNumber} — ${data.supplierName}`,
    component: OrderCreated(data) as React.ReactElement,
  });
}

export async function sendWelcomeEmail(
  data: WelcomeEmailProps,
  to: string,
): Promise<void> {
  await sendEmail({
    to,
    subject: `StockManager'a Hoş Geldiniz, ${data.name}!`,
    component: WelcomeEmail(data) as React.ReactElement,
  });
}
