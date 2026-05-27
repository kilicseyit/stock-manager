'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Package, Save, Loader2, Upload, AlertCircle } from 'lucide-react';
import { createProductSchema, type CreateProductInput } from '@/schemas/product';

interface Category {
  id: string;
  name: string;
}

type ProductFormData = CreateProductInput;

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void;
  categories: Category[];
  defaultValues?: Partial<ProductFormData> & { id?: string };
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

export default function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  defaultValues,
  isLoading = false,
  mode,
}: ProductFormModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      unit: 'adet',
      barcode: '',
      minStock: 0,
      maxStock: undefined,
      imageUrl: '',
      ...defaultValues,
    },
  });

  const imageUrlValue = watch('imageUrl');

  // Form resetle modal her açıldığında
  useEffect(() => {
    if (isOpen) {
      reset({
        name: '',
        categoryId: '',
        unit: 'adet',
        barcode: '',
        minStock: 0,
        maxStock: undefined,
        imageUrl: '',
        ...defaultValues,
      });
      setUploadError(null);
    }
  }, [isOpen, defaultValues, reset]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Görsel yüklenemedi.');
      }

      const data = await res.json();
      setValue('imageUrl', data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Görsel yüklenirken bir hata oluştu.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  const handleFormSubmit = (rawData: unknown) => {
    const data = rawData as ProductFormData;
    // Boş stringleri undefined yap
    const cleaned: ProductFormData = {
      ...data,
      categoryId: data.categoryId || undefined,
      barcode: data.barcode || undefined,
      imageUrl: data.imageUrl || undefined,
      maxStock: data.maxStock || undefined,
    };
    onSubmit(cleaned);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 pb-4 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30">
              <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {mode === 'create' ? 'Yeni Ürün Ekle' : 'Ürünü Düzenle'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-5">
          {/* Ürün Adı */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Ürün Adı <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="Ürün adını girin"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Kategori
            </label>
            <select
              {...register('categoryId')}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
            >
              <option value="">Kategori seçin (opsiyonel)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Birim + Barkod (yan yana) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Birim
              </label>
              <select
                {...register('unit')}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              >
                <option value="adet">Adet</option>
                <option value="kg">Kilogram</option>
                <option value="litre">Litre</option>
                <option value="metre">Metre</option>
                <option value="kutu">Kutu</option>
                <option value="paket">Paket</option>
                <option value="koli">Koli</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Barkod
              </label>
              <input
                {...register('barcode')}
                placeholder="Opsiyonel"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              />
            </div>
          </div>

          {/* Min/Max Stok (yan yana) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Minimum Stok
              </label>
              <input
                {...register('minStock', { valueAsNumber: true })}
                type="number"
                min={0}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              />
              {errors.minStock && (
                <p className="mt-1 text-xs text-red-500">{errors.minStock.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Maksimum Stok
              </label>
              <input
                {...register('maxStock', { valueAsNumber: true })}
                type="number"
                min={0}
                placeholder="Opsiyonel"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              />
            </div>
          </div>

          {/* Görsel Yükleme & URL */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Ürün Görseli
            </label>
            
            {uploadError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="flex items-center gap-4">
              {imageUrlValue ? (
                <div className="relative w-16 h-16 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-50 dark:bg-zinc-800 shrink-0 flex items-center justify-center">
                  <img 
                    src={imageUrlValue} 
                    alt="Ürün önizleme" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setValue('imageUrl', '')}
                    className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded-full hover:bg-red-700 focus:outline-none shadow"
                    title="Görseli kaldır"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/20 shrink-0 flex items-center justify-center text-zinc-400">
                  <Package className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <label className="cursor-pointer px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-zinc-850 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/10 transition-colors text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    ) : (
                      <Upload className="w-4 h-4 text-zinc-500" />
                    )}
                    <span>{isUploading ? 'Yükleniyor...' : 'Görsel Yükle'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                  
                  {imageUrlValue && (
                    <button
                      type="button"
                      onClick={() => setValue('imageUrl', '')}
                      className="px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold text-red-600 dark:text-red-400 transition-colors"
                    >
                      Kaldır
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  PNG, JPEG, WebP veya GIF. En fazla 5MB.
                </p>
              </div>
            </div>

            <div>
              <input
                {...register('imageUrl')}
                placeholder="Veya manuel görsel URL girin (/uploads/urun.webp)"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-xs"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md shadow-indigo-600/20"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {mode === 'create' ? 'Oluştur' : 'Güncelle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
