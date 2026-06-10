import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from '@react-email/components';

export interface WeeklyReportProduct {
  name: string;
  sku: string;
  totalQty: number;
  minStock: number;
  unit: string;
  isLow: boolean;
}

export interface WeeklyReportProps {
  dateStr: string;
  totalProducts: number;
  lowStockCount: number;
  criticalProducts: WeeklyReportProduct[];
  accentColor?: string;
  senderName?: string;
  footerText?: string;
}

export function WeeklyReport({ dateStr, totalProducts, lowStockCount, criticalProducts, accentColor = '#4f46e5', senderName = 'StockManager', footerText = 'Bu rapor her Pazartesi 08:00\'de otomatik oluşturulur · StockManager Depo Yönetim Sistemi' }: WeeklyReportProps) {
  return (
    <Html lang="tr">
      <Head />
      <Preview>StockManager Haftalık Stok Raporu — {dateStr}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={{ ...header, backgroundColor: accentColor }}>
            <Heading style={headerTitle}>{senderName}</Heading>
            <Text style={headerSub}>Haftalık Stok Durumu Raporu</Text>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>
              Merhaba, <strong>{dateStr}</strong> tarihi itibarıyla haftalık envanter özeti aşağıda yer almaktadır.
              Detaylı Excel raporu ekte gönderilmiştir.
            </Text>

            <Row style={statsRow}>
              <Column style={statCard}>
                <Text style={statNumber}>{totalProducts}</Text>
                <Text style={statLabel}>Toplam Ürün</Text>
              </Column>
              <Column style={statCard}>
                <Text style={{ ...statNumber, color: lowStockCount > 0 ? '#ef4444' : '#22c55e' }}>
                  {lowStockCount}
                </Text>
                <Text style={statLabel}>Kritik Stok</Text>
              </Column>
              <Column style={statCard}>
                <Text style={{ ...statNumber, color: '#4f46e5' }}>
                  {totalProducts - lowStockCount}
                </Text>
                <Text style={statLabel}>Normal Stok</Text>
              </Column>
            </Row>

            {criticalProducts.length > 0 && (
              <>
                <Text style={sectionTitle}>⚠️ Kritik Stok Ürünleri</Text>
                <Section style={table}>
                  <Row style={{ backgroundColor: accentColor }}>
                    <Column style={thCol}><Text style={th}>Ürün</Text></Column>
                    <Column style={thColSm}><Text style={th}>Mevcut</Text></Column>
                    <Column style={thColSm}><Text style={th}>Min</Text></Column>
                  </Row>
                  {criticalProducts.map((p, i) => (
                    <Row key={p.sku} style={i % 2 === 0 ? trEven : trOdd}>
                      <Column style={tdCol}>
                        <Text style={tdText}>{p.name}</Text>
                        <Text style={tdMono}>{p.sku}</Text>
                      </Column>
                      <Column style={tdColSm}><Text style={tdDanger}>{p.totalQty} {p.unit}</Text></Column>
                      <Column style={tdColSm}><Text style={tdText}>{p.minStock}</Text></Column>
                    </Row>
                  ))}
                </Section>
              </>
            )}
          </Section>

          <Hr style={divider} />
          <Text style={footer}>{footerText}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WeeklyReport;

// --- Styles ---
const body = { backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif' };
const container = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden' as const, border: '1px solid #e4e4e7' };
const header = { backgroundColor: '#4f46e5', padding: '24px 32px' };
const headerTitle = { color: '#ffffff', margin: '0', fontSize: '24px' };
const headerSub = { color: '#c7d2fe', margin: '4px 0 0', fontSize: '14px' };
const content = { padding: '24px 32px' };
const paragraph = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6' };
const statsRow = { margin: '20px 0' };
const statCard = { textAlign: 'center' as const, padding: '16px', border: '1px solid #e4e4e7', borderRadius: '8px', margin: '0 4px' };
const statNumber = { margin: '0', fontSize: '28px', fontWeight: 'bold' as const, color: '#111827' };
const statLabel = { margin: '4px 0 0', fontSize: '12px', color: '#6b7280' };
const sectionTitle = { fontSize: '15px', fontWeight: 'bold' as const, color: '#374151', marginTop: '24px', marginBottom: '8px' };
const table = { border: '1px solid #e4e4e7', borderRadius: '8px', overflow: 'hidden' as const };
const tableHeader = { backgroundColor: '#4f46e5' };
const thCol = { padding: '10px 14px', width: '60%' };
const thColSm = { padding: '10px 14px', width: '20%' };
const th = { margin: '0', fontSize: '12px', fontWeight: 'bold' as const, color: '#ffffff' };
const trEven = { backgroundColor: '#ffffff' };
const trOdd = { backgroundColor: '#f9fafb' };
const tdCol = { padding: '10px 14px', width: '60%' };
const tdColSm = { padding: '10px 14px', width: '20%' };
const tdText = { margin: '0', fontSize: '13px', color: '#111827' };
const tdMono = { margin: '0', fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' };
const tdDanger = { margin: '0', fontSize: '13px', color: '#ef4444', fontWeight: 'bold' as const };
const divider = { borderColor: '#e4e4e7', margin: '0 32px' };
const footer = { fontSize: '11px', color: '#9ca3af', textAlign: 'center' as const, padding: '16px 32px' };
