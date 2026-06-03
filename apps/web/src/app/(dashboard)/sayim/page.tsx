'use client';

import React, { useState } from 'react';
import { trpc } from '@/trpc/client';
import {
  ClipboardCheck,
  Save,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  PlusCircle,
  MinusCircle,
  Search,
} from 'lucide-react';
import ExcelJS from 'exceljs';

interface CountState {
  [productId: string]: number | '';
}

export default function SayimPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [countedQuantities, setCountedQuantities] = useState<CountState>({});
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const utils = trpc.useUtils();

  // Queries
  const productsQuery = trpc.product.getAll.useQuery({ limit: 1000 });
  const stockQuery = trpc.inventory.getStock.useQuery({});

  // Mutation
  const createMovement = trpc.inventory.create.useMutation();

  const isLoading = productsQuery.isLoading || stockQuery.isLoading;

  // Ürünlerin beklenen miktarlarını hesapla (tüm lokasyonlardaki toplam)
  const getExpectedQty = (productId: string) => {
    if (!stockQuery.data) return 0;
    return stockQuery.data
      .filter((item) => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  // Ürünün ilk/birinci lokasyonunu al (ADJUSTMENT hareketi bu lokasyona yapılacak)
  const getProductLocationId = (productId: string) => {
    if (!stockQuery.data) return null;
    const item = stockQuery.data.find((item) => item.productId === productId);
    return item?.locationId || null;
  };

  const filteredProducts = productsQuery.data?.items.filter((p) => {
    const query = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query);
  }) ?? [];

  const handleQtyChange = (productId: string, val: string) => {
    setIsSaved(false);
    setCountedQuantities((prev) => ({
      ...prev,
      [productId]: val === '' ? '' : Number(val),
    }));
  };

  // Envanter Fark Düzeltmelerini Kaydet
  const handleSaveCount = async () => {
    const productsToAdjust = Object.keys(countedQuantities).filter(
      (id) => countedQuantities[id] !== ''
    );

    if (productsToAdjust.length === 0) {
      alert('Lütfen en az bir ürün için sayılan miktar girin.');
      return;
    }

    setIsSaving(true);
    try {
      // Her ayarlanacak ürün için ADJUSTMENT hareketi oluştur
      for (const productId of productsToAdjust) {
        const counted = countedQuantities[productId];
        const expected = getExpectedQty(productId);
        const locationId = getProductLocationId(productId);

        if (counted === '' || counted === expected) continue;

        // Lokasyon yoksa sistemdeki ilk lokasyonu seç
        let targetLocationId = locationId;
        if (!targetLocationId && stockQuery.data && stockQuery.data.length > 0) {
          targetLocationId = stockQuery.data[0].locationId;
        }

        if (!targetLocationId) {
          console.warn(`Ürün için geçerli lokasyon bulunamadı: ${productId}`);
          continue;
        }

        await createMovement.mutateAsync({
          type: 'ADJUSTMENT',
          productId,
          toLocationId: targetLocationId,
          quantity: Number(counted),
          reason: `Stok sayım düzeltmesi (Beklenen: ${expected}, Sayılan: ${counted})`,
        });
      }

      await utils.inventory.getStock.invalidate();
      await utils.product.getAll.invalidate();
      setIsSaved(true);
      alert('Sayım sonuçlarına göre envanter düzeltmeleri başarıyla kaydedildi!');
    } catch (err) {
      console.error('Sayım kaydetme hatası:', err);
      alert('Düzeltmeler kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  // Fark Raporunu Excel'e Aktar
  const handleExportDiscrepancies = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'StockManager';
      const worksheet = workbook.addWorksheet('Sayim_Fark_Raporu');

      worksheet.columns = [
        { header: 'Ürün Adı', key: 'name', width: 25 },
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Beklenen Miktar', key: 'expected', width: 15 },
        { header: 'Sayılan Miktar', key: 'counted', width: 15 },
        { header: 'Fark', key: 'diff', width: 15 },
        { header: 'Durum', key: 'status', width: 15 },
      ];

      filteredProducts.forEach((p) => {
        const expected = getExpectedQty(p.id);
        const countedVal = countedQuantities[p.id];
        const counted = countedVal === '' || countedVal === undefined ? expected : Number(countedVal);
        const diff = counted - expected;
        let status = 'Eşit';
        if (diff > 0) status = 'Fazla';
        if (diff < 0) status = 'Eksik';

        worksheet.addRow({
          name: p.name,
          sku: p.sku,
          expected,
          counted,
          diff,
          status,
        });
      });

      // Header stili
      worksheet.getRow(1).font = { name: 'Arial', family: 4, size: 11, bold: true, color: { argb: 'FFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4F46E5' },
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Stok_Sayim_Fark_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Excel dışa aktarma hatası:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
            <ClipboardCheck className="w-8 h-8 text-indigo-600" />
            Stok Sayım Modu
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Mevcut depo stoklarını sayın, beklenen miktarlarla karşılaştırın ve düzeltme hareketleri oluşturun.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportDiscrepancies}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-250 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800 text-xs font-bold transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            Excel Fark Raporu
          </button>
          <button
            onClick={handleSaveCount}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Kaydediliyor...' : 'Sayımı Kaydet ve Düzelt'}
          </button>
        </div>
      </div>

      {/* Discrepancies Summary Cards */}
      {isSaved && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-emerald-500 shrink-0" />
            <div>
              <p className="text-xs text-zinc-500">Durum</p>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Envanter Güncellendi</h4>
            </div>
          </div>
          <div className="md:border-l md:border-zinc-200 dark:md:border-zinc-800 md:pl-6 flex items-center gap-3">
            <PlusCircle className="w-8 h-8 text-blue-500 shrink-0" />
            <div>
              <p className="text-xs text-zinc-500">Fazla Çıkan Ürünler</p>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {Object.keys(countedQuantities).filter(
                  (id) => countedQuantities[id] !== '' && Number(countedQuantities[id]) > getExpectedQty(id)
                ).length} Kalem
              </h4>
            </div>
          </div>
          <div className="md:border-l md:border-zinc-200 dark:md:border-zinc-800 md:pl-6 flex items-center gap-3">
            <MinusCircle className="w-8 h-8 text-rose-500 shrink-0" />
            <div>
              <p className="text-xs text-zinc-500">Eksik Çıkan Ürünler</p>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {Object.keys(countedQuantities).filter(
                  (id) => countedQuantities[id] !== '' && Number(countedQuantities[id]) < getExpectedQty(id)
                ).length} Kalem
              </h4>
            </div>
          </div>
        </div>
      )}

      {/* Product List for Counting */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center text-zinc-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ürün adı veya SKU ile arayın..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center text-zinc-400">Aradığınız kriterlere uygun ürün bulunamadı.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-600 dark:text-zinc-400 font-medium">
                    <th className="px-6 py-4">Ürün Adı</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4 text-center">Beklenen Miktar</th>
                    <th className="px-6 py-4 text-center w-48">Sayılan Miktar</th>
                    <th className="px-6 py-4 text-center">Fark</th>
                    <th className="px-6 py-4 text-right">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                  {filteredProducts.map((p) => {
                    const expected = getExpectedQty(p.id);
                    const countedVal = countedQuantities[p.id];
                    const hasCounted = countedVal !== '' && countedVal !== undefined;
                    const counted = hasCounted ? Number(countedVal) : expected;
                    const diff = counted - expected;

                    return (
                      <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                        <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-50">{p.name}</td>
                        <td className="px-6 py-4 font-mono text-xs">{p.sku}</td>
                        <td className="px-6 py-4 text-center font-semibold text-zinc-500">{expected} {p.unit}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <input
                              type="number"
                              min={0}
                              value={countedVal ?? ''}
                              onChange={(e) => handleQtyChange(p.id, e.target.value)}
                              placeholder={String(expected)}
                              className="w-28 text-center px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </td>
                        <td className={`px-6 py-4 text-center font-bold ${
                          diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-rose-500' : 'text-zinc-400'
                        }`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {diff === 0 ? (
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-50 text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400 border border-zinc-150 dark:border-zinc-750">
                              Eşit
                            </span>
                          ) : diff > 0 ? (
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                              Fazla
                            </span>
                          ) : (
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                              Eksik
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
