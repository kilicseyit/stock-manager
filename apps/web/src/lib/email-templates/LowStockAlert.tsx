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

export interface LowStockAlertProps {
  productName: string;
  sku: string;
  quantity: number;
  minStock: number;
  managerName?: string;
  accentColor?: string;
  senderName?: string;
  footerText?: string;
}

export function LowStockAlert({ productName, sku, quantity, minStock, managerName, accentColor = '#ef4444', senderName = 'StockManager', footerText = 'StockManager Depo Yönetim Sistemi' }: LowStockAlertProps) {
  const deficit = minStock - quantity;

  return (
    <Html lang="tr">
      <Head />
      <Preview>{`🚨 Düşük Stok: ${productName} — Mevcut: ${quantity} / Min: ${minStock}`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={{ ...header, backgroundColor: accentColor }}>
            <Heading style={headerTitle}>🚨 Düşük Stok Uyarısı</Heading>
          </Section>

          <Section style={content}>
            {managerName && (
              <Text style={greeting}>Merhaba {managerName},</Text>
            )}
            <Text style={paragraph}>
              Depodaki bir ürünün mevcut miktarı minimum stok seviyesinin altına düşmüştür.
              Lütfen gerekli tedarik işlemlerini başlatınız.
            </Text>

            <Section style={card}>
              <Row style={cardRow}>
                <Column style={labelCol}><Text style={label}>Ürün Adı</Text></Column>
                <Column style={valueCol}><Text style={valueBold}>{productName}</Text></Column>
              </Row>
              <Row style={cardRowAlt}>
                <Column style={labelCol}><Text style={label}>SKU</Text></Column>
                <Column style={valueCol}><Text style={valueMono}>{sku}</Text></Column>
              </Row>
              <Row style={cardRow}>
                <Column style={labelCol}><Text style={label}>Mevcut Miktar</Text></Column>
                <Column style={valueCol}><Text style={valueDanger}>{quantity}</Text></Column>
              </Row>
              <Row style={cardRowAlt}>
                <Column style={labelCol}><Text style={label}>Minimum Eşik</Text></Column>
                <Column style={valueCol}><Text style={value}>{minStock}</Text></Column>
              </Row>
              <Row style={cardRow}>
                <Column style={labelCol}><Text style={label}>Eksik Miktar</Text></Column>
                <Column style={valueCol}><Text style={valueDanger}>–{deficit}</Text></Column>
              </Row>
            </Section>
          </Section>

          <Hr style={divider} />
          <Text style={footer}>
            Bu otomatik bir e-postadır · {footerText}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default LowStockAlert;

// --- Styles ---
const body = { backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif' };
const container = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden' as const, border: '1px solid #e4e4e7' };
const header = { backgroundColor: '#ef4444', padding: '24px 32px' };
const headerTitle = { color: '#ffffff', margin: '0', fontSize: '22px' };
const content = { padding: '24px 32px' };
const greeting = { fontSize: '16px', color: '#374151', marginBottom: '8px' };
const paragraph = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6' };
const card = { border: '1px solid #e4e4e7', borderRadius: '8px', overflow: 'hidden' as const, marginTop: '20px' };
const cardRow = { backgroundColor: '#ffffff' };
const cardRowAlt = { backgroundColor: '#f9fafb' };
const labelCol = { width: '40%', padding: '10px 14px' };
const valueCol = { padding: '10px 14px' };
const label = { margin: '0', fontSize: '13px', color: '#6b7280', fontWeight: 'bold' as const };
const value = { margin: '0', fontSize: '13px', color: '#111827' };
const valueBold = { ...value, fontWeight: 'bold' as const };
const valueMono = { ...value, fontFamily: 'monospace' };
const valueDanger = { ...valueBold, color: '#ef4444' };
const divider = { borderColor: '#e4e4e7', margin: '0 32px' };
const footer = { fontSize: '11px', color: '#9ca3af', textAlign: 'center' as const, padding: '16px 32px' };
