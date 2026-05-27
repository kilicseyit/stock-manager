'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { X, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Wrench } from 'lucide-react';

const formSchema = z.object({
  type: z.enum(['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT']),
  productId: z.string().min(1, 'Ürün seçimi zorunludur'),
  fromLocationId: z.string().optional(),
  toLocationId: z.string().optional(),
  quantity: z.number({ message: 'Miktar giriniz' }).int().positive('Miktar pozitif olmalıdır'),
  reason: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface Location {
  id: string;
  zone: string;
  aisle: string | null;
  shelf: string | null;
  warehouse?: { name: string };
}

interface StockMovementFormProps {
  products: Product[];
  locations: Location[];
  isLoading?: boolean;
  onSubmit: (data: FormValues) => void;
  onClose: () => void;
}

const movementTypes = [
  { value: 'IN' as const, label: 'Giriş', icon: ArrowDownToLine, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { value: 'OUT' as const, label: 'Çıkış', icon: ArrowUpFromLine, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
  { value: 'TRANSFER' as const, label: 'Transfer', icon: ArrowLeftRight, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
  { value: 'ADJUSTMENT' as const, label: 'Düzeltme', icon: Wrench, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
];

function formatLocationLabel(loc: Location): string {
  const parts = [loc.zone];
  if (loc.aisle) parts.push(loc.aisle);
  if (loc.shelf) parts.push(loc.shelf);
  if (loc.warehouse?.name) return `${loc.warehouse.name} — ${parts.join(' / ')}`;
  return parts.join(' / ');
}

export default function StockMovementForm({
  products,
  locations,
  isLoading,
  onSubmit,
  onClose,
}: StockMovementFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      type: 'IN',
      productId: '',
      fromLocationId: '',
      toLocationId: '',
      quantity: undefined,
      reason: '',
    },
  });

  const selectedType = watch('type');

  // Tip değiştiğinde ilgisiz lokasyon alanlarını temizle
  useEffect(() => {
    if (selectedType === 'IN' || selectedType === 'ADJUSTMENT') {
      setValue('fromLocationId', '');
    }
    if (selectedType === 'OUT') {
      setValue('toLocationId', '');
    }
  }, [selectedType, setValue]);

  const showFromLocation = selectedType === 'OUT' || selectedType === 'TRANSFER';
  const showToLocation = selectedType === 'IN' || selectedType === 'TRANSFER' || selectedType === 'ADJUSTMENT';

  const handleFormSubmit = (data: FormValues) => {
    onSubmit(data);
    reset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Stok Hareketi Oluştur
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-5">
          {/* Hareket Tipi Seçimi */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Hareket Tipi
            </label>
            <div className="grid grid-cols-4 gap-2">
              {movementTypes.map((mt) => {
                const Icon = mt.icon;
                const isSelected = selectedType === mt.value;
                return (
                  <button
                    key={mt.value}
                    type="button"
                    onClick={() => setValue('type', mt.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-medium ${
                      isSelected
                        ? `${mt.bg} border-current ${mt.color}`
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {mt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ürün Seçimi */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Ürün *
            </label>
            <select
              {...register('productId', { required: 'Ürün seçimi zorunludur' })}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            >
              <option value="">Ürün seçin...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>
            {errors.productId && (
              <p className="text-xs text-red-500 mt-1">{errors.productId.message}</p>
            )}
          </div>

          {/* Kaynak Lokasyon */}
          {showFromLocation && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Kaynak Lokasyon *
              </label>
              <select
                {...register('fromLocationId', {
                  required: showFromLocation ? 'Kaynak lokasyon zorunludur' : false,
                })}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              >
                <option value="">Lokasyon seçin...</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {formatLocationLabel(l)}
                  </option>
                ))}
              </select>
              {errors.fromLocationId && (
                <p className="text-xs text-red-500 mt-1">{errors.fromLocationId.message}</p>
              )}
            </div>
          )}

          {/* Hedef Lokasyon */}
          {showToLocation && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                {selectedType === 'ADJUSTMENT' ? 'Lokasyon *' : 'Hedef Lokasyon *'}
              </label>
              <select
                {...register('toLocationId', {
                  required: showToLocation ? 'Hedef lokasyon zorunludur' : false,
                })}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              >
                <option value="">Lokasyon seçin...</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {formatLocationLabel(l)}
                  </option>
                ))}
              </select>
              {errors.toLocationId && (
                <p className="text-xs text-red-500 mt-1">{errors.toLocationId.message}</p>
              )}
            </div>
          )}

          {/* Miktar */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Miktar *
            </label>
            <input
              type="number"
              {...register('quantity', { valueAsNumber: true })}
              placeholder="0"
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
            {errors.quantity && (
              <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>
            )}
          </div>

          {/* Sebep / Not */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Sebep / Not
            </label>
            <textarea
              {...register('reason')}
              rows={2}
              placeholder="İsteğe bağlı açıklama..."
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
            >
              {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
