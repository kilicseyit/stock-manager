'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { Mail, ChevronLeft, Save, RefreshCw, Palette, Type, AlignLeft } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { LowStockAlert } from '@/lib/email-templates/LowStockAlert';
import { WeeklyReport } from '@/lib/email-templates/WeeklyReport';
import { OrderCreated } from '@/lib/email-templates/OrderCreated';
import { WelcomeEmail } from '@/lib/email-templates/WelcomeEmail';

const TEMPLATE_KEYS = ['low-stock-alert', 'weekly-report', 'order-created', 'welcome-email'] as const;
type TemplateKey = typeof TEMPLATE_KEYS[number];

const TEMPLATE_ICONS: Record<TemplateKey, string> = {
  'low-stock-alert': '🚨',
  'weekly-report': '📊',
  'order-created': '✅',
  'welcome-email': '👋',
};

const SAMPLE_DATA: Record<TemplateKey, (config: { accentColor: string; senderName: string; footerText: string }) => React.ReactElement> = {
  'low-stock-alert': (c) => createElement(LowStockAlert, {
    productName: 'Vida M5x20', sku: 'VDA-M5-20', quantity: 3, minStock: 50,
    managerName: 'Ahmet Yılmaz', ...c,
  }),
  'weekly-report': (c) => createElement(WeeklyReport, {
    dateStr: new Date().toLocaleDateString('tr-TR'),
    totalProducts: 124, lowStockCount: 7,
    criticalProducts: [
      { name: 'Vida M5x20', sku: 'VDA-M5-20', totalQty: 3, minStock: 50, unit: 'adet', isLow: true },
      { name: 'Somun M8', sku: 'SMN-M8', totalQty: 0, minStock: 20, unit: 'adet', isLow: true },
    ],
    ...c,
  }),
  'order-created': (c) => createElement(OrderCreated, {
    orderNumber: 'PO-2026-0042', supplierName: 'ABC Tedarik Ltd.',
    createdByName: 'Mehmet Demir', expectedDate: '20.06.2026', totalItems: 2,
    items: [
      { productName: 'Vida M5x20', sku: 'VDA-M5-20', quantity: 500, unit: 'adet' },
      { productName: 'Somun M8', sku: 'SMN-M8', quantity: 200, unit: 'adet' },
    ],
    ...c,
  }),
  'welcome-email': (c) => createElement(WelcomeEmail, {
    name: 'Ayşe Kara', role: 'WAREHOUSE_MANAGER', temporaryPassword: 'Temp@1234', ...c,
  }),
};

const ACCENT_PRESETS = [
  { label: 'İndigo', value: '#4f46e5' },
  { label: 'Kırmızı', value: '#ef4444' },
  { label: 'Yeşil', value: '#22c55e' },
  { label: 'Turuncu', value: '#f97316' },
  { label: 'Mor', value: '#a855f7' },
  { label: 'Mavi', value: '#0ea5e9' },
];

export default function EmailTemplatePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [selectedKey, setSelectedKey] = useState<TemplateKey>('low-stock-alert');
  const [form, setForm] = useState({ accentColor: '#4f46e5', senderName: 'StockManager', footerText: 'StockManager Depo Yönetim Sistemi' });
  const [previewHtml, setPreviewHtml] = useState('');
  const [dirty, setDirty] = useState(false);

  const { data: configs, isLoading } = trpc.emailTemplate.getAll.useQuery();
  const updateMutation = trpc.emailTemplate.update.useMutation({
    onSuccess: () => { showToast('Şablon kaydedildi', 'success'); setDirty(false); },
    onError: () => showToast('Kaydetme başarısız', 'error'),
  });
  const utils = trpc.useUtils();

  const isAdmin = session?.user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!isLoading && !isAdmin) router.push('/ayarlar');
  }, [isLoading, isAdmin, router]);

  useEffect(() => {
    if (!configs) return;
    const cfg = configs.find((c) => c.templateKey === selectedKey);
    if (cfg) setForm({ accentColor: cfg.accentColor, senderName: cfg.senderName, footerText: cfg.footerText });
    setDirty(false);
  }, [selectedKey, configs]);

  useEffect(() => {
    try {
      const html = renderToStaticMarkup(SAMPLE_DATA[selectedKey](form));
      setPreviewHtml(html);
    } catch {
      setPreviewHtml('<p>Önizleme oluşturulamadı</p>');
    }
  }, [selectedKey, form]);

  const handleFormChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSave = () => {
    updateMutation.mutate({
      templateKey: selectedKey,
      ...form,
      updatedBy: session?.user?.name ?? undefined,
    });
    utils.emailTemplate.getAll.invalidate();
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-zinc-500">Yükleniyor...</div>
  );

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/ayarlar')}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <Mail className="w-8 h-8 text-indigo-600" />
            Email Şablon Yönetimi
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Email bildirim şablonlarını özelleştirin ve canlı önizleme görün.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol — Template seçimi + Form */}
        <div className="space-y-4">
          {/* Template listesi */}
          <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 backdrop-blur-xl shadow-sm space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Şablonlar</p>
            {configs?.map((cfg) => (
              <button
                key={cfg.templateKey}
                onClick={() => setSelectedKey(cfg.templateKey as TemplateKey)}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all ${
                  selectedKey === cfg.templateKey
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <span className="text-lg">{TEMPLATE_ICONS[cfg.templateKey as TemplateKey]}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{cfg.label}</p>
                  <p className="text-xs text-zinc-400 truncate">{cfg.templateKey}</p>
                </div>
                <span
                  className="ml-auto w-3 h-3 rounded-full shrink-0 border border-white/30 shadow"
                  style={{ backgroundColor: cfg.accentColor }}
                />
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 backdrop-blur-xl shadow-sm space-y-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Özelleştir</p>

            {/* Accent color */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                <Palette className="w-4 h-4" /> Vurgu Rengi
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {ACCENT_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    title={p.label}
                    onClick={() => handleFormChange('accentColor', p.value)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                      form.accentColor === p.value ? 'border-zinc-800 dark:border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: p.value }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={form.accentColor}
                onChange={(e) => handleFormChange('accentColor', e.target.value)}
                className="h-9 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer bg-white dark:bg-zinc-800"
              />
            </div>

            {/* Sender name */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                <Type className="w-4 h-4" /> Gönderici Adı
              </label>
              <input
                type="text"
                value={form.senderName}
                onChange={(e) => handleFormChange('senderName', e.target.value)}
                maxLength={60}
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Footer text */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                <AlignLeft className="w-4 h-4" /> Footer Metni
              </label>
              <textarea
                value={form.footerText}
                onChange={(e) => handleFormChange('footerText', e.target.value)}
                maxLength={200}
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={!dirty || updateMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              {updateMutation.isPending
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Kaydediliyor…</>
                : <><Save className="w-4 h-4" /> Kaydet</>
              }
            </button>
          </div>
        </div>

        {/* Sağ — Canlı önizleme */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 backdrop-blur-xl shadow-sm overflow-hidden h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <p className="text-xs text-zinc-500 font-medium">
                {TEMPLATE_ICONS[selectedKey]} Canlı Önizleme
                {dirty && <span className="ml-2 text-amber-500">● Kaydedilmemiş değişiklik</span>}
              </p>
              <div />
            </div>
            <iframe
              srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;background:#f3f4f6;padding:24px">${previewHtml}</body></html>`}
              className="w-full border-0 bg-zinc-50"
              style={{ height: 'calc(100vh - 260px)', minHeight: '500px' }}
              title="Email önizleme"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
