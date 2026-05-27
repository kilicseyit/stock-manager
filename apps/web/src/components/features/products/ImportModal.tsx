'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { trpc } from '@/trpc/client';

interface ImportRow {
  name: string;
  categoryName?: string;
  unit?: string;
  barcode?: string;
  minStock?: number;
  maxStock?: number;
}

interface ParseError {
  row: number;
  message: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [importResults, setImportResults] = useState<{ index: number; success: boolean; sku?: string; error?: string }[] | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');

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
    setParseErrors([]);
    setParsedRows([]);
    setImportResults(null);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processRows(results.data);
        },
        error: () => {
          setParseErrors([{ row: 0, message: 'CSV dosyası okunamadı.' }]);
        },
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
          processRows(jsonData);
        } catch {
          setParseErrors([{ row: 0, message: 'Excel dosyası okunamadı.' }]);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      setParseErrors([{ row: 0, message: 'Desteklenmeyen dosya formatı. CSV veya Excel (.xlsx) kullanın.' }]);
    }
  };

  const processRows = (data: Record<string, unknown>[]) => {
    const rows: ImportRow[] = [];
    const errors: ParseError[] = [];

    data.forEach((raw, i) => {
      const rowNum = i + 2; // Header = satır 1

      // Alan adı eşleme (Türkçe / İngilizce)
      const name = String(raw['name'] ?? raw['Ürün Adı'] ?? raw['urun_adi'] ?? '').trim();
      const categoryName = String(raw['categoryName'] ?? raw['Kategori'] ?? raw['kategori'] ?? '').trim() || undefined;
      const unit = String(raw['unit'] ?? raw['Birim'] ?? raw['birim'] ?? 'adet').trim();
      const barcode = String(raw['barcode'] ?? raw['Barkod'] ?? raw['barkod'] ?? '').trim() || undefined;
      const minStockRaw = raw['minStock'] ?? raw['Min Stok'] ?? raw['min_stok'] ?? 0;
      const maxStockRaw = raw['maxStock'] ?? raw['Max Stok'] ?? raw['max_stok'];

      if (!name) {
        errors.push({ row: rowNum, message: 'Ürün adı boş olamaz.' });
        return;
      }

      const minStock = Number(minStockRaw) || 0;
      const maxStock = maxStockRaw ? Number(maxStockRaw) || undefined : undefined;

      rows.push({ name, categoryName, unit, barcode, minStock, maxStock });
    });

    setParsedRows(rows);
    setParseErrors(errors);
    setStep(rows.length > 0 ? 'preview' : 'upload');
  };

  const handleImport = () => {
    if (parsedRows.length === 0) return;
    bulkCreate.mutate({
      products: parsedRows.map((r) => ({
        name: r.name,
        categoryName: r.categoryName,
        unit: r.unit ?? 'adet',
        barcode: r.barcode,
        minStock: r.minStock ?? 0,
        maxStock: r.maxStock,
      })),
    });
  };

  const downloadTemplate = () => {
    const csvContent = 'Ürün Adı,Kategori,Birim,Barkod,Min Stok,Max Stok\nÖrnek Ürün,Elektronik,adet,1234567890123,10,100';
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'urun_sablonu.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setParsedRows([]);
    setParseErrors([]);
    setImportResults(null);
    setFileName('');
    setStep('upload');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 pb-4 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Toplu Ürün İçe Aktarma
            </h2>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Upload Step */}
          {step === 'upload' && (
            <>
              {/* Template download */}
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Download className="w-4 h-4" />
                Şablon CSV İndir
              </button>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition-all"
              >
                <Upload className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mb-3" />
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  CSV veya Excel dosyası seçin
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  .csv, .xlsx, .xls formatları desteklenir
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Parse errors */}
              {parseErrors.length > 0 && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                  {parseErrors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{err.row > 0 ? `Satır ${err.row}: ` : ''}{err.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{fileName}</span> — {parsedRows.length} ürün bulundu
                </p>
                <button
                  onClick={() => { setStep('upload'); setParsedRows([]); setFileName(''); }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Farklı dosya seç
                </button>
              </div>

              {/* Parse warnings */}
              {parseErrors.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 space-y-1">
                  {parseErrors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>Satır {err.row}: {err.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Preview table */}
              <div className="overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                    <tr className="text-zinc-500 dark:text-zinc-400 font-medium text-xs">
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Ürün Adı</th>
                      <th className="px-3 py-2 text-left">Kategori</th>
                      <th className="px-3 py-2 text-left">Birim</th>
                      <th className="px-3 py-2 text-left">Barkod</th>
                      <th className="px-3 py-2 text-right">Min</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                    {parsedRows.slice(0, 10).map((row, i) => (
                      <tr key={i} className="text-zinc-700 dark:text-zinc-300">
                        <td className="px-3 py-2 text-zinc-400">{i + 1}</td>
                        <td className="px-3 py-2 font-medium">{row.name}</td>
                        <td className="px-3 py-2 text-zinc-500">{row.categoryName || '—'}</td>
                        <td className="px-3 py-2">{row.unit}</td>
                        <td className="px-3 py-2 font-mono text-xs">{row.barcode || '—'}</td>
                        <td className="px-3 py-2 text-right">{row.minStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedRows.length > 10 && (
                  <div className="px-3 py-2 text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/30">
                    ... ve {parsedRows.length - 10} ürün daha
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button onClick={handleClose} className="px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                  İptal
                </button>
                <button
                  onClick={handleImport}
                  disabled={bulkCreate.isPending}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md shadow-emerald-600/20"
                >
                  {bulkCreate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {parsedRows.length} Ürünü İçe Aktar
                </button>
              </div>
            </>
          )}

          {/* Result Step */}
          {step === 'result' && importResults && (
            <>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    İçe aktarma tamamlandı
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    {importResults.filter((r) => r.success).length} başarılı, {importResults.filter((r) => !r.success).length} hatalı
                  </p>
                </div>
              </div>

              {/* Error details */}
              {importResults.some((r) => !r.success) && (
                <div className="overflow-x-auto rounded-xl border border-red-100 dark:border-red-900/30">
                  <table className="w-full text-sm">
                    <thead className="bg-red-50 dark:bg-red-950/20">
                      <tr className="text-red-600 dark:text-red-400 font-medium text-xs">
                        <th className="px-3 py-2 text-left">Satır</th>
                        <th className="px-3 py-2 text-left">Hata</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResults.filter((r) => !r.success).map((r) => (
                        <tr key={r.index} className="border-t border-red-50 dark:border-red-900/20">
                          <td className="px-3 py-2 text-red-500 font-mono">{r.index + 2}</td>
                          <td className="px-3 py-2 text-red-600 dark:text-red-400 text-xs">{r.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={handleClose} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20">
                  Kapat
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
