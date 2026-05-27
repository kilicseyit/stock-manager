'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  FileSpreadsheet, 
  Pencil, 
  Trash2, 
  AlertTriangle, 
  Loader2, 
  ChevronRight, 
  ArrowRight, 
  AlertCircle,
  Inbox,
  CheckCircle2
} from 'lucide-react';
import { trpc } from '@/trpc/client';
import { useDebounce } from '@/hooks/useDebounce';
import ProductFormModal from '@/components/features/products/ProductFormModal';
import ImportModal from '@/components/features/products/ImportModal';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  categoryId: string | null;
  unit: string;
  barcode: string | null;
  imageUrl: string | null;
  minStock: number;
  maxStock: number | null;
  createdAt: string | Date;
  category: { id: string; name: string } | null;
  stockItems: { quantity: number }[];
}

export default function ProductsPage() {
  const utils = trpc.useUtils();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Pagination state
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [accumulatedProducts, setAccumulatedProducts] = useState<ProductItem[]>([]);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  
  const [isImportOpen, setIsImportOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [productToDelete, setProductToDelete] = useState<any | null>(null);

  // Success alert state
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Queries
  const { data: categories } = trpc.category.getAll.useQuery();
  
  const { data: queryData, isLoading, isFetching } = trpc.product.getAll.useQuery(
    {
      search: debouncedSearch || undefined,
      categoryId: selectedCategory || undefined,
      cursor: cursor,
      limit: 10,
    },
    {
      placeholderData: (prev) => prev,
    }
  );

  // Mutations
  const createProduct = trpc.product.create.useMutation({
    onSuccess: () => {
      triggerAlert('success', 'Ürün başarıyla oluşturuldu.');
      handleResetSearch();
      setIsFormOpen(false);
    },
    onError: (err) => {
      triggerAlert('error', `Ürün oluşturulurken hata: ${err.message}`);
    }
  });

  const updateProduct = trpc.product.update.useMutation({
    onSuccess: () => {
      triggerAlert('success', 'Ürün başarıyla güncellendi.');
      handleResetSearch();
      setIsFormOpen(false);
    },
    onError: (err) => {
      triggerAlert('error', `Ürün güncellenirken hata: ${err.message}`);
    }
  });

  const deleteProduct = trpc.product.delete.useMutation({
    onSuccess: () => {
      triggerAlert('success', 'Ürün başarıyla silindi.');
      handleResetSearch();
      setProductToDelete(null);
    },
    onError: (err) => {
      triggerAlert('error', `Ürün silinemedi: ${err.message}`);
      setProductToDelete(null);
    }
  });

  /* eslint-disable */
  // Handle Search/Filter changes -> Reset list
  useEffect(() => {
    setAccumulatedProducts([]);
    setCursor(undefined);
  }, [debouncedSearch, selectedCategory]);

  // Append new page items
  useEffect(() => {
    if (queryData?.items) {
      setAccumulatedProducts((prev) => {
        // Prevent duplicate keys
        const existingIds = new Set(prev.map(p => p.id));
        const filteredNew = (queryData.items as unknown as ProductItem[]).filter(p => !existingIds.has(p.id));
        return [...prev, ...filteredNew];
      });
    }
  }, [queryData]);
  /* eslint-enable */

  // Alert triggers
  const triggerAlert = (type: 'success' | 'error', text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage(null), 5000);
  };

  const handleResetSearch = () => {
    setAccumulatedProducts([]);
    setCursor(undefined);
    utils.product.getAll.invalidate();
  };

  const handleLoadMore = () => {
    if (queryData?.nextCursor) {
      setCursor(queryData.nextCursor);
    }
  };

  // Form modal triggers
  const handleCreateClick = () => {
    setFormMode('create');
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditClick = (product: any) => {
    setFormMode('edit');
    setEditingProduct({
      id: product.id,
      name: product.name,
      categoryId: product.categoryId || '',
      unit: product.unit,
      barcode: product.barcode || '',
      minStock: product.minStock,
      maxStock: product.maxStock || undefined,
      imageUrl: product.imageUrl || '',
    });
    setIsFormOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFormSubmit = (formData: any) => {
    if (formMode === 'create') {
      createProduct.mutate(formData);
    } else if (formMode === 'edit' && editingProduct) {
      updateProduct.mutate({
        id: editingProduct.id,
        ...formData,
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteProduct.mutate({ id: productToDelete.id });
    }
  };

  // Helper: Sum stock quantities
  const getProductStock = (stockItems: { quantity: number }[]) => {
    return stockItems.reduce((acc, curr) => acc + curr.quantity, 0);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Alert Banner */}
      {alertMessage && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border animate-in fade-in slide-in-from-top-4 duration-300 ${
          alertMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-150 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/90 border-rose-150 dark:border-rose-900 text-rose-800 dark:text-rose-300'
        }`}>
          {alertMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span className="text-sm font-semibold">{alertMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100/50 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <Package className="w-6 h-6" />
            </span>
            Ürün Kataloğu
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Otomatik SKU, barkod takibi ve minimum stok alarmları ile ürün envanterini yönetin.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsImportOpen(true)}
            className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Toplu İçe Aktar
          </button>
          
          <button
            onClick={handleCreateClick}
            className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-2 shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Yeni Ürün
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl shadow-sm">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Ürün adı, SKU veya barkod ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
          />
        </div>

        {/* Category Select */}
        <div className="w-full md:w-64 relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm appearance-none"
          >
            <option value="">Tüm Kategoriler</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.parent ? `${cat.parent.name} > ` : ''}{cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table / Cards Panel */}
      <div className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl shadow-sm overflow-hidden">
        {isLoading && accumulatedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-sm font-semibold">Ürün listesi yükleniyor...</p>
          </div>
        ) : accumulatedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 animate-fadeIn">
            <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500">
              <Inbox className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Hiç Ürün Bulunamadı</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
                Arama kriterlerinize uyan veya veritabanında kayıtlı bir ürün bulunmamaktadır.
              </p>
            </div>
            {(search || selectedCategory) && (
              <button
                onClick={() => { setSearch(''); setSelectedCategory(''); }}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-semibold text-xs uppercase tracking-wider">
                    <th className="pb-4 font-semibold w-14">Görsel</th>
                    <th className="pb-4 font-semibold w-32">SKU</th>
                    <th className="pb-4 font-semibold">Ürün Adı</th>
                    <th className="pb-4 font-semibold">Kategori</th>
                    <th className="pb-4 font-semibold text-right w-28">Mevcut Stok</th>
                    <th className="pb-4 font-semibold text-right w-28">Min Stok</th>
                    <th className="pb-4 font-semibold text-center w-28">Birim</th>
                    <th className="pb-4 font-semibold text-right w-24">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100/50 dark:divide-zinc-800/40">
                  {accumulatedProducts.map((product) => {
                    const totalStock = getProductStock(product.stockItems);
                    const isOutOfStock = totalStock === 0;
                    const isLowStock = totalStock <= product.minStock;

                    return (
                      <tr 
                        key={product.id} 
                        className="text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50/40 dark:hover:bg-zinc-850/10 group transition-all"
                      >
                        {/* Thumbnail Image */}
                        <td className="py-3.5">
                          {product.imageUrl ? (
                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-zinc-200/50 dark:border-zinc-700/50 bg-white">
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-450 dark:text-zinc-500 border border-transparent dark:border-zinc-800">
                              <Package className="w-4.5 h-4.5" />
                            </div>
                          )}
                        </td>

                        {/* SKU Badge */}
                        <td className="py-3.5">
                          <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/30 dark:border-zinc-750 text-zinc-800 dark:text-zinc-200">
                            {product.sku}
                          </span>
                        </td>

                        {/* Name & Barcode */}
                        <td className="py-3.5 pr-4">
                          <div>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate block max-w-xs sm:max-w-md">
                              {product.name}
                            </span>
                            {product.barcode && (
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5 block">
                                Barkod: {product.barcode}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category Badge */}
                        <td className="py-3.5">
                          {product.category ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                              {product.category.name}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-400 dark:text-zinc-650">
                              (Yok)
                            </span>
                          )}
                        </td>

                        {/* Current Stock */}
                        <td className="py-3.5 text-right font-bold">
                          {isOutOfStock ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100/50 dark:border-rose-900/20">
                              Stok Yok
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 border border-amber-100/50 dark:border-amber-900/20">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              {totalStock} {product.unit}
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100/50 dark:border-emerald-900/20">
                              {totalStock} {product.unit}
                            </span>
                          )}
                        </td>

                        {/* Minimum Stock Limit */}
                        <td className="py-3.5 text-right text-zinc-500 dark:text-zinc-400 font-medium">
                          {product.minStock}
                        </td>

                        {/* Unit Name */}
                        <td className="py-3.5 text-center text-xs text-zinc-400 dark:text-zinc-500 capitalize">
                          {product.unit}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditClick(product)}
                              className="p-2 rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-zinc-800 shadow-sm border border-transparent hover:border-zinc-200/50 dark:hover:border-zinc-700/50 transition-all"
                              title="Düzenle"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => setProductToDelete(product)}
                              className="p-2 rounded-lg text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-zinc-800 shadow-sm border border-transparent hover:border-zinc-200/50 dark:hover:border-zinc-700/50 transition-all"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Load More Pagination */}
            {queryData?.nextCursor && (
              <div className="flex justify-center pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={handleLoadMore}
                  disabled={isFetching}
                  className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-650 bg-white dark:bg-zinc-900 hover:bg-zinc-550 dark:hover:bg-zinc-850 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Daha Fazla Yükle
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {isFormOpen && (
        <ProductFormModal
          isOpen={isFormOpen}
          mode={formMode}
          categories={categories || []}
          defaultValues={editingProduct || undefined}
          isLoading={createProduct.isPending || updateProduct.isPending}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Bulk Import Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={handleResetSearch}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteProduct.isPending}
        title="Ürünü Sil"
        description={`"${productToDelete?.name}" (${productToDelete?.sku}) ürününü silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm stok verileri temizlenir.`}
      />
    </div>
  );
}
