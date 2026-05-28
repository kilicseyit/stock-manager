'use client';

import React, { useState } from 'react';
import { 
  FolderTree, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  Folder, 
  Layers, 
  AlertCircle, 
  Check, 
  X,
  LayoutGrid,
  List,
} from 'lucide-react';
import { trpc } from '@/trpc/client';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';

interface TreeCategoryNode {
  id: string;
  name: string;
  parentId: string | null;
  _count: { products: number };
  children?: TreeCategoryNode[];
}

export default function CategoriesPage() {
  const utils = trpc.useUtils();

  // Queries
  const { data: categoryTree, isLoading: treeLoading } = trpc.category.getTree.useQuery();
  const { data: flatCategories, isLoading: flatLoading } = trpc.category.getAll.useQuery();

  // Mutations
  const createMutation = trpc.category.create.useMutation({
    onSuccess: () => {
      utils.category.getTree.invalidate();
      utils.category.getAll.invalidate();
      resetForm();
    },
    onError: (err) => {
      setErrorMsg(err.message);
    }
  });

  const updateMutation = trpc.category.update.useMutation({
    onSuccess: () => {
      utils.category.getTree.invalidate();
      utils.category.getAll.invalidate();
      resetForm();
    },
    onError: (err) => {
      setErrorMsg(err.message);
    }
  });

  const deleteMutation = trpc.category.delete.useMutation({
    onSuccess: () => {
      utils.category.getTree.invalidate();
      utils.category.getAll.invalidate();
      setCategoryToDelete(null);
    },
    onError: (err) => {
      setDeleteErrorMsg(err.message);
    }
  });

  // State
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; parentId: string | null } | null>(null);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);

  // View Mode — 'tree' | 'card' (persisted in localStorage)
  const [viewMode, setViewMode] = useState<'tree' | 'card'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('categories_view_mode') as 'tree' | 'card') || 'tree';
    }
    return 'tree';
  });

  const handleViewMode = (mode: 'tree' | 'card') => {
    setViewMode(mode);
    localStorage.setItem('categories_view_mode', mode);
  };

  // Form helpers
  const resetForm = () => {
    setName('');
    setParentId('');
    setEditingCategory(null);
    setErrorMsg(null);
  };

  const handleEditClick = (cat: { id: string; name: string; parentId: string | null }) => {
    setEditingCategory(cat);
    setName(cat.name);
    setParentId(cat.parentId || '');
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Kategori adı zorunludur.');
      return;
    }

    const payloadParentId = parentId === '' ? null : parentId;

    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
        name: name.trim(),
        parentId: payloadParentId,
      });
    } else {
      createMutation.mutate({
        name: name.trim(),
        parentId: payloadParentId || undefined,
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (!categoryToDelete) return;
    setDeleteErrorMsg(null);
    deleteMutation.mutate({ id: categoryToDelete.id });
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isLoading = treeLoading || flatLoading;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Filter out the category itself during editing to prevent circular parent relations
  const parentOptions = flatCategories?.filter(
    (c) => !editingCategory || c.id !== editingCategory.id
  ) || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100/50 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <FolderTree className="w-6 h-6" />
            </span>
            Kategori Yönetimi
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Hiyerarşik ürün kategorilerini ağaç yapısında düzenleyin ve yönetin.
          </p>
        </div>
        {/* View Mode Toggle */}
        <div className="flex items-center gap-0.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => handleViewMode('tree')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'tree'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
            title="Ağaç Görünümü"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleViewMode('card')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'card'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
            title="Kart Görünümü"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className={viewMode === 'card' ? 'flex flex-col gap-8' : 'grid grid-cols-1 lg:grid-cols-3 gap-8'}>
        
        {/* Left Column: Tree Visualizer or Card Grid */}
        <div className={`${viewMode === 'card' ? '' : 'lg:col-span-2'} p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl shadow-sm space-y-6`}>
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <h2 className="font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Layers className="w-5 h-5 text-zinc-500" />
              {viewMode === 'card' ? 'Tüm Kategoriler' : 'Kategori Hiyerarşisi'}
            </h2>
            {categoryTree && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {flatCategories?.length || 0} Kategori
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm font-medium">Kategori ağacı yükleniyor...</p>
            </div>
          ) : viewMode === 'card' ? (
            /* Card Grid View */
            (!flatCategories || flatCategories.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                  <Folder className="w-10 h-10" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Kategori Bulunamadı</h3>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {flatCategories?.map((cat) => (
                  <div
                    key={cat.id}
                    className="group relative flex flex-col gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default"
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      cat.parent ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' : 'bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                    }`}>
                      <Folder className="w-5 h-5" />
                    </div>

                    {/* Name & parent */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{cat.name}</p>
                      {cat.parent && (
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                          ↳ {cat.parent.name}
                        </p>
                      )}
                    </div>

                    {/* Product count badge */}
                    <span className={`self-start text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      cat.parent
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                        : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
                    }`}>
                      {cat._count.products} Ürün
                    </span>

                    {/* Hover actions */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick({ id: cat.id, name: cat.name, parentId: cat.parentId })}
                        className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-colors"
                        title="Düzenle"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setCategoryToDelete({ id: cat.id, name: cat.name })}
                        className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 shadow-sm transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : !categoryTree || categoryTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                <Folder className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Kategori Bulunamadı</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
                  Kataloğunuzu organize etmek için henüz bir kategori oluşturmadınız. Sağdaki formu kullanarak hemen ekleyebilirsiniz.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100/50 dark:divide-zinc-800/30">
              {categoryTree.map((root) => {
                const rootHasChildren = root.children && root.children.length > 0;
                const isRootExpanded = !!expandedIds[root.id];
                
                return (
                  <div key={root.id} className="py-3 first:pt-0 last:pb-0">
                    {/* Level 1: Root Node */}
                    <div className="flex items-center justify-between group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 px-3 py-2 rounded-xl transition-all">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {rootHasChildren ? (
                          <button 
                            onClick={() => toggleExpand(root.id)} 
                            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          >
                            {isRootExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <div className="w-6" /> // spacer
                        )}
                        <Folder className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm truncate">
                          {root.name}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                          {root._count.products} Ürün
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick({ id: root.id, name: root.name, parentId: root.parentId })}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-zinc-800 shadow-sm border border-transparent hover:border-zinc-200/50 dark:hover:border-zinc-700/50 transition-all"
                          title="Düzenle"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setCategoryToDelete({ id: root.id, name: root.name })}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-zinc-800 shadow-sm border border-transparent hover:border-zinc-200/50 dark:hover:border-zinc-700/50 transition-all"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Level 2: Children Nodes */}
                    {rootHasChildren && isRootExpanded && (
                      <div className="mt-1 ml-6 pl-4 border-l border-zinc-200/60 dark:border-zinc-800/60 space-y-1">
                        {root.children?.map((child) => {
                          const childHasChildren = child.children && child.children.length > 0;
                          const isChildExpanded = !!expandedIds[child.id];

                          return (
                            <div key={child.id} className="py-1">
                              <div className="flex items-center justify-between group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 px-3 py-1.5 rounded-lg transition-all">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {childHasChildren ? (
                                    <button 
                                      onClick={() => toggleExpand(child.id)} 
                                      className="p-1 rounded bg-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                      {isChildExpanded ? (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  ) : (
                                    <div className="w-5.5" /> // spacer
                                  )}
                                  <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                                  <span className="font-medium text-zinc-700 dark:text-zinc-300 text-sm truncate">
                                    {child.name}
                                  </span>
                                  <span className="text-[10px] font-medium px-1.5 py-0.2 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 shrink-0">
                                    {child._count.products} Ürün
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleEditClick({ id: child.id, name: child.name, parentId: child.parentId })}
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-zinc-800 shadow-sm border border-transparent hover:border-zinc-200/50 dark:hover:border-zinc-700/50 transition-all"
                                    title="Düzenle"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setCategoryToDelete({ id: child.id, name: child.name })}
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-zinc-800 shadow-sm border border-transparent hover:border-zinc-200/50 dark:hover:border-zinc-700/50 transition-all"
                                    title="Sil"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Level 3: Grandchildren Nodes */}
                              {childHasChildren && isChildExpanded && (
                                <div className="mt-1 ml-5 pl-4 border-l border-dashed border-zinc-200 dark:border-zinc-850 space-y-1">
                                  {child.children?.map((grandchild) => (
                                    <div 
                                      key={grandchild.id} 
                                      className="flex items-center justify-between group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 px-3 py-1 rounded-lg transition-all"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-3" />
                                        <Folder className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                        <span className="text-zinc-600 dark:text-zinc-400 text-sm truncate">
                                          {grandchild.name}
                                        </span>
                                        <span className="text-[10px] px-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 shrink-0">
                                          {grandchild._count.products} Ürün
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => handleEditClick({ id: grandchild.id, name: grandchild.name, parentId: grandchild.parentId })}
                                          className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-zinc-800 shadow-sm border border-transparent hover:border-zinc-200/50 dark:hover:border-zinc-700/50 transition-all"
                                          title="Düzenle"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => setCategoryToDelete({ id: grandchild.id, name: grandchild.name })}
                                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-zinc-800 shadow-sm border border-transparent hover:border-zinc-200/50 dark:hover:border-zinc-700/50 transition-all"
                                          title="Sil"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Add/Edit Panel */}
        <div className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl shadow-sm h-fit space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <h2 className="font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              {editingCategory ? (
                <>
                  <Pencil className="w-4 h-4 text-indigo-500" />
                  Kategori Düzenle
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-indigo-500" />
                  Yeni Kategori Ekle
                </>
              )}
            </h2>
            {editingCategory && (
              <button 
                onClick={resetForm}
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 flex items-center gap-1 font-medium"
              >
                <X className="w-3 h-3" />
                İptal Et
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Kategori Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Örn. Tüketici Elektroniği"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            {/* Parent Dropdown */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Üst Kategori
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                disabled={isSaving || flatLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              >
                <option value="">(Ana Kategori)</option>
                {parentOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.parent ? `\u00a0\u00a0\u00a0└ ${opt.name}` : opt.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                Alt kategori oluşturmak için bir üst kategori seçin. Boş bırakırsanız ana kategori olarak kaydedilir.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full mt-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-500/50 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editingCategory ? (
                <Check className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {editingCategory ? 'Değişiklikleri Kaydet' : 'Kategori Oluştur'}
            </button>
          </form>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmDialog
        isOpen={!!categoryToDelete}
        onClose={() => { setCategoryToDelete(null); setDeleteErrorMsg(null); }}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
        title="Kategoriyi Sil"
        description={
          deleteErrorMsg 
            ? deleteErrorMsg
            : `"${categoryToDelete?.name}" kategorisini silmek istediğinize emin misiniz? Bu kategoriye bağlı tüm ürünlerin kategori bilgisi kaldırılacaktır.`
        }
      />
    </div>
  );
}
