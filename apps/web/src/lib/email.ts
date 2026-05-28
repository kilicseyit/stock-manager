import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

let resend: Resend | null = null;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
} else {
  console.warn('[Email] RESEND_API_KEY is not defined. Email notifications will be skipped (logged in mock mode).');
}

interface LowStockEmailData {
  productName: string;
  sku: string;
  quantity: number;
  minStock: number;
}

export async function sendLowStockAlert(data: LowStockEmailData, to?: string): Promise<void> {
  const toEmail = to || process.env.NOTIFICATION_EMAIL || 'admin@example.com';
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  
  if (!resend) {
    console.log(`[Email Mock] Skipping email send. Target: ${toEmail}. Low Stock Product: ${data.productName} (SKU: ${data.sku}, Stock: ${data.quantity}/${data.minStock})`);
    return;
  }

  try {
    const response = await resend.emails.send({
      from: `StockManager <${fromEmail}>`,
      to: toEmail,
      subject: `🚨 Düşük Stok Uyarısı: ${data.productName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 12px;">
          <h2 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 10px; margin-top: 0;">🚨 Düşük Stok Uyarısı</h2>
          <p>Depodaki bir ürünün mevcut miktarı minimum stok seviyesinin altına düşmüştür.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr style="background-color: #f4f4f5;">
              <th style="padding: 10px; text-align: left; border: 1px solid #e4e4e7; width: 40%;">Ürün Adı</th>
              <td style="padding: 10px; border: 1px solid #e4e4e7; font-weight: bold;">${data.productName}</td>
            </tr>
            <tr>
              <th style="padding: 10px; text-align: left; border: 1px solid #e4e4e7;">SKU</th>
              <td style="padding: 10px; border: 1px solid #e4e4e7; font-family: monospace;">${data.sku}</td>
            </tr>
            <tr style="background-color: #f4f4f5;">
              <th style="padding: 10px; text-align: left; border: 1px solid #e4e4e7;">Mevcut Miktar</th>
              <td style="padding: 10px; border: 1px solid #e4e4e7; color: #ef4444; font-weight: bold;">${data.quantity}</td>
            </tr>
            <tr>
              <th style="padding: 10px; text-align: left; border: 1px solid #e4e4e7;">Minimum Eşik</th>
              <td style="padding: 10px; border: 1px solid #e4e4e7;">${data.minStock}</td>
            </tr>
          </table>
          <p style="margin-top: 20px; font-size: 12px; color: #71717a;">
            Bu otomatik bir e-postadır. Lütfen bu adrese cevap yazmayın.
          </p>
        </div>
      `,
    });

    if (response.error) {
      console.error('[Email Error] Resend returned an error:', response.error);
    } else {
      console.log(`[Email Sent] Low stock email sent successfully to ${toEmail} for ${data.sku}. ID: ${response.data?.id}`);
    }
  } catch (error) {
    console.error('[Email Error] Failed to send email via Resend:', error);
  }
}
