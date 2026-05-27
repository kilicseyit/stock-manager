import ComingSoonPage from '@/components/ComingSoonPage';
import { Truck } from 'lucide-react';

export const metadata = { title: 'Tedarikçiler — StockManager' };

export default function TedarikcilerPage() {
  return (
    <ComingSoonPage
      title="Tedarikçi Yönetimi"
      description="Tedarikçilerinizi kaydedin, performanslarını takip edin ve satın alma siparişlerinizi yönetin."
      icon={Truck}
      accentColor="bg-gradient-to-br from-emerald-500 to-teal-600"
      plannedFeatures={[
        'Tedarikçi kayıt ve düzenleme',
        'Tedarikçi bazlı sipariş geçmişi',
        'Performans puanlaması',
        'Otomatik sipariş tetikleyicisi (düşük stok)',
        'Toplu CSV import',
      ]}
    />
  );
}
