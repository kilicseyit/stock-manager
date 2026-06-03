'use client';

import React, { useState } from 'react';
import { trpc } from '@/trpc/client';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  FileSpreadsheet,
  Plus,
  X,
  Truck,
  Package,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Barcode,
  Search,
  Eye,
  MapPin,
  FileText,
} from 'lucide-react';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';
import { useToast } from '@/components/ui/Toast';

interface OrderItemFormValue {
  productId: string;
  orderedQty: number;
  unitPrice: number;
}

interface OrderFormValues {
  supplierId: string;
  items: OrderItemFormValue[];
}

interface ReceiveBatchItem {
  productId: string;
  productName: string;
  productSku: string;
  productBarcode?: string | null;
  orderedQty: number;
  receivedQty: number;
  remainingQty: number;
  batchQty: number; // Miktar girişi
  locationId: string; // Zorunlu lokasyon
  isScanned?: boolean;
}

export default function SiparislerPage() {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);

  // Mal kabul için barkod okuyucu state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  // Mal kabul form state
  const [receiveItems, setReceiveItems] = useState<ReceiveBatchItem[]>([]);

  const utils = trpc.useUtils();

  // Queries
  const ordersQuery = trpc.order.getAll.useQuery({});
  const suppliersQuery = trpc.supplier.getAll.useQuery({ limit: 100 });
  const productsQuery = trpc.product.getAll.useQuery({ limit: 100 });
  const locationsQuery = trpc.location.getAll.useQuery();

  const detailQuery = trpc.order.getById.useQuery(
    { id: selectedOrderId || '' },
    { enabled: !!selectedOrderId }
  );

  // Mutations
  const createOrder = trpc.order.create.useMutation({
    onSuccess: () => {
      utils.order.getAll.invalidate();
      closeCreateForm();
      showToast('Sipariş başarıyla oluşturuldu.', 'success');
    },
    onError: (err) => {
      showToast(err.message || 'Sipariş oluşturulamadı.', 'error');
    },
  });

  const updateStatus = trpc.order.updateStatus.useMutation({
    onSuccess: () => {
      utils.order.getAll.invalidate();
      if (selectedOrderId) {
        utils.order.getById.invalidate({ id: selectedOrderId });
      }
      showToast('Sipariş durumu güncellendi.', 'success');
    },
    onError: (err) => {
      showToast(err.message || 'Sipariş durumu güncellenemedi.', 'error');
    },
  });

  const receiveOrderItems = trpc.order.receiveItems.useMutation({
    onSuccess: (res) => {
      utils.order.getAll.invalidate();
      if (selectedOrderId) {
        utils.order.getById.invalidate({ id: selectedOrderId });
      }
      utils.inventory.getStock.invalidate();
      utils.location.getAll.invalidate();
      setIsReceiveOpen(false);
      setReceiveItems([]);
      showToast('Mal kabulü başarıyla kaydedildi ve stok güncellendi.', 'success');
    },
    onError: (err) => {
      showToast(err.message || 'Mal kabulü sırasında hata oluştu.', 'error');
    },
  });

  // React Hook Form for Create Order
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrderFormValues>({
    defaultValues: {
      supplierId: '',
      items: [{ productId: '', orderedQty: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const closeCreateForm = () => {
    setIsCreateOpen(false);
    reset({
      supplierId: '',
      items: [{ productId: '', orderedQty: 1, unitPrice: 0 }],
    });
  };

  const onSubmitCreate = (data: OrderFormValues) => {
    createOrder.mutate({
      supplierId: data.supplierId,
      items: data.items.map((item) => ({
        productId: item.productId,
        orderedQty: Number(item.orderedQty),
        unitPrice: Number(item.unitPrice),
      })),
    });
  };

  // Keyboard shortcut event listeners
  React.useEffect(() => {
    const handleTriggerNew = () => {
      setIsCreateOpen(true);
    };
    const handleCloseActive = () => {
      closeCreateForm();
      setIsReceiveOpen(false);
      setSelectedOrderId(null);
    };

    window.addEventListener('trigger-new-modal', handleTriggerNew);
    window.addEventListener('close-active-modal', handleCloseActive);

    return () => {
      window.removeEventListener('trigger-new-modal', handleTriggerNew);
      window.removeEventListener('close-active-modal', handleCloseActive);
    };
  }, []);

  // Mal Kabul Başlat
  const startReceiveWorkflow = (orderDetail: any) => {
    const itemsToReceive: ReceiveBatchItem[] = orderDetail.items
      .filter((item: any) => item.orderedQty - item.receivedQty > 0)
      .map((item: any) => ({
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        productBarcode: item.product.barcode,
        orderedQty: item.orderedQty,
        receivedQty: item.receivedQty,
        remainingQty: item.orderedQty - item.receivedQty,
        batchQty: 0, // default 0
        locationId: '', // zorunlu
        isScanned: false,
      }));
    setReceiveItems(itemsToReceive);
    setIsReceiveOpen(true);
  };

  // Barkod Okutulduğunda Eşleştir
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBarcodeError(null);
    if (!barcodeInput.trim()) return;

    const matchedIndex = receiveItems.findIndex(
      (item) => item.productBarcode === barcodeInput.trim()
    );

    if (matchedIndex !== -1) {
      const item = receiveItems[matchedIndex];
      
      // Barkod daha önce eşleştirilmişse tekrar eşleştirme isteme / hata verme
      if (item.isScanned) {
        showToast(`Bu barkod zaten eşleştirildi: ${item.productName}`, 'info');
        setBarcodeInput('');
        return;
      }

      const updated = [...receiveItems];
      updated[matchedIndex] = {
        ...item,
        isScanned: true,
        batchQty: item.batchQty === 0 ? 1 : item.batchQty,
      };
      setReceiveItems(updated);
      setBarcodeInput('');
      showToast(`Barkod eşleştirildi: ${item.productName}`, 'success');
    } else {
      setBarcodeError(`Siparişte bu barkoda sahip ürün bulunamadı: ${barcodeInput}`);
    }
  };

  const handleBatchQtyChange = (index: number, val: number) => {
    const updated = [...receiveItems];
    const item = updated[index];
    const maxQty = item.remainingQty;
    const qty = Math.max(0, Math.min(maxQty, val));
    updated[index] = { 
      ...item, 
      batchQty: qty,
    };
    setReceiveItems(updated);
  };

  const handleLocationChange = (index: number, locationId: string) => {
    const updated = [...receiveItems];
    updated[index] = { ...updated[index], locationId };
    setReceiveItems(updated);
  };

  const submitReceive = () => {
    // Validasyon: lokasyon seçilmemiş ürün var mı kontrol et (eğer batchQty > 0 ise)
    const activeItems = receiveItems.filter((item) => item.batchQty > 0);
    if (activeItems.length === 0) {
      showToast('Lütfen mal kabulü yapmak için en az bir ürüne kabul miktarı girin.', 'warning');
      return;
    }

    const missingLocation = activeItems.some((item) => !item.locationId);
    if (missingLocation) {
      showToast('Kabul miktarı girilen tüm ürünler için depo lokasyonu seçilmesi zorunludur.', 'warning');
      return;
    }

    const hasUnscanned = activeItems.some((item) => !item.isScanned);
    if (hasUnscanned) {
      showToast('Lütfen tüm kabul edilen kalemleri barkod ile eşleştirin.', 'warning');
      return;
    }

    if (!selectedOrderId) return;

    receiveOrderItems.mutate({
      orderId: selectedOrderId,
      items: activeItems.map((item) => ({
        productId: item.productId,
        receivedQty: item.batchQty,
        locationId: item.locationId,
      })),
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return { label: 'Taslak', color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400' };
      case 'SENT':
        return { label: 'Gönderildi', color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30' };
      case 'PARTIAL':
        return { label: 'Kısmi Kabul', color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30' };
      case 'RECEIVED':
        return { label: 'Tamamlandı', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30' };
      case 'CANCELLED':
        return { label: 'İptal Edildi', color: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/30' };
      default:
        return { label: status, color: 'bg-zinc-100 text-zinc-650' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Satın Alma Siparişleri
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Yeni siparişler oluşturun, onay süreçlerini yönetin ve depo mal kabulü yapın.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Yeni Sipariş Oluştur
          <kbd className="hidden md:inline-block px-1.5 py-0.5 rounded bg-indigo-505 text-[10px] font-bold font-mono text-indigo-100">Ctrl+N</kbd>
        </button>
      </div>

      {/* Orders List Table */}
      <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl overflow-hidden shadow-sm">
        {ordersQuery.isLoading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
            ))}
          </div>
        ) : !ordersQuery.data?.items.length ? (
          <div className="text-center py-16">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Henüz satın alma siparişi oluşturulmadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-600 dark:text-zinc-400 font-medium">
                  <th className="px-6 py-4">Sipariş ID</th>
                  <th className="px-6 py-4">Tedarikçi</th>
                  <th className="px-6 py-4">Oluşturma Tarihi</th>
                  <th className="px-6 py-4 text-center">Durum</th>
                  <th className="px-6 py-4 text-right">Sipariş Tutarı</th>
                  <th className="px-6 py-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                {ordersQuery.data.items.map((order) => {
                  const cfg = getStatusConfig(order.status);
                  const total = order.items.reduce(
                    (sum, item) => sum + item.orderedQty * item.unitPrice,
                    0
                  );

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-semibold">
                        <div className="flex flex-col gap-1 items-start">
                          <span>{order.id}</span>
                          {order.isAuto && (
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-605 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                              Otomatik
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-50">
                        {order.supplier.name}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                        {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-zinc-900 dark:text-zinc-50">
                        ₺{total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedOrderId(order.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detaylar
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

      {/* Create Order Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeCreateForm} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-150 dark:border-zinc-800/80">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Yeni Satın Alma Siparişi
              </h2>
              <button onClick={closeCreateForm} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitCreate)} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Tedarikçi Seçin *
                </label>
                <select
                  {...register('supplierId', { required: 'Tedarikçi seçimi zorunludur' })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Seçiniz...</option>
                  {suppliersQuery.data?.items.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Rating: {s.rating}★)
                    </option>
                  ))}
                </select>
                {errors.supplierId && <p className="text-xs text-red-500 mt-1">{errors.supplierId.message}</p>}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    Sipariş Kalemleri
                  </label>
                  <button
                    type="button"
                    onClick={() => append({ productId: '', orderedQty: 1, unitPrice: 0 })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-xs font-semibold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Kalem Ekle
                  </button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-12 gap-3 items-end bg-zinc-50/50 dark:bg-zinc-800/10 p-3 rounded-xl border border-zinc-150 dark:border-zinc-850"
                    >
                      <div className="col-span-5">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                          Ürün *
                        </label>
                        <select
                          {...register(`items.${index}.productId`, { required: 'Ürün zorunlu' })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                        >
                          <option value="">Seçiniz...</option>
                          {productsQuery.data?.items.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                          Miktar *
                        </label>
                        <input
                          type="number"
                          {...register(`items.${index}.orderedQty`, {
                            required: true,
                            valueAsNumber: true,
                            min: 1,
                          })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                          placeholder="Adet"
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                          Birim Fiyat (₺) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.unitPrice`, {
                            required: true,
                            valueAsNumber: true,
                            min: 0,
                          })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                          placeholder="Fiyat"
                        />
                      </div>

                      <div className="col-span-1 flex justify-center pb-0.5">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={closeCreateForm}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={createOrder.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm disabled:opacity-50"
                >
                  {createOrder.isPending ? 'Oluşturuluyor...' : 'Taslak Olarak Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOrderId(null)} />
          <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-150 dark:border-zinc-800/80">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  Sipariş Detayı
                  {detailQuery.data?.isAuto && (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-605 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/20">
                      Otomatik Oluşturuldu
                    </span>
                  )}
                </h2>
                <p className="text-xs font-mono text-zinc-400 mt-0.5">Sipariş No: {selectedOrderId}</p>
              </div>
              <button
                onClick={() => setSelectedOrderId(null)}
                className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailQuery.isLoading ? (
              <div className="py-12 space-y-4">
                <div className="h-6 w-1/3 bg-zinc-100 dark:bg-zinc-800/50 rounded animate-pulse" />
                <div className="h-24 bg-zinc-100 dark:bg-zinc-800/50 rounded animate-pulse" />
              </div>
            ) : detailQuery.data ? (
              <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-2">
                {/* Supplier & Status Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50/50 dark:bg-zinc-800/10 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850">
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tedarikçi Bilgileri</span>
                    <p className="font-bold text-zinc-900 dark:text-zinc-50">{detailQuery.data.supplier.name}</p>
                    <p className="text-xs text-zinc-500">{detailQuery.data.supplier.contactName || 'İletişim kişisi belirtilmedi'}</p>
                  </div>
                  <div className="space-y-1.5 md:text-right flex flex-col md:items-end justify-between">
                    <div>
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Sipariş Durumu</span>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                          getStatusConfig(detailQuery.data.status).color
                        }`}
                      >
                        {getStatusConfig(detailQuery.data.status).label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-zinc-850 dark:text-zinc-200">Sipariş Kalemleri</h3>
                  <div className="overflow-x-auto rounded-xl border border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-950/20">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-zinc-150 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-800/30 text-zinc-500 font-bold uppercase tracking-wider">
                          <th className="px-4 py-3">Ürün / SKU</th>
                          <th className="px-4 py-3 text-right">Sipariş</th>
                          <th className="px-4 py-3 text-right">Kabul Edilen</th>
                          <th className="px-4 py-3 text-right">Birim Fiyat</th>
                          <th className="px-4 py-3 text-right">Kalan Miktar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
                        {detailQuery.data.items.map((item) => (
                          <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{item.product.name}</p>
                              <p className="text-[10px] text-zinc-400">{item.product.sku}</p>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">{item.orderedQty}</td>
                            <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-450 font-bold">
                              {item.receivedQty}
                            </td>
                            <td className="px-4 py-3 text-right">
                              ₺{item.unitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">
                              {item.orderedQty - item.receivedQty === 0 ? (
                                <span className="text-zinc-400">Tamamlandı</span>
                              ) : (
                                <span className="text-rose-500">{item.orderedQty - item.receivedQty}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom Action Workflow */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-800/80">
                  <div className="text-xs">
                    <span className="text-zinc-500">Toplam Sipariş Tutarı:</span>
                    <span className="block text-lg font-extrabold text-zinc-900 dark:text-zinc-50 mt-0.5">
                      ₺
                      {detailQuery.data.items
                        .reduce((sum, item) => sum + item.orderedQty * item.unitPrice, 0)
                        .toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Workflow status triggers */}
                    {detailQuery.data.status === 'DRAFT' && (
                      <>
                        <button
                          onClick={() =>
                            updateStatus.mutate({ id: detailQuery.data.id, status: 'CANCELLED' })
                          }
                          disabled={updateStatus.isPending}
                          className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all disabled:opacity-50"
                        >
                          Siparişi İptal Et
                        </button>
                        <button
                          onClick={() =>
                            updateStatus.mutate({ id: detailQuery.data.id, status: 'SENT' })
                          }
                          disabled={updateStatus.isPending}
                          className="px-4 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-650/20 disabled:opacity-50"
                        >
                          Tedarikçiye Gönder (Yola Çıktı)
                        </button>
                      </>
                    )}

                    {(detailQuery.data.status === 'SENT' || detailQuery.data.status === 'PARTIAL') && (
                      <>
                        <button
                          onClick={() =>
                            updateStatus.mutate({ id: detailQuery.data.id, status: 'CANCELLED' })
                          }
                          disabled={updateStatus.isPending}
                          className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all disabled:opacity-50"
                        >
                          Siparişi İptal Et
                        </button>
                        <button
                          onClick={() => startReceiveWorkflow(detailQuery.data)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                        >
                          <Barcode className="w-4 h-4" />
                          Mal Kabul Yap
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Mal Kabul (Receive Items) Modal */}
      {isReceiveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsReceiveOpen(false)} />
          <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-150 dark:border-zinc-800/80 mb-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Barcode className="w-5 h-5 text-indigo-500" />
                  Depo Mal Kabul Girişi
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Barkod okutarak veya manuel kabul miktarlarını girerek ürünleri stok lokasyonlarına yerleştirin.
                </p>
              </div>
              <button onClick={() => setIsReceiveOpen(false)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barkod Okuyucu Input Panel */}
            <form onSubmit={handleBarcodeSubmit} className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-2">
              <div className="flex gap-2 items-center">
                <Barcode className="w-5 h-5 text-zinc-400" />
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Hızlı Barkod Girişi:</label>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Barkodu elle girin veya barkod okuyucuyla okutun..."
                  value={barcodeInput}
                  onChange={(e) => {
                    setBarcodeInput(e.target.value);
                    if (barcodeError) setBarcodeError(null);
                  }}
                  className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-950/20 rounded-lg text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-650 text-white rounded-lg text-xs font-semibold"
                >
                  Eşleştir
                </button>
              </div>
              {barcodeError && <p className="text-[10px] text-rose-500 font-medium">{barcodeError}</p>}
            </form>

            {/* Items Table */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="space-y-3">
                {receiveItems.map((item, index) => {
                  const isScannedAndActive = item.batchQty > 0 && item.isScanned;
                  const isUnscannedError = item.batchQty > 0 && !item.isScanned;
                  return (
                    <div
                      key={item.productId}
                      className={`p-4 rounded-xl border grid grid-cols-12 gap-4 items-center transition-all ${
                        isUnscannedError 
                          ? 'border-rose-400 bg-rose-50/5 dark:border-rose-900/40' 
                          : isScannedAndActive
                          ? 'border-emerald-500 bg-emerald-50/5 dark:border-emerald-900/30'
                          : 'border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-950/20'
                      }`}
                    >
                      {/* Item Details */}
                      <div className="col-span-5 space-y-1">
                        <div className="flex flex-col gap-1 items-start">
                          <p className="font-bold text-xs text-zinc-900 dark:text-zinc-50 truncate">
                            {item.productName}
                          </p>
                          {item.batchQty > 0 && (
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              item.isScanned 
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' 
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-455 border border-rose-100 dark:border-rose-900/20'
                            }`}>
                              {item.isScanned ? 'Barkod Eşleşti' : 'Barkod Taraması Gerekli'}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400">SKU: {item.productSku}</p>
                        {item.productBarcode && (
                          <p className="text-[10px] text-zinc-500 font-semibold">Barkod: {item.productBarcode}</p>
                        )}
                        <p className="text-[10px] text-zinc-500">
                          Sipariş: {item.orderedQty} | Kalan: {item.remainingQty}
                        </p>
                      </div>

                    {/* Batch Receive Qty Input */}
                    <div className="col-span-3">
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">
                        Kabul Miktarı *
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={item.batchQty || ''}
                          onChange={(e) => handleBatchQtyChange(index, Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-800 text-xs rounded-lg text-center"
                          min="0"
                          max={item.remainingQty}
                        />
                        <button
                          type="button"
                          onClick={() => handleBatchQtyChange(index, item.remainingQty)}
                          className="px-1.5 py-1 text-[9px] font-bold border border-zinc-200 dark:border-zinc-750 rounded text-zinc-500 hover:bg-zinc-50"
                        >
                          MAX
                        </button>
                      </div>
                    </div>

                    {/* Target Storage Location (COMPULSORY) */}
                    <div className="col-span-4">
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">
                        Kabul Raf Lokasyonu *
                      </label>
                      <select
                        value={item.locationId}
                        onChange={(e) => handleLocationChange(index, e.target.value)}
                        disabled={item.batchQty <= 0}
                        required={item.batchQty > 0}
                        className="w-full px-2 py-1.5 border border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-800 text-xs rounded-lg disabled:opacity-30"
                      >
                        <option value="">Seçiniz...</option>
                        {locationsQuery.data?.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.zone}-{loc.aisle || 'x'}-{loc.shelf || 'x'}-{loc.bin || 'x'} ({loc.warehouse.name})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
              );
            })}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800/80 flex gap-3 mt-4">
              <button
                onClick={() => setIsReceiveOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Kapat
              </button>
              <button
                onClick={submitReceive}
                disabled={receiveOrderItems.isPending}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs disabled:opacity-50 transition-colors"
              >
                {receiveOrderItems.isPending ? 'Kaydediliyor...' : 'Mal Kabulü Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
