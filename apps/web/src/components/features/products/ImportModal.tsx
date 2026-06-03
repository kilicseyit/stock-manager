'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { trpc } from '@/trpc/client';
import { useToast } from '@/components/ui/Toast';

interface ImportRow {
  index: number;
  name: string;
  categoryName?: string;
  unit?: string;
  barcode?: string;
  minStock?: number;
  maxStock?: number;
  isValid: boolean;
  error?: string;
}

export default function ImportModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [importResults, setImportResults] = useState<{ index: number; success: boolean; sku?: string; error?: string }[] | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [importOnlyValid, setImportOnlyValid] = useState<boolean>(true);

  const bulkCreate = trpc.product.bulkCreate.useMutation({
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
          showToast('Dosya okunamadı. Lütfen şablonu kullanın.', 'error');
        }
      };
      reader.readAsBinaryString(file);
    } else {
      showToast('Desteklenmeyen dosya formatı. Excel (.xlsx, .xls) veya CSV kullanın.', 'warning');
    }
  };

  const processRows = (data: Record<string, unknown>[]) => {
    const rows: ImportRow[] = [];
    const barcodesSeen = new Set<string>();

    data.forEach((raw, i) => {
      const rowNum = i + 2;

      // Sütun adı eşleşmeleri (Türkçe / İngilizce)
      const name = String(raw['Ürün Adı'] ?? raw['name'] ?? raw['urun_adi'] ?? '').trim();
      const categoryName = String(raw['Kategori'] ?? raw['categoryName'] ?? raw['kategori'] ?? '').trim() || undefined;
      const unit = String(raw['Birim'] ?? raw['unit'] ?? raw['birim'] ?? 'adet').trim();
      const barcode = String(raw['Barkod'] ?? raw['barcode'] ?? raw['barkod'] ?? '').trim() || undefined;
      const minStockRaw = raw['Min Stok'] ?? raw['minStock'] ?? raw['min_stok'] ?? 0;
      const maxStockRaw = raw['Max Stok'] ?? raw['maxStock'] ?? raw['max_stok'];

      let isValid = true;
      let error = '';

      // Validation
      if (!name) {
        isValid = false;
        error = 'Ürün adı boş olamaz.';
      }

      const minStock = Number(minStockRaw);
      if (isNaN(minStock) || minStock < 0) {
        isValid = false;
        error = error ? `${error} Min stok 0 veya daha büyük bir sayı olmalı.` : 'Min stok 0 veya daha büyük bir sayı olmalı.';
      }

      let maxStock: number | undefined = undefined;
      if (maxStockRaw !== undefined && maxStockRaw !== null && String(maxStockRaw).trim() !== '') {
        maxStock = Number(maxStockRaw);
        if (isNaN(maxStock) || maxStock < 0) {
          isValid = false;
          error = error ? `${error} Max stok geçerli bir pozitif sayı olmalı.` : 'Max stok geçerli bir pozitif sayı olmalı.';
        } else if (maxStock < minStock) {
          isValid = false;
          error = error ? `${error} Max stok min stoktan küçük olamaz.` : 'Max stok min stoktan küçük olamaz.';
        }
      }

      if (barcode) {
        if (barcodesSeen.has(barcode)) {
          isValid = false;
          error = error ? `${error} Dosya içinde mükerrer barkod: ${barcode}.` : `Dosya içinde mükerrer barkod: ${barcode}.`;
        } else {
          barcodesSeen.add(barcode);
        }
      }

      rows.push({
        index: rowNum,
        name,
        categoryName,
        unit,
        barcode,
        minStock: isNaN(minStock) ? 0 : minStock,
        maxStock,
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
      showToast('İçe aktarılacak geçerli satır bulunmuyor.', 'warning');
      return;
    }

    bulkCreate.mutate({
      products: rowsToImport.map((r) => ({
        name: r.name,
        categoryName: r.categoryName,
        unit: r.unit ?? 'adet',
        barcode: r.barcode,
        minStock: r.minStock ?? 0,
        maxStock: r.maxStock,
      })),
    });
  };

  // Excel Şablonu İndir (Örnek verilerle doldurulmuş)
  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'StockManager';
    const worksheet = workbook.addWorksheet('Urun_Sablonu');

    worksheet.columns = [
      { header: 'Ürün Adı', key: 'name', width: 25 },
      { header: 'Kategori', key: 'categoryName', width: 20 },
      { header: 'Birim', key: 'unit', width: 12 },
      { header: 'Barkod', key: 'barcode', width: 18 },
      { header: 'Min Stok', key: 'minStock', width: 12 },
      { header: 'Max Stok', key: 'maxStock', width: 12 },
    ];

    // Örnek Veri Ekle
    worksheet.addRow({ name: 'Akıllı Saat X', categoryName: 'Elektronik', unit: 'adet', barcode: '8680000000990', minStock: 5, maxStock: 50 });
    worksheet.addRow({ name: 'Ofis Çalışma Masası', categoryName: 'Mobilya', unit: 'adet', barcode: '8680000000991', minStock: 2, maxStock: 20 });
    worksheet.addRow({ name: 'A4 Kağıt 80g', categoryName: 'Kırtasiye', unit: 'paket', barcode: '8680000000992', minStock: 10, maxStock: 100 });

    // Header stili
    worksheet.getRow(1).font = { name: 'Arial', family: 4, size: 11, bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '10B981' }, // Yeşil başlık
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'urun_ithalat_sablonu.xlsx';
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
              Toplu Ürün İçe Aktarma (Gelişmiş)
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
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Ürün Şablon Dosyası</p>
                  <p className="text-xs text-zinc-500">Doğru kolon yapısı ve örnek verileri içeren şablonu indirin.</p>
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
                    Dosyadaki hatalı satırları atla, sadece geçerli olan {totalValid} ürünü içe aktar.
                  </label>
                </div>
              )}

              {/* Preview table with Validation status */}
              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-3 py-3 text-center">Satır</th>
                      <th className="px-3 py-3">Ürün Adı</th>
                      <th className="px-3 py-3">Kategori</th>
                      <th className="px-3 py-3">Birim</th>
                      <th className="px-3 py-3">Barkod</th>
                      <th className="px-3 py-3 text-right">Min</th>
                      <th className="px-3 py-3 text-right">Max</th>
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
                        <td className="px-3 py-2 font-semibold">{row.name || '—'}</td>
                        <td className="px-3 py-2">{row.categoryName || '—'}</td>
                        <td className="px-3 py-2 text-xs">{row.unit}</td>
                        <td className="px-3 py-2 font-mono">{row.barcode || '—'}</td>
                        <td className="px-3 py-2 text-right font-semibold">{row.minStock}</td>
                        <td className="px-3 py-2 text-right font-semibold">{row.maxStock || '—'}</td>
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
                  disabled={bulkCreate.isPending || (totalErrors > 0 && !importOnlyValid)}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-750 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-indigo-650/20"
                >
                  {bulkCreate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {importOnlyValid ? `${totalValid} Adet Geçerli Satırı İçe Aktar` : `${parsedRows.length} Adet Ürünü İçe Aktar`}
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
                    Ürün içe aktarma işlemi tamamlandı.
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    {importResults.filter((r) => r.success).length} başarılı envanter kaydı, {importResults.filter((r) => !r.success).length} hatalı kayıt.
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
