import ComingSoonPage from '@/components/ComingSoonPage';
import { BarChart3 } from 'lucide-react';

export const metadata = { title: 'Raporlar — StockManager' };

export default function RaporlarPage() {
  return (
    <ComingSoonPage
      title="Raporlar & Analitik"
      description="Depo performansını analiz edin, stok rotasyonunu izleyin ve özelleştirilmiş raporlar oluşturun."
      icon={BarChart3}
      accentColor="bg-gradient-to-br from-purple-500 to-violet-600"
      plannedFeatures={[
        'Stok devir hızı raporu',
        'ABC analizi (değer bazlı)',
        'Hareket özeti (günlük/haftalık/aylık)',
        'Düşük stok trend analizi',
        'Excel ve PDF export',
      ]}
    />
  );
}
