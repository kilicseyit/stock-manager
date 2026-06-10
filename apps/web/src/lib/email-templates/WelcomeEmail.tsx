import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export interface WelcomeEmailProps {
  name: string;
  role: string;
  temporaryPassword?: string;
  accentColor?: string;
  senderName?: string;
  footerText?: string;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Süper Yönetici',
  WAREHOUSE_MANAGER: 'Depo Müdürü',
  WAREHOUSE_STAFF: 'Depo Personeli',
  VIEWER: 'Görüntüleyici',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#4f46e5',
  WAREHOUSE_MANAGER: '#0ea5e9',
  WAREHOUSE_STAFF: '#22c55e',
  VIEWER: '#6b7280',
};

export function WelcomeEmail({ name, role, temporaryPassword, accentColor = '#4f46e5', senderName = 'StockManager', footerText = 'StockManager Depo Yönetim Sistemi · Bu e-posta otomatik olarak gönderilmiştir' }: WelcomeEmailProps) {
  const roleLabel = ROLE_LABELS[role] ?? role;
  const roleColor = ROLE_COLORS[role] ?? '#6b7280';

  return (
    <Html lang="tr">
      <Head />
      <Preview>StockManager&apos;a Hoş Geldiniz, {name}!</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={{ ...header, backgroundColor: accentColor }}>
            <Heading style={headerTitle}>{senderName}</Heading>
            <Text style={headerSub}>Depo Yönetim Sistemi</Text>
          </Section>

          <Section style={content}>
            <Heading style={h2}>Hoş Geldiniz, {name}! 👋</Heading>
            <Text style={paragraph}>
              Hesabınız başarıyla oluşturuldu. Sisteme erişim için size atanan rol:
            </Text>

            <Section style={{ ...roleBadge, backgroundColor: roleColor }}>
              <Text style={roleBadgeText}>{roleLabel}</Text>
            </Section>

            {temporaryPassword && (
              <>
                <Text style={paragraph}>Geçici şifreniz:</Text>
                <Section style={passwordBox}>
                  <Text style={passwordText}>{temporaryPassword}</Text>
                </Section>
                <Text style={warning}>
                  ⚠️ İlk girişinizde şifrenizi değiştirmeniz zorunludur.
                </Text>
              </>
            )}

            <Text style={paragraph}>
              Sisteme giriş yaptıktan sonra depo operasyonlarını takip edebilir, stok hareketlerini
              yönetebilir ve raporlara erişebilirsiniz.
            </Text>
          </Section>

          <Hr style={divider} />
          <Text style={footer}>{footerText}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;

// --- Styles ---
const body = { backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif' };
const container = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden' as const, border: '1px solid #e4e4e7' };
const header = { backgroundColor: '#4f46e5', padding: '24px 32px' };
const headerTitle = { color: '#ffffff', margin: '0', fontSize: '24px' };
const headerSub = { color: '#c7d2fe', margin: '4px 0 0', fontSize: '14px' };
const content = { padding: '24px 32px' };
const h2 = { fontSize: '20px', color: '#111827', marginTop: '0' };
const paragraph = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6' };
const roleBadge = { borderRadius: '8px', padding: '12px 20px', margin: '16px 0', display: 'inline-block' as const };
const roleBadgeText = { margin: '0', color: '#ffffff', fontWeight: 'bold' as const, fontSize: '15px' };
const passwordBox = { backgroundColor: '#f3f4f6', border: '1px dashed #d1d5db', borderRadius: '8px', padding: '14px 20px', margin: '8px 0' };
const passwordText = { margin: '0', fontSize: '20px', fontFamily: 'monospace', color: '#111827', letterSpacing: '2px' };
const warning = { fontSize: '13px', color: '#f59e0b', fontWeight: 'bold' as const };
const divider = { borderColor: '#e4e4e7', margin: '0 32px' };
const footer = { fontSize: '11px', color: '#9ca3af', textAlign: 'center' as const, padding: '16px 32px' };
