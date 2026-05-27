import ComingSoonPage from '@/components/ComingSoonPage';
import { FileSpreadsheet } from 'lucide-react';

export const metadata = { title: 'Siparişler — StockManager' };

export default function SiparislerPage() {
  return (
    <ComingSoonPage
      title="Sipariş Yönetimi"
      description="Satın alma siparişleri oluşturun, onay akışlarını yönetin ve mal kabulü yapın."
      icon={FileSpreadsheet}
      accentColor="bg-gradient-to-br from-blue-500 to-indigo-600"
      plannedFeatures={[
        'Satın alma siparişi oluşturma (DRAFT → SENT)',
        'Kısmi ve tam mal kabulü',
        'Sipariş onay akışı (çok seviyeli)',
        'PDF sipariş formu',
        'Tedarikçi e-posta bildirimi',
      ]}
    />
  );
}
