'use client';

import React, { useState } from 'react';
import { trpc } from '@/trpc/client';
import {
  FileSpreadsheet,
  FileText,
  Boxes,
  Truck,
  ArrowRightLeft,
  Calendar,
  Download,
  Filter,
} from 'lucide-react';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportTab = 'stock' | 'movement' | 'supplier';

export default function RaporlarPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('stock');

  // Stok Hareket Raporu Filtreleri
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [movementType, setMovementType] = useState<string>('');

  const utils = trpc.useUtils();

  // Queries
  const importLogsQuery = trpc.analytics.getImportLogs.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const stockReportQuery = trpc.analytics.getStockStatusReport.useQuery(undefined, {
    enabled: activeTab === 'stock',
    refetchOnWindowFocus: false,
  });

  const movementReportQuery = trpc.analytics.getStockMovementReport.useQuery(
    {
      startDate: startDate || null,
      endDate: endDate || null,
      type: (movementType as any) || null,
    },
    {
      enabled: activeTab === 'movement',
      refetchOnWindowFocus: false,
    }
  );

  const supplierReportQuery = trpc.analytics.getSupplierPerformanceReport.useQuery(undefined, {
    enabled: activeTab === 'supplier',
    refetchOnWindowFocus: false,
  });

  const isLoading =
    (activeTab === 'stock' && stockReportQuery.isLoading) ||
    (activeTab === 'movement' && movementReportQuery.isLoading) ||
    (activeTab === 'supplier' && supplierReportQuery.isLoading);

  // Gelişmiş Çoklu Sayfa Excel Export
  const handleExportMultiSheetExcel = async () => {
    try {
      const [snapshotData, movementData, supplierData] = await Promise.all([
        utils.client.analytics.getStockSnapshot.query(),
        utils.client.analytics.getStockMovementReport.query({
          startDate: startDate || null,
          endDate: endDate || null,
          type: (movementType as any) || null,
        }),
        utils.client.analytics.getSupplierPerformanceReport.query(),
      ]);

      const workbook = new ExcelJS.Workbook();

      // Sheet 1: Stok Snapshot
      const ws1 = workbook.addWorksheet('Stok Snapshot');
      ws1.columns = [
        { header: 'Ürün Adı', key: 'productName', width: 25 },
        { header: 'SKU', key: 'productSku', width: 15 },
        { header: 'Depo Lokasyonu', key: 'location', width: 20 },
        { header: 'Mevcut Miktar', key: 'quantity', width: 15 },
        { header: 'Rezerve Miktar', key: 'reservedQty', width: 15 },
        { header: 'Birim', key: 'unit', width: 10 },
      ];
      snapshotData.forEach((row) => ws1.addRow(row));
      ws1.getRow(1).font = { name: 'Arial', family: 4, size: 11, bold: true, color: { argb: 'FFFFFF' } };
      ws1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };

      // Sheet 2: Stok Hareketleri
      const ws2 = workbook.addWorksheet('Stok Hareketleri');
      ws2.columns = [
        { header: 'Tarih', key: 'date', width: 20 },
        { header: 'Hareket Türü', key: 'type', width: 12 },
        { header: 'Ürün Adı', key: 'productName', width: 25 },
        { header: 'SKU', key: 'productSku', width: 15 },
        { header: 'Miktar', key: 'quantity', width: 12 },
        { header: 'Kaynak Lokasyon', key: 'fromLocation', width: 18 },
        { header: 'Hedef Lokasyon', key: 'toLocation', width: 18 },
        { header: 'Kullanıcı', key: 'userName', width: 18 },
        { header: 'Açıklama', key: 'reason', width: 25 },
      ];
      movementData.forEach((m) => {
        ws2.addRow({
          ...m,
          date: new Date(m.createdAt).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
      });
      ws2.getRow(1).font = { name: 'Arial', family: 4, size: 11, bold: true, color: { argb: 'FFFFFF' } };
      ws2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };

      // Sheet 3: Tedarikçi Performansı
      const ws3 = workbook.addWorksheet('Tedarikçi Performansı');
      ws3.columns = [
        { header: 'Tedarikçi Adı', key: 'name', width: 25 },
        { header: 'İletişim Kişisi', key: 'contactName', width: 20 },
        { header: 'E-posta', key: 'email', width: 22 },
        { header: 'Telefon', key: 'phone', width: 15 },
        { header: 'Değerlendirme (Puan)', key: 'rating', width: 20 },
        { header: 'Toplam Sipariş', key: 'totalOrders', width: 15 },
        { header: 'Teslim Oranı (%)', key: 'fulfillmentRate', width: 18 },
        { header: 'Toplam Harcama (₺)', key: 'totalSpent', width: 20 },
      ];
      supplierData.forEach((row) => ws3.addRow(row));
      ws3.getRow(1).font = { name: 'Arial', family: 4, size: 11, bold: true, color: { argb: 'FFFFFF' } };
      ws3.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };

      // Buffer yaz ve indir
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `Gelismis_Depo_Raporu_${dateStr}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Çoklu sayfa Excel export hatası:', err);
    }
  };

  // Excel Export
  const handleExportExcel = async () => {
    try {
      if (activeTab === 'stock' && stockReportQuery.data) {
        const data = stockReportQuery.data;
        const columns = [
          { header: 'Ürün Adı', key: 'name', width: 25 },
          { header: 'SKU', key: 'sku', width: 15 },
          { header: 'Kategori', key: 'categoryName', width: 18 },
          { header: 'Mevcut Stok', key: 'currentStock', width: 15 },
          { header: 'Birim', key: 'unit', width: 10 },
          { header: 'Min Stok', key: 'minStock', width: 12 },
          { header: 'Max Stok', key: 'maxStock', width: 12 },
        ];
        await generateExcel('Stok Durum Raporu', columns, data);
      } else if (activeTab === 'movement' && movementReportQuery.data) {
        const data = movementReportQuery.data.map((m) => ({
          ...m,
          date: new Date(m.createdAt).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        }));
        const columns = [
          { header: 'Tarih', key: 'date', width: 20 },
          { header: 'Tür', key: 'type', width: 12 },
          { header: 'Ürün Adı', key: 'productName', width: 25 },
          { header: 'SKU', key: 'productSku', width: 15 },
          { header: 'Miktar', key: 'quantity', width: 12 },
          { header: 'Kaynak Lokasyon', key: 'fromLocation', width: 18 },
          { header: 'Hedef Lokasyon', key: 'toLocation', width: 18 },
          { header: 'Kullanıcı', key: 'userName', width: 18 },
          { header: 'Açıklama', key: 'reason', width: 25 },
        ];
        await generateExcel('Stok Hareket Raporu', columns, data);
      } else if (activeTab === 'supplier' && supplierReportQuery.data) {
        const data = supplierReportQuery.data;
        const columns = [
          { header: 'Tedarikçi Adı', key: 'name', width: 25 },
          { header: 'İletişim Kişisi', key: 'contactName', width: 20 },
          { header: 'E-posta', key: 'email', width: 22 },
          { header: 'Telefon', key: 'phone', width: 15 },
          { header: 'Değerlendirme (Yıldız)', key: 'rating', width: 15 },
          { header: 'Toplam Sipariş', key: 'totalOrders', width: 15 },
          { header: 'Teslim Oranı (%)', key: 'fulfillmentRate', width: 18 },
          { header: 'Toplam Harcama (₺)', key: 'totalSpent', width: 20 },
        ];
        await generateExcel('Tedarikci Performans Raporu', columns, data);
      }
    } catch (err) {
      console.error('Excel export hatası:', err);
    }
  };

  const generateExcel = async (title: string, columns: any[], rows: any[]) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title);

    worksheet.columns = columns;

    rows.forEach((row) => {
      worksheet.addRow(row);
    });

    // Stil Ekle (Header)
    worksheet.getRow(1).font = { name: 'Arial', family: 4, size: 11, bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F46E5' },
    };

    // Buffer yaz ve indir
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // PDF Export
  const handleExportPDF = () => {
    if (activeTab === 'stock' && stockReportQuery.data) {
      const headers = [['Ürün Adı', 'SKU', 'Kategori', 'Mevcut Stok', 'Birim', 'Min Stok', 'Max Stok']];
      const rows = stockReportQuery.data.map((r) => [
        r.name,
        r.sku,
        r.categoryName,
        r.currentStock,
        r.unit,
        r.minStock,
        r.maxStock || '—',
      ]);
      generatePDF('Stok Durum Raporu', headers, rows);
    } else if (activeTab === 'movement' && movementReportQuery.data) {
      const headers = [
        ['Tarih', 'Tür', 'Ürün Adı', 'SKU', 'Miktar', 'Kaynak', 'Hedef', 'Kullanıcı', 'Açıklama'],
      ];
      const rows = movementReportQuery.data.map((r) => [
        new Date(r.createdAt).toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        r.type,
        r.productName,
        r.productSku,
        r.quantity,
        r.fromLocation,
        r.toLocation,
        r.userName,
        r.reason,
      ]);
      generatePDF('Stok Hareket Raporu', headers, rows);
    } else if (activeTab === 'supplier' && supplierReportQuery.data) {
      const headers = [
        [
          'Tedarikçi Adı',
          'İletişim Kişisi',
          'E-posta',
          'Telefon',
          'Puan',
          'Sipariş',
          'Teslim (%)',
          'Toplam Harcama',
        ],
      ];
      const rows = supplierReportQuery.data.map((r) => [
        r.name,
        r.contactName,
        r.email,
        r.phone,
        `${r.rating}★`,
        r.totalOrders,
        `%${r.fulfillmentRate}`,
        `₺${r.totalSpent.toLocaleString('tr-TR')}`,
      ]);
      generatePDF('Tedarikçi Performans Raporu', headers, rows);
    }
  };

  const generatePDF = (title: string, head: string[][], body: any[][]) => {
    const doc = new jsPDF();
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Tarih: ${new Date().toLocaleString('tr-TR')}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head,
      body,
      theme: 'striped',
      styles: { fontSize: 7.5, font: 'Helvetica' },
      headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
    });

    doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case 'IN':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30';
      case 'OUT':
        return 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30';
      case 'TRANSFER':
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30';
      case 'ADJUSTMENT':
        return 'bg-zinc-50 text-zinc-650 dark:bg-zinc-800/30 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800/30';
      default:
        return 'bg-zinc-100 text-zinc-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Raporlar ve Dışa Aktarma
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Depo durum, envanter hareket ve tedarikçi performans raporlarını görüntüleyin, Excel/PDF formatında indirin.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-850 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'stock'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Stok Durum Raporu
        </button>
        <button
          onClick={() => setActiveTab('movement')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'movement'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          Stok Hareket Raporu
        </button>
        <button
          onClick={() => setActiveTab('supplier')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'supplier'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <Truck className="w-4 h-4" />
          Tedarikçi Performansı
        </button>
      </div>

      {/* Filters (only for stock movement tab) */}
      {activeTab === 'movement' && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 backdrop-blur-xl">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-800 text-xs rounded-lg focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Bitiş Tarihi
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-800 text-xs rounded-lg focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Hareket Türü
            </label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-800 text-xs rounded-lg focus:outline-none"
            >
              <option value="">Tümü</option>
              <option value="IN">Giriş (IN)</option>
              <option value="OUT">Çıkış (OUT)</option>
              <option value="TRANSFER">Transfer</option>
              <option value="ADJUSTMENT">Düzeltme</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setMovementType('');
              }}
              className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-600 dark:text-zinc-350 text-xs font-semibold rounded-lg transition-colors"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      )}

      {/* Export Options & Report Summary Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 backdrop-blur-xl">
        <div className="text-xs">
          <span className="text-zinc-500">Rapor Tipi:</span>
          <span className="block font-bold text-zinc-900 dark:text-zinc-50 text-sm mt-0.5">
            {activeTab === 'stock'
              ? 'Stok Durum Detayları'
              : activeTab === 'movement'
              ? 'Envanter Giriş/Çıkış Hareket Kayıtları'
              : 'Tedarikçi Satın Alma & Teslimat Performansı'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportMultiSheetExcel}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800 text-xs font-bold rounded-lg transition-colors shadow-md shadow-emerald-600/10 active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            Çoklu Sayfa Excel (.xlsx)
          </button>
          <button
            onClick={handleExportExcel}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 border border-zinc-250 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            Excel İndir (.xlsx)
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 border border-zinc-250 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-rose-500" />
            PDF İndir (.pdf)
          </button>
        </div>
      </div>

      {/* Report Table Display */}
      <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
            ))}
          </div>
        ) : activeTab === 'stock' && stockReportQuery.data ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-600 dark:text-zinc-400 font-medium">
                  <th className="px-6 py-4">Ürün Adı</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4 text-center">Mevcut Stok</th>
                  <th className="px-6 py-4">Birim</th>
                  <th className="px-6 py-4 text-center">Kritik Limit</th>
                  <th className="px-6 py-4 text-center">Maksimum Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                {stockReportQuery.data.map((r) => (
                  <tr key={r.sku} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-50">{r.name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{r.sku}</td>
                    <td className="px-6 py-4">{r.categoryName}</td>
                    <td className={`px-6 py-4 text-center font-bold ${
                      r.currentStock <= r.minStock && r.minStock > 0 ? 'text-rose-500' : 'text-zinc-900 dark:text-zinc-100'
                    }`}>
                      {r.currentStock}
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{r.unit}</td>
                    <td className="px-6 py-4 text-center text-zinc-550">{r.minStock}</td>
                    <td className="px-6 py-4 text-center text-zinc-550">{r.maxStock || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'movement' && movementReportQuery.data ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-600 dark:text-zinc-400 font-medium">
                  <th className="px-6 py-4">Tarih</th>
                  <th className="px-6 py-4">Tür</th>
                  <th className="px-6 py-4">Ürün / SKU</th>
                  <th className="px-6 py-4 text-right">Miktar</th>
                  <th className="px-6 py-4">Kaynak</th>
                  <th className="px-6 py-4">Hedef</th>
                  <th className="px-6 py-4">Kullanıcı</th>
                  <th className="px-6 py-4">Açıklama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                {movementReportQuery.data.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 text-zinc-500 text-xs">
                      {new Date(r.createdAt).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getMovementTypeBadge(r.type)}`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{r.productName}</p>
                      <p className="text-[10px] text-zinc-400 font-mono">{r.productSku}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">{r.quantity}</td>
                    <td className="px-6 py-4 text-xs font-mono text-zinc-500">{r.fromLocation}</td>
                    <td className="px-6 py-4 text-xs font-mono text-zinc-500">{r.toLocation}</td>
                    <td className="px-6 py-4 text-xs">{r.userName}</td>
                    <td className="px-6 py-4 text-xs text-zinc-500 max-w-[150px] truncate" title={r.reason}>
                      {r.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'supplier' && supplierReportQuery.data ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-600 dark:text-zinc-400 font-medium">
                  <th className="px-6 py-4">Tedarikçi Adı</th>
                  <th className="px-6 py-4">İletişim Kişisi</th>
                  <th className="px-6 py-4">Telefon</th>
                  <th className="px-6 py-4 text-center">Puan</th>
                  <th className="px-6 py-4 text-center">Toplam Sipariş</th>
                  <th className="px-6 py-4 text-center">Teslimat Başarısı</th>
                  <th className="px-6 py-4 text-right">Toplam Harcama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                {supplierReportQuery.data.map((r) => (
                  <tr key={r.name} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-50">{r.name}</td>
                    <td className="px-6 py-4">{r.contactName}</td>
                    <td className="px-6 py-4 text-xs">{r.phone}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-1 text-amber-500 font-bold">
                        <span>{r.rating}</span>
                        <span className="text-xs">★</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold">{r.totalOrders}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">%{r.fulfillmentRate}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-zinc-900 dark:text-zinc-50">
                      ₺{r.totalSpent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {/* Import History Section */}
      <div className="space-y-4 pt-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
            İçe Aktarma Geçmişi
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Toplu ürün ve stok hareketi yükleme işlemlerine ait geçmiş kayıtlar.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl overflow-hidden shadow-sm">
          {importLogsQuery.isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
              ))}
            </div>
          ) : !importLogsQuery.data || importLogsQuery.data.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Henüz içe aktarma işlemi gerçekleştirilmemiş.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-600 dark:text-zinc-400 font-medium text-xs">
                    <th className="px-6 py-3.5">Tarih</th>
                    <th className="px-6 py-3.5">İşlem Türü</th>
                    <th className="px-6 py-3.5">Kullanıcı</th>
                    <th className="px-6 py-3.5 text-center">Toplam Satır</th>
                    <th className="px-6 py-3.5 text-center">Başarılı</th>
                    <th className="px-6 py-3.5 text-center">Hatalı</th>
                    <th className="px-6 py-3.5 text-right">Başarı Oranı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                  {importLogsQuery.data.map((log: any) => {
                    const rate = log.totalRows > 0 ? Math.round((log.successRows / log.totalRows) * 100) : 0;
                    return (
                      <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors">
                        <td className="px-6 py-3.5 text-xs text-zinc-500">
                          {new Date(log.createdAt).toLocaleDateString('tr-TR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-3.5">
                          {log.type === 'PRODUCT' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                              Ürün İthalatı
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400 border border-teal-100 dark:border-teal-900/30">
                              Stok Hareketi
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 font-medium">{log.user?.name || 'Sistem'}</td>
                        <td className="px-6 py-3.5 text-center font-bold">{log.totalRows}</td>
                        <td className="px-6 py-3.5 text-center text-emerald-600 dark:text-emerald-400 font-bold">
                          {log.successRows}
                        </td>
                        <td className={`px-6 py-3.5 text-center font-bold ${log.errorRows > 0 ? 'text-rose-500' : 'text-zinc-400'}`}>
                          {log.errorRows}
                        </td>
                        <td className="px-6 py-3.5 text-right font-bold">
                          <span className={rate === 100 ? 'text-emerald-600 dark:text-emerald-400' : rate > 50 ? 'text-amber-500' : 'text-rose-500'}>
                            %{rate}
                          </span>
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
