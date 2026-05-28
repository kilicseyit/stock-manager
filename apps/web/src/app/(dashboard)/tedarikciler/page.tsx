'use client';

import React, { useState } from 'react';
import { trpc } from '@/trpc/client';
import { useForm } from 'react-hook-form';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  X,
  Star,
  Mail,
  Phone,
  User,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';

interface SupplierFormValues {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  rating: number;
}

export default function TedarikcilerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  // Selection & Bulk Delete state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const utils = trpc.useUtils();

  // Queries
  const suppliersQuery = trpc.supplier.getAll.useQuery({
    search: searchQuery || undefined,
  });

  const detailQuery = trpc.supplier.getById.useQuery(
    { id: selectedSupplierId || '' },
    { enabled: !!selectedSupplierId }
  );

  // Mutations
  const createSupplier = trpc.supplier.create.useMutation({
    onSuccess: () => {
      utils.supplier.getAll.invalidate();
      closeForm();
    },
  });

  const updateSupplier = trpc.supplier.update.useMutation({
    onSuccess: () => {
      utils.supplier.getAll.invalidate();
      closeForm();
    },
  });

  const deleteSupplier = trpc.supplier.delete.useMutation({
    onSuccess: () => {
      utils.supplier.getAll.invalidate();
      setDeleteId(null);
    },
  });

  const deleteManySupplier = trpc.supplier.deleteMany.useMutation({
    onSuccess: (data) => {
      setAlertMessage({
        type: data.errorCount > 0 ? 'error' : 'success',
        text: `${data.successCount} tedarikçi başarıyla silindi, ${data.errorCount} tedarikçi atlandı (bağlı sipariş var).`
      });
      setTimeout(() => setAlertMessage(null), 5000);
      setSelectedIds([]);
      utils.supplier.getAll.invalidate();
      setIsBulkDeleteOpen(false);
    },
    onError: (err) => {
      setAlertMessage({ type: 'error', text: `Toplu silme sırasında hata: ${err.message}` });
      setTimeout(() => setAlertMessage(null), 5000);
      setIsBulkDeleteOpen(false);
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    defaultValues: { name: '', contactName: '', email: '', phone: '', rating: 5 },
  });

  const openCreateForm = () => {
    setEditingId(null);
    reset({ name: '', contactName: '', email: '', phone: '', rating: 5 });
    setIsFormOpen(true);
  };

  const openEditForm = (supplier: any) => {
    setEditingId(supplier.id);
    setValue('name', supplier.name);
    setValue('contactName', supplier.contactName || '');
    setValue('email', supplier.email || '');
    setValue('phone', supplier.phone || '');
    setValue('rating', supplier.rating || 5);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = (data: SupplierFormValues) => {
    const payload = {
      name: data.name,
      contactName: data.contactName || null,
      email: data.email || null,
      phone: data.phone || null,
      rating: Number(data.rating),
    };

    if (editingId) {
      updateSupplier.mutate({ id: editingId, ...payload });
    } else {
      createSupplier.mutate(payload);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return { label: 'Taslak', color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400' };
      case 'SENT':
        return { label: 'Gönderildi', color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30' };
      case 'PARTIAL':
        return { label: 'Kısmi Kabul', color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30' };
      case 'RECEIVED':
        return { label: 'Tamamlandı', color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' };
      case 'CANCELLED':
        return { label: 'İptal Edildi', color: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30' };
      default:
        return { label: status, color: 'bg-zinc-100 text-zinc-600' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Tedarikçi Yönetimi
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Mal kabul süreçleri için tedarikçi listesi, performans bilgileri ve sipariş geçmişi.
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Yeni Tedarikçi Ekle
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-3 bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Tedarikçi adı, iletişim kişisi veya e-posta ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Alert Message Banner */}
      {alertMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-sm font-semibold ${
          alertMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-805 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
            : 'bg-rose-50 text-rose-805 border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30'
        }`}>
          <span>{alertMessage.text}</span>
          <button onClick={() => setAlertMessage(null)} className="text-xs underline hover:no-underline">Kapat</button>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl overflow-hidden shadow-sm">
        {suppliersQuery.isLoading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
            ))}
          </div>
        ) : !suppliersQuery.data?.items.length ? (
          <div className="text-center py-16">
            <Truck className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Aradığınız kriterlere uygun tedarikçi bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-600 dark:text-zinc-400 font-medium">
                  <th className="px-6 py-4 font-semibold border-l-2 border-transparent">Tedarikçi Adı</th>
                  <th className="px-6 py-4 font-semibold">İletişim Kişisi</th>
                  <th className="px-6 py-4 font-semibold">İletişim Bilgileri</th>
                  <th className="px-6 py-4 text-center">Değerlendirme</th>
                  <th className="px-6 py-4 text-center">Toplam Sipariş</th>
                  <th className="px-6 py-4 text-center">Teslim Oranı</th>
                  <th className="px-6 py-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                {suppliersQuery.data.items.map((supplier) => {
                  const isSelected = selectedIds.includes(supplier.id);
                  return (
                    <tr
                      key={supplier.id}
                      onClick={() => {
                        setSelectedIds((prev) => 
                          prev.includes(supplier.id) 
                            ? prev.filter((id) => id !== supplier.id) 
                            : [...prev, supplier.id]
                        );
                      }}
                      className={`transition-colors select-none cursor-pointer group ${
                        isSelected
                          ? 'bg-indigo-50/20 dark:bg-indigo-950/10'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/20'
                      }`}
                    >
                      <td className={`px-6 py-4 transition-all duration-200 ${
                        isSelected ? 'border-l-2 border-indigo-600 dark:border-indigo-500' : 'border-l-2 border-transparent'
                      }`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSupplierId(supplier.id);
                          }}
                          className="font-bold text-zinc-900 dark:text-zinc-50 hover:text-indigo-600 dark:hover:text-indigo-400 text-left hover:underline transition-colors"
                        >
                          {supplier.name}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{supplier.contactName || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-xs">
                          {supplier.email && (
                            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                              <Mail className="w-3 h-3" />
                              <span>{supplier.email}</span>
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                              <Phone className="w-3 h-3" />
                              <span>{supplier.phone}</span>
                            </div>
                          )}
                          {!supplier.email && !supplier.phone && <span className="text-zinc-400">—</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < supplier.rating ? 'fill-amber-400' : 'text-zinc-200 dark:text-zinc-800'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-zinc-900 dark:text-zinc-550">
                        {supplier.stats.totalOrders}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            %{supplier.stats.fulfillmentRate}
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${supplier.stats.fulfillmentRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditForm(supplier);
                          }}
                          className="p-2 rounded-lg text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(supplier.id);
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

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {editingId ? 'Tedarikçiyi Düzenle' : 'Yeni Tedarikçi Ekle'}
              </h2>
              <button onClick={closeForm} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Tedarikçi Adı *
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Tedarikçi adı zorunludur' })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-1 focus:ring-indigo-500"
                  placeholder="Firma veya Tedarikçi Adı"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  İletişim Kişisi (Ad Soyad)
                </label>
                <input
                  type="text"
                  {...register('contactName')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                  placeholder="Örn: Ahmet Yılmaz"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    E-posta
                  </label>
                  <input
                    type="text"
                    {...register('email')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                    placeholder="ornek@firma.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Telefon
                  </label>
                  <input
                    type="text"
                    {...register('phone')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                    placeholder="0555..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Değerlendirme (Rating: 1 - 5 Yıldız)
                </label>
                <select
                  {...register('rating')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} Yıldız
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={createSupplier.isPending || updateSupplier.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm disabled:opacity-50 transition-colors"
                >
                  {createSupplier.isPending || updateSupplier.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Order History Detail Modal */}
      {selectedSupplierId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedSupplierId(null)} />
          <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-150 dark:border-zinc-800/80">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  {detailQuery.data?.name}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">Sipariş geçmişi ve performans özeti</p>
              </div>
              <button
                onClick={() => setSelectedSupplierId(null)}
                className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailQuery.isLoading ? (
              <div className="py-12 space-y-3">
                <div className="h-6 w-1/3 bg-zinc-100 dark:bg-zinc-800/50 rounded animate-pulse" />
                <div className="h-10 bg-zinc-100 dark:bg-zinc-800/50 rounded animate-pulse" />
                <div className="h-20 bg-zinc-100 dark:bg-zinc-800/50 rounded animate-pulse" />
              </div>
            ) : detailQuery.data ? (
              <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-2">
                {/* Stats Panel */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-850/50 flex flex-col items-center">
                    <FileSpreadsheet className="w-5 h-5 text-indigo-500 mb-1" />
                    <span className="text-xs text-zinc-500">Toplam Sipariş</span>
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      {detailQuery.data.stats.totalOrders}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-850/50 flex flex-col items-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-1" />
                    <span className="text-xs text-zinc-500">Tamamlanan</span>
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      {detailQuery.data.stats.completedOrders}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-850/50 flex flex-col items-center">
                    <TrendingUp className="w-5 h-5 text-teal-500 mb-1" />
                    <span className="text-xs text-zinc-500">Teslim Oranı</span>
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      %{detailQuery.data.stats.fulfillmentRate}
                    </span>
                  </div>
                </div>

                {/* Orders List */}
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Sipariş Geçmişi</h3>
                  {!detailQuery.data.orders?.length ? (
                    <p className="text-sm text-zinc-400 py-6 text-center">Bu tedarikçiye henüz sipariş oluşturulmadı.</p>
                  ) : (
                    <div className="space-y-3">
                      {detailQuery.data.orders.map((order) => {
                        const cfg = getStatusConfig(order.status);
                        const totalAmount = order.items.reduce((sum, item) => sum + item.orderedQty * item.unitPrice, 0);

                        return (
                          <div
                            key={order.id}
                            className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-950/20 space-y-3"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <div>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100 mr-2">
                                  No: {order.id}
                                </span>
                                <span className="text-zinc-400">
                                  {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full font-semibold ${cfg.color}`}>
                                {cfg.label}
                              </span>
                            </div>

                            <div className="flex flex-col gap-1.5 text-xs text-zinc-600 dark:text-zinc-450">
                              {order.items.slice(0, 3).map((item) => (
                                <div key={item.id} className="flex justify-between">
                                  <span>
                                    {item.product.name} ({item.orderedQty} adet)
                                  </span>
                                  <span className="font-medium">
                                    {item.receivedQty} / {item.orderedQty} kabul
                                  </span>
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <span className="text-zinc-400 font-medium">
                                  +{order.items.length - 3} kalem daha...
                                </span>
                              )}
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
                              <span className="text-zinc-500">Sipariş Tutarı</span>
                              <span className="font-bold text-zinc-900 dark:text-zinc-550 text-sm">
                                ₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800/80 flex justify-end">
              <button
                onClick={() => setSelectedSupplierId(null)}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <DeleteConfirmDialog
          isOpen={!!deleteId}
          title="Tedarikçiyi Sil"
          description="Bu tedarikçiyi silmek istediğinize emin misiniz? (Tedarikçiye ait geçmiş satın alma siparişi varsa silme işlemi engellenecektir)"
          onConfirm={() => deleteSupplier.mutate({ id: deleteId })}
          onClose={() => setDeleteId(null)}
          isLoading={deleteSupplier.isPending}
        />
      )}

      {isBulkDeleteOpen && (
        <DeleteConfirmDialog
          isOpen={isBulkDeleteOpen}
          title="Seçilen Tedarikçileri Sil"
          description={`Seçilen ${selectedIds.length} tedarikçiyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve bağlı satın alma siparişi bulunan tedarikçiler silinmeyip atlanacaktır.`}
          onConfirm={() => deleteManySupplier.mutate({ ids: selectedIds })}
          onClose={() => setIsBulkDeleteOpen(false)}
          isLoading={deleteManySupplier.isPending}
        />
      )}

      {/* Floating Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-[24px] left-0 right-0 flex justify-center z-50 pointer-events-none">
          <div className="flex items-center justify-between gap-6 px-6 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-2xl min-w-[320px] sm:min-w-[450px] pointer-events-auto mx-auto animate-slideUpSimple">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/55 text-indigo-600 dark:text-indigo-400">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {selectedIds.length} tedarikçi seçildi
              </span>
            </div>
            <div className="flex items-center gap-2">
              {suppliersQuery.data?.items && selectedIds.length < suppliersQuery.data.items.length && (
                <button
                  onClick={() => setSelectedIds(suppliersQuery.data.items.map((s) => s.id))}
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
        </div>
      )}
    </div>
  );
}
