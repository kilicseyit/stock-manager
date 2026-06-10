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

export interface OrderCreatedItem {
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
}

export interface OrderCreatedProps {
  orderNumber: string;
  supplierName: string;
  createdByName: string;
  expectedDate?: string;
  items: OrderCreatedItem[];
  totalItems: number;
  accentColor?: string;
  senderName?: string;
  footerText?: string;
}

export function OrderCreated({ orderNumber, supplierName, createdByName, expectedDate, items, totalItems, accentColor = '#22c55e', senderName = 'StockManager', footerText = 'StockManager Depo Yönetim Sistemi · Otomatik bildirim' }: OrderCreatedProps) {
  return (
    <Html lang="tr">
      <Head />
      <Preview>Satın Alma Siparişi Oluşturuldu — {orderNumber}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={{ ...header, backgroundColor: accentColor }}>
            <Heading style={headerTitle}>✅ Sipariş Oluşturuldu</Heading>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>
              <strong>{createdByName}</strong> tarafından yeni bir satın alma siparişi oluşturuldu.
            </Text>

            <Section style={card}>
              <Row style={cardRow}>
                <Column style={labelCol}><Text style={label}>Sipariş No</Text></Column>
                <Column style={valueCol}><Text style={valueMono}>{orderNumber}</Text></Column>
              </Row>
              <Row style={cardRowAlt}>
                <Column style={labelCol}><Text style={label}>Tedarikçi</Text></Column>
                <Column style={valueCol}><Text style={valueBold}>{supplierName}</Text></Column>
              </Row>
              <Row style={cardRow}>
                <Column style={labelCol}><Text style={label}>Oluşturan</Text></Column>
                <Column style={valueCol}><Text style={value}>{createdByName}</Text></Column>
              </Row>
              {expectedDate && (
                <Row style={cardRowAlt}>
                  <Column style={labelCol}><Text style={label}>Beklenen Tarih</Text></Column>
                  <Column style={valueCol}><Text style={value}>{expectedDate}</Text></Column>
                </Row>
              )}
              <Row style={cardRow}>
                <Column style={labelCol}><Text style={label}>Toplam Kalem</Text></Column>
                <Column style={valueCol}><Text style={valueBold}>{totalItems}</Text></Column>
              </Row>
            </Section>

            <Text style={sectionTitle}>Sipariş Kalemleri</Text>
            <Section style={table}>
              <Row style={{ backgroundColor: accentColor }}>
                <Column style={thColWide}><Text style={th}>Ürün</Text></Column>
                <Column style={thColNarrow}><Text style={th}>Miktar</Text></Column>
              </Row>
              {items.map((item, i) => (
                <Row key={item.sku} style={i % 2 === 0 ? trEven : trOdd}>
                  <Column style={tdColWide}>
                    <Text style={tdText}>{item.productName}</Text>
                    <Text style={tdMono}>{item.sku}</Text>
                  </Column>
                  <Column style={tdColNarrow}><Text style={tdText}>{item.quantity} {item.unit}</Text></Column>
                </Row>
              ))}
            </Section>
          </Section>

          <Hr style={divider} />
          <Text style={footer}>{footerText}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OrderCreated;

// --- Styles ---
const body = { backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif' };
const container = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden' as const, border: '1px solid #e4e4e7' };
const header = { backgroundColor: '#22c55e', padding: '24px 32px' };
const headerTitle = { color: '#ffffff', margin: '0', fontSize: '22px' };
const content = { padding: '24px 32px' };
const paragraph = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6' };
const sectionTitle = { fontSize: '15px', fontWeight: 'bold' as const, color: '#374151', marginTop: '24px', marginBottom: '8px' };
const card = { border: '1px solid #e4e4e7', borderRadius: '8px', overflow: 'hidden' as const, marginTop: '16px' };
const cardRow = { backgroundColor: '#ffffff' };
const cardRowAlt = { backgroundColor: '#f9fafb' };
const labelCol = { width: '40%', padding: '10px 14px' };
const valueCol = { padding: '10px 14px' };
const label = { margin: '0', fontSize: '13px', color: '#6b7280', fontWeight: 'bold' as const };
const value = { margin: '0', fontSize: '13px', color: '#111827' };
const valueBold = { ...value, fontWeight: 'bold' as const };
const valueMono = { ...value, fontFamily: 'monospace' };
const table = { border: '1px solid #e4e4e7', borderRadius: '8px', overflow: 'hidden' as const };
const tableHeader = { backgroundColor: '#22c55e' };
const thColWide = { padding: '10px 14px', width: '70%' };
const thColNarrow = { padding: '10px 14px', width: '30%' };
const th = { margin: '0', fontSize: '12px', fontWeight: 'bold' as const, color: '#ffffff' };
const trEven = { backgroundColor: '#ffffff' };
const trOdd = { backgroundColor: '#f9fafb' };
const tdColWide = { padding: '10px 14px', width: '70%' };
const tdColNarrow = { padding: '10px 14px', width: '30%' };
const tdText = { margin: '0', fontSize: '13px', color: '#111827' };
const tdMono = { margin: '0', fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' };
const divider = { borderColor: '#e4e4e7', margin: '0 32px' };
const footer = { fontSize: '11px', color: '#9ca3af', textAlign: 'center' as const, padding: '16px 32px' };
