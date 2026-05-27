'use client';

import React, { useState } from 'react';
import { trpc } from '@/trpc/client';
import { useForm } from 'react-hook-form';
import { MapPin, Plus, Warehouse, Edit2, Trash2, X, Package } from 'lucide-react';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';

interface LocationFormValues {
  warehouseId: string;
  zone: string;
  aisle: string;
  shelf: string;
  bin: string;
}

export default function LokasyonlarPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Selection & Bulk Delete state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const utils = trpc.useUtils();

  // Queries
  const locationsQuery = trpc.location.getAll.useQuery();
  const warehousesQuery = trpc.location.getWarehouses.useQuery();

  // Mutations
  const createLocation = trpc.location.create.useMutation({
    onSuccess: () => {
      utils.location.getAll.invalidate();
      closeForm();
    },
  });

  const updateLocation = trpc.location.update.useMutation({
    onSuccess: () => {
      utils.location.getAll.invalidate();
      closeForm();
    },
  });

  const deleteLocation = trpc.location.delete.useMutation({
    onSuccess: () => {
      utils.location.getAll.invalidate();
      setDeleteId(null);
    },
  });

  const deleteManyLocation = trpc.location.deleteMany.useMutation({
    onSuccess: (data) => {
      setAlertMessage({
        type: data.errorCount > 0 ? 'error' : 'success',
        text: `${data.successCount} lokasyon başarıyla silindi, ${data.errorCount} lokasyon atlandı (bağlı stok veya hareket var).`
      });
      setTimeout(() => setAlertMessage(null), 5000);
      setSelectedIds([]);
      utils.location.getAll.invalidate();
      setIsBulkDeleteOpen(false);
    },
    onError: (err) => {
      setAlertMessage({ type: 'error', text: `Toplu silme sırasında hata: ${err.message}` });
      setTimeout(() => setAlertMessage(null), 5000);
      setIsBulkDeleteOpen(false);
    }
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<LocationFormValues>({
    defaultValues: { warehouseId: '', zone: '', aisle: '', shelf: '', bin: '' },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEditForm = (location: any) => {
    setEditingId(location.id);
    setValue('warehouseId', location.warehouseId);
    setValue('zone', location.zone);
    setValue('aisle', location.aisle || '');
    setValue('shelf', location.shelf || '');
    setValue('bin', location.bin || '');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    reset({ warehouseId: '', zone: '', aisle: '', shelf: '', bin: '' });
  };

  const onSubmit = (data: LocationFormValues) => {
    if (editingId) {
      updateLocation.mutate({
        id: editingId,
        zone: data.zone,
        aisle: data.aisle || undefined,
        shelf: data.shelf || undefined,
        bin: data.bin || undefined,
      });
    } else {
      createLocation.mutate({
        warehouseId: data.warehouseId,
        zone: data.zone,
        aisle: data.aisle || undefined,
        shelf: data.shelf || undefined,
        bin: data.bin || undefined,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Lokasyon Yönetimi
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Depo, bölge ve raf tanımlamaları
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Yeni Lokasyon
        </button>
      </div>

      {/* Alert Message Banner */}
      {alertMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-sm font-semibold ${
          alertMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
            : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30'
        }`}>
          <span>{alertMessage.text}</span>
          <button onClick={() => setAlertMessage(null)} className="text-xs underline hover:no-underline">Kapat</button>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {locationsQuery.isLoading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
            ))}
          </div>
        ) : !locationsQuery.data?.length ? (
          <div className="text-center py-16">
            <MapPin className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Henüz lokasyon eklenmedi.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                  <th className="text-left px-5 py-4 font-semibold text-zinc-600 dark:text-zinc-300 border-l-2 border-transparent">Depo</th>
                  <th className="text-left px-5 py-4 font-semibold text-zinc-600 dark:text-zinc-300">Bölge (Zone)</th>
                  <th className="text-left px-5 py-4 font-semibold text-zinc-600 dark:text-zinc-300">Koridor (Aisle)</th>
                  <th className="text-left px-5 py-4 font-semibold text-zinc-600 dark:text-zinc-300">Raf (Shelf)</th>
                  <th className="text-left px-5 py-4 font-semibold text-zinc-600 dark:text-zinc-300">Kutu (Bin)</th>
                  <th className="text-center px-5 py-4 font-semibold text-zinc-600 dark:text-zinc-300">Stok Kalemi</th>
                  <th className="text-right px-5 py-4 font-semibold text-zinc-600 dark:text-zinc-300">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {locationsQuery.data.map((loc) => {
                  const isSelected = selectedIds.includes(loc.id);
                  return (
                    <tr 
                      key={loc.id} 
                      onClick={() => {
                        setSelectedIds((prev) => 
                          prev.includes(loc.id) 
                            ? prev.filter((id) => id !== loc.id) 
                            : [...prev, loc.id]
                        );
                      }}
                      className={`transition-colors select-none cursor-pointer group ${
                        isSelected
                          ? 'bg-indigo-50/20 dark:bg-indigo-950/10'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                      }`}
                    >
                      <td className={`px-5 py-4 transition-all duration-200 ${
                        isSelected ? 'border-l-2 border-indigo-600 dark:border-indigo-500' : 'border-l-2 border-transparent'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Warehouse className="w-4 h-4 text-zinc-400" />
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{loc.warehouse?.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">{loc.zone}</td>
                      <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">{loc.aisle || '—'}</td>
                      <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">{loc.shelf || '—'}</td>
                      <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">{loc.bin || '—'}</td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-medium text-xs">
                          <Package className="w-3 h-3" />
                          {loc._count?.stockItems || 0}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditForm(loc);
                          }}
                          className="p-2 rounded-lg text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(loc.id);
                          }}
                          className="p-2 rounded-lg text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {editingId ? 'Lokasyon Düzenle' : 'Yeni Lokasyon'}
              </h2>
              <button onClick={closeForm} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Depo *</label>
                <select
                  {...register('warehouseId', { required: 'Depo seçimi zorunlu' })}
                  disabled={!!editingId} // Depo değiştirilemez
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm disabled:opacity-50"
                >
                  <option value="">Depo seçin...</option>
                  {warehousesQuery.data?.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
                {errors.warehouseId && <p className="text-xs text-red-500 mt-1">{errors.warehouseId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Bölge (Zone) *</label>
                <input
                  {...register('zone', { required: 'Bölge zorunlu' })}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                  placeholder="Örn: A, Soğuk Hava..."
                />
                {errors.zone && <p className="text-xs text-red-500 mt-1">{errors.zone.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Koridor (İsteğe bağlı)</label>
                  <input
                    {...register('aisle')}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Raf (İsteğe bağlı)</label>
                  <input
                    {...register('shelf')}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Kutu/Bölme (İsteğe bağlı)</label>
                <input
                  {...register('bin')}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={createLocation.isPending || updateLocation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm disabled:opacity-50"
                >
                  {createLocation.isPending || updateLocation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <DeleteConfirmDialog
          isOpen={!!deleteId}
          title="Lokasyon Sil"
          description="Bu lokasyonu silmek istediğinize emin misiniz? (İçinde stok bulunan lokasyonlar silinemez)"
          onConfirm={() => deleteLocation.mutate({ id: deleteId })}
          onClose={() => setDeleteId(null)}
          isLoading={deleteLocation.isPending}
        />
      )}

      {isBulkDeleteOpen && (
        <DeleteConfirmDialog
          isOpen={isBulkDeleteOpen}
          title="Seçilen Lokasyonları Sil"
          description={`Seçilen ${selectedIds.length} lokasyonu silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve bağlı stok veya hareketi bulunan lokasyonlar silinmeyip atlanacaktır.`}
          onConfirm={() => deleteManyLocation.mutate({ ids: selectedIds })}
          onClose={() => setIsBulkDeleteOpen(false)}
          isLoading={deleteManyLocation.isPending}
        />
      )}

      {/* Floating Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-[24px] left-1/2 -translate-x-1/2 flex items-center justify-between gap-6 px-6 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-2xl z-50 min-w-[320px] sm:min-w-[450px] animate-slideUp">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/55 text-indigo-600 dark:text-indigo-400">
              <MapPin className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {selectedIds.length} lokasyon seçildi
            </span>
          </div>
          <div className="flex items-center gap-2">
            {locationsQuery.data && selectedIds.length < locationsQuery.data.length && (
              <button
                onClick={() => setSelectedIds(locationsQuery.data.map((l) => l.id))}
                className="px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all"
              >
                Tümünü Seç
              </button>
            )}
            <button
              onClick={() => setSelectedIds([])}
              className="px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all"
            >
              Seçimi Temizle
            </button>
            <button
              onClick={() => setIsBulkDeleteOpen(true)}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-rose-500/10 active:scale-[0.98]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Seçilenleri Sil
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
