'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { trpc } from '@/trpc/client';

interface ImportRow {
  index: number;
  sku: string;
  zone: string;
  quantity: number;
  type: string;
  reason?: string;
  isValid: boolean;
  error?: string;
}

export default function StockMovementImportModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [importResults, setImportResults] = useState<{ index: number; success: boolean; error?: string }[] | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [importOnlyValid, setImportOnlyValid] = useState<boolean>(true);

  const bulkCreateMovements = trpc.inventory.bulkCreateMovements.useMutation({
    onSuccess: (data) => {
      setImportResults(data.results);
      setStep('result');
      if (data.successCount > 0) {
        onSuccess();
      }
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParsedRows([]);
    setImportResults(null);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
          processRows(jsonData);
        } catch (err) {
          alert('Dosya okunamadı. Lütfen şablonu kullanın.');
        }
      };
      reader.readAsBinaryString(file);
    } else {
      alert('Desteklenmeyen dosya formatı. Excel (.xlsx, .xls) veya CSV kullanın.');
    }
  };

  const processRows = (data: Record<string, unknown>[]) => {
    const rows: ImportRow[] = [];

    data.forEach((raw, i) => {
      const rowNum = i + 2;

      // Sütun adı eşleşmeleri
      const sku = String(raw['ProductSKU'] ?? raw['sku'] ?? raw['Ürün SKU'] ?? raw['urun_sku'] ?? '').trim();
      const zone = String(raw['LocationZone'] ?? raw['zone'] ?? raw['Depo Raf Bölgesi'] ?? raw['lokasyon_bolgesi'] ?? '').trim();
      const quantityRaw = raw['Quantity'] ?? raw['quantity'] ?? raw['Miktar'] ?? raw['miktar'];
      const type = String(raw['Type'] ?? raw['type'] ?? raw['Hareket Türü'] ?? raw['hareket_turu'] ?? '').trim().toUpperCase();
      const reason = String(raw['Reason'] ?? raw['reason'] ?? raw['Açıklama'] ?? raw['aciklama'] ?? '').trim() || undefined;

      let isValid = true;
      let error = '';

      if (!sku) {
        isValid = false;
        error = 'Ürün SKU boş olamaz.';
      }

      if (!zone) {
        isValid = false;
        error = error ? `${error} Lokasyon bölgesi (Zone) boş olamaz.` : 'Lokasyon bölgesi (Zone) boş olamaz.';
      }

      const quantity = Number(quantityRaw);
      if (isNaN(quantity) || quantity <= 0) {
        isValid = false;
        error = error ? `${error} Miktar sıfırdan büyük bir sayı olmalı.` : 'Miktar sıfırdan büyük bir sayı olmalı.';
      }

      if (!type || !['IN', 'OUT', 'ADJUSTMENT'].includes(type)) {
        isValid = false;
        error = error
          ? `${error} Geçersiz hareket türü (${type || 'Boş'}). Sadece IN, OUT veya ADJUSTMENT olmalıdır.`
          : `Geçersiz hareket türü (${type || 'Boş'}). Sadece IN, OUT veya ADJUSTMENT olmalıdır.`;
      }

      rows.push({
        index: rowNum,
        sku,
        zone,
        quantity: isNaN(quantity) ? 0 : quantity,
        type,
        reason,
        isValid,
        error: error || undefined,
      });
    });

    setParsedRows(rows);
    setStep(rows.length > 0 ? 'preview' : 'upload');
  };

  const handleImport = () => {
    const rowsToImport = importOnlyValid ? parsedRows.filter((r) => r.isValid) : parsedRows;

    if (rowsToImport.length === 0) {
      alert('İçe aktarılacak geçerli satır bulunmuyor.');
      return;
    }

    bulkCreateMovements.mutate({
      movements: rowsToImport.map((r) => ({
        sku: r.sku,
        zone: r.zone,
        quantity: r.quantity,
        type: r.type as 'IN' | 'OUT' | 'ADJUSTMENT',
        reason: r.reason,
      })),
    });
  };

  // Excel Şablonu İndir
  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Stok_Hareketi_Sablonu');

    worksheet.columns = [
      { header: 'ProductSKU', key: 'sku', width: 18 },
      { header: 'LocationZone', key: 'zone', width: 18 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Reason', key: 'reason', width: 25 },
    ];

    // Örnek Veriler Ekle
    worksheet.addRow({ sku: 'SM-000001', zone: 'A', quantity: 15, type: 'IN', reason: 'Toplu sayım girişi' });
    worksheet.addRow({ sku: 'SM-000002', zone: 'B', quantity: 2, type: 'OUT', reason: 'Ofis içi tüketim çıkışı' });
    worksheet.addRow({ sku: 'SM-000003', zone: 'A', quantity: 5, type: 'ADJUSTMENT', reason: 'Envanter düzeltme' });

    // Header stili (Yeşil)
    worksheet.getRow(1).font = { name: 'Arial', family: 4, size: 11, bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '10B981' },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stok_hareket_ithalat_sablonu.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setParsedRows([]);
    setImportResults(null);
    setFileName('');
    setStep('upload');
    onClose();
  };

  const totalErrors = parsedRows.filter((r) => !r.isValid).length;
  const totalValid = parsedRows.filter((r) => r.isValid).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-3xl mx-4 max-h-[85vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-zinc-150 dark:border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Toplu Stok Hareketi İçe Aktarma
            </h2>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/20 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Stok Hareketi Şablonu</p>
                  <p className="text-xs text-zinc-500">Doğru kolon yapısı ve örnek hareketleri içeren şablonu indirin.</p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 px-4 py-2 border border-emerald-250 hover:bg-emerald-50 dark:border-emerald-900/50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Şablon Excel İndir
                </button>
              </div>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-750 rounded-2xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/20 transition-all text-center"
              >
                <Upload className="w-10 h-10 text-zinc-300 dark:text-zinc-650 mb-3" />
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Excel veya CSV dosyasını seçin
                </p>
                <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-1">
                  Desteklenen formatlar: .xlsx, .xls, .csv
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-zinc-50 dark:bg-zinc-800/10 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850">
                <div>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-205">{fileName}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Bulunan: {parsedRows.length} satır | Geçerli: {totalValid} | Hatalı: {totalErrors}
                  </p>
                </div>
                <button
                  onClick={() => { setStep('upload'); setParsedRows([]); setFileName(''); }}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Farklı dosya seç
                </button>
              </div>

              {/* Import Options Checkbox */}
              {totalErrors > 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <label className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importOnlyValid}
                      onChange={(e) => setImportOnlyValid(e.target.checked)}
                      className="rounded text-indigo-650 focus:ring-indigo-500"
                    />
                    Hatalı satırları atla, sadece geçerli olan {totalValid} hareketi içe aktar.
                  </label>
                </div>
              )}

              {/* Preview table */}
              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-3 py-3 text-center">Satır</th>
                      <th className="px-3 py-3">Ürün SKU</th>
                      <th className="px-3 py-3">Lokasyon Rafı (Zone)</th>
                      <th className="px-3 py-3 text-center">Miktar</th>
                      <th className="px-3 py-3 text-center">Tür</th>
                      <th className="px-3 py-3">Açıklama</th>
                      <th className="px-3 py-3">Doğrulama Durumu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                    {parsedRows.map((row, i) => (
                      <tr
                        key={i}
                        className={`transition-colors ${
                          row.isValid
                            ? 'bg-emerald-50/20 dark:bg-emerald-950/5 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50/40'
                            : 'bg-rose-50/20 dark:bg-rose-950/5 text-rose-800 dark:text-rose-400 hover:bg-rose-50/40'
                        }`}
                      >
                        <td className="px-3 py-2 text-center font-mono font-semibold">{row.index}</td>
                        <td className="px-3 py-2 font-mono font-semibold">{row.sku || '—'}</td>
                        <td className="px-3 py-2 font-semibold">{row.zone || '—'}</td>
                        <td className="px-3 py-2 text-center font-semibold">{row.quantity}</td>
                        <td className="px-3 py-2 text-center font-bold text-xs">{row.type || '—'}</td>
                        <td className="px-3 py-2 text-zinc-500 max-w-[150px] truncate" title={row.reason}>{row.reason || '—'}</td>
                        <td className="px-3 py-2">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-100">
                              Hazır
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full border border-rose-100" title={row.error}>
                              Hata: {row.error}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-800/80">
                <button onClick={handleClose} className="px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 rounded-xl transition-all">
                  İptal
                </button>
                <button
                  onClick={handleImport}
                  disabled={bulkCreateMovements.isPending || (totalErrors > 0 && !importOnlyValid)}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-750 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-indigo-650/20"
                >
                  {bulkCreateMovements.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {importOnlyValid ? `${totalValid} Adet Hareketi İçe Aktar` : `${parsedRows.length} Adet Hareketi İçe Aktar`}
                </button>
              </div>
            </div>
          )}

          {/* Result Step */}
          {step === 'result' && importResults && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    Stok hareketi içe aktarma işlemi tamamlandı.
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    {importResults.filter((r) => r.success).length} başarılı envanter hareketi, {importResults.filter((r) => !r.success).length} hatalı işlem.
                  </p>
                </div>
              </div>

              {/* Error details table */}
              {importResults.some((r) => !r.success) && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Veritabanı Hata Detayları</h3>
                  <div className="overflow-x-auto rounded-xl border border-red-100 dark:border-red-900/30">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-red-50 dark:bg-red-950/20 text-red-600 font-bold uppercase text-[9px]">
                        <tr>
                          <th className="px-3 py-2 text-center w-16">Satır</th>
                          <th className="px-3 py-2">Hata Açıklaması</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-50 dark:divide-red-900/20 text-rose-800 dark:text-rose-400">
                        {importResults.filter((r) => !r.success).map((r) => (
                          <tr key={r.index}>
                            <td className="px-3 py-2 text-center font-mono font-bold">{r.index + 2}</td>
                            <td className="px-3 py-2">{r.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-zinc-150 dark:border-zinc-800/80">
                <button onClick={handleClose} className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20">
                  Kapat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
