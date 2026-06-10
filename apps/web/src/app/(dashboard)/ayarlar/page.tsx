'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { useForm } from 'react-hook-form';
import {
  Settings,
  User,
  Warehouse,
  Info,
  Plus,
  Edit2,
  Trash2,
  X,
  Lock,
  Mail,
  MapPin,
  Cpu,
  ChevronRight,
} from 'lucide-react';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';
import { useToast } from '@/components/ui/Toast';

type SettingsTab = 'profile' | 'warehouse' | 'system';

interface ProfileFormValues {
  name: string;
  email: string;
  password?: string;
}

interface WarehouseFormValues {
  name: string;
  address: string;
  timezone: string;
}

export default function AyarlarPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Depo yönetimi modal/düzenleme durumları
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(false);
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);
  const [deleteWarehouseId, setDeleteWarehouseId] = useState<string | null>(null);

  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // Queries
  const currentUserQuery = trpc.user.getCurrentUser.useQuery(
    { email: session?.user?.email || '' },
    { enabled: !!session?.user?.email, refetchOnWindowFocus: false }
  );

  const warehousesQuery = trpc.location.getWarehouses.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  // Mutations
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: async (data) => {
      setProfileSuccessMsg('Profil bilgileriniz başarıyla güncellendi.');
      setProfileErrorMsg(null);
      // NextAuth session'ı yerel olarak güncelle
      await updateSession({
        user: {
          ...session?.user,
          name: data.name,
          email: data.email,
        },
      });
      currentUserQuery.refetch();
    },
    onError: (err) => {
      setProfileErrorMsg(err.message || 'Profil güncellenirken hata oluştu.');
      setProfileSuccessMsg(null);
    },
  });

  const createWarehouse = trpc.location.createWarehouse.useMutation({
    onSuccess: () => {
      utils.location.getWarehouses.invalidate();
      closeWarehouseForm();
    },
  });

  const updateWarehouse = trpc.location.updateWarehouse.useMutation({
    onSuccess: () => {
      utils.location.getWarehouses.invalidate();
      closeWarehouseForm();
    },
  });

  const deleteWarehouse = trpc.location.deleteWarehouse.useMutation({
    onSuccess: () => {
      utils.location.getWarehouses.invalidate();
      setDeleteWarehouseId(null);
      showToast('Depo başarıyla silindi.', 'success');
    },
    onError: (err) => {
      showToast(err.message || 'Depo silinirken hata oluştu.', 'error');
      setDeleteWarehouseId(null);
    },
  });

  // Forms
  const profileForm = useForm<ProfileFormValues>({
    defaultValues: { name: '', email: '', password: '' },
    values: currentUserQuery.data
      ? { name: currentUserQuery.data.name, email: currentUserQuery.data.email, password: '' }
      : undefined,
  });

  const warehouseForm = useForm<WarehouseFormValues>({
    defaultValues: { name: '', address: '', timezone: 'Europe/Istanbul' },
  });

  // Profil Kaydet
  const onSubmitProfile = (data: ProfileFormValues) => {
    if (!currentUserQuery.data?.id) return;
    updateProfile.mutate({
      id: currentUserQuery.data.id,
      name: data.name,
      email: data.email,
      password: data.password || undefined,
    });
  };

  // Depo Ekle/Düzenle
  const openEditWarehouse = (wh: any) => {
    setEditingWarehouseId(wh.id);
    warehouseForm.setValue('name', wh.name);
    warehouseForm.setValue('address', wh.address || '');
    warehouseForm.setValue('timezone', wh.timezone || 'Europe/Istanbul');
    setIsWarehouseOpen(true);
  };

  const closeWarehouseForm = () => {
    setIsWarehouseOpen(false);
    setEditingWarehouseId(null);
    warehouseForm.reset({ name: '', address: '', timezone: 'Europe/Istanbul' });
  };

  const onSubmitWarehouse = (data: WarehouseFormValues) => {
    if (editingWarehouseId) {
      updateWarehouse.mutate({
        id: editingWarehouseId,
        name: data.name,
        address: data.address || null,
        timezone: data.timezone,
      });
    } else {
      createWarehouse.mutate({
        name: data.name,
        address: data.address || undefined,
        timezone: data.timezone,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
          <Settings className="w-8 h-8 text-indigo-600" />
          Sistem Ayarları
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Kullanıcı profilinizi güncelleyin, depoları yönetin ve sistem ayrıntılarını kontrol edin.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-850 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <User className="w-4 h-4" />
          Profil Ayarları
        </button>
        <button
          onClick={() => setActiveTab('warehouse')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'warehouse'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          Depo Yönetimi
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'system'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <Info className="w-4 h-4" />
          Sistem Bilgileri
        </button>
        {session?.user?.role === 'SUPER_ADMIN' && (
          <button
            onClick={() => router.push('/ayarlar/email-sablonlari')}
            className="pb-3 flex items-center gap-2 border-b-2 border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all"
          >
            <Mail className="w-4 h-4" />
            Email Şablonları
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="max-w-xl p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 backdrop-blur-xl shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" /> Profil Bilgilerini Güncelle
            </h2>

            {currentUserQuery.isLoading ? (
              <div className="space-y-4 py-4 animate-pulse">
                <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
                <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
              </div>
            ) : (
              <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Ad Soyad *</label>
                  <input
                    type="text"
                    {...profileForm.register('name', { required: 'Ad soyad zorunludur' })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:border-indigo-500"
                  />
                  {profileForm.formState.errors.name && (
                    <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> E-posta Adresi *
                  </label>
                  <input
                    type="email"
                    {...profileForm.register('email', { required: 'E-posta adresi zorunludur' })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:border-indigo-500"
                  />
                  {profileForm.formState.errors.email && (
                    <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)
                  </label>
                  <input
                    type="password"
                    {...profileForm.register('password', {
                      minLength: { value: 6, message: 'Şifre en az 6 karakter olmalıdır' },
                    })}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:border-indigo-500"
                  />
                  {profileForm.formState.errors.password && (
                    <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.password.message}</p>
                  )}
                </div>

                {profileSuccessMsg && (
                  <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                    {profileSuccessMsg}
                  </p>
                )}

                {profileErrorMsg && (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-lg border border-rose-100 dark:border-rose-900/30">
                    {profileErrorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 active:scale-98"
                >
                  {updateProfile.isPending ? 'Güncelleniyor...' : 'Profil Bilgilerini Kaydet'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* WAREHOUSE TAB */}
        {activeTab === 'warehouse' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-indigo-500" /> Depo Listesi ve Yönetimi
              </h2>
              <button
                onClick={() => setIsWarehouseOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-705 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" /> Yeni Depo Ekle
              </button>
            </div>

            <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl overflow-hidden shadow-sm">
              {warehousesQuery.isLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
                  ))}
                </div>
              ) : !warehousesQuery.data?.length ? (
                <div className="py-12 text-center text-zinc-400">Sistemde kayıtlı depo bulunmuyor.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-650 font-bold uppercase tracking-wider text-[11px]">
                        <th className="px-6 py-4">Depo Adı</th>
                        <th className="px-6 py-4">Adres / Konum</th>
                        <th className="px-6 py-4">Saat Dilimi</th>
                        <th className="px-6 py-4 text-center">Kayıtlı Raf Matrisi</th>
                        <th className="px-6 py-4 text-right">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                      {warehousesQuery.data.map((wh) => (
                        <tr key={wh.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                          <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-50">{wh.name}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-zinc-500">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{wh.address || 'Girilmedi'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs">{wh.timezone}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400">
                              {wh._count?.locations || 0} lokasyon
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-1">
                            <button
                              onClick={() => openEditWarehouse(wh)}
                              className="p-2 rounded-lg text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteWarehouseId(wh.id)}
                              className="p-2 rounded-lg text-zinc-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SYSTEM INFO TAB */}
        {activeTab === 'system' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 backdrop-blur-xl shadow-sm space-y-4">
              <h3 className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-500" /> Yazılım ve Ortam Özellikleri
              </h3>

              <div className="space-y-3 text-xs text-zinc-650 dark:text-zinc-400">
                <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                  <span>Next.js Framework</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">16.2.6 (Turbopack)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                  <span>React Library</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">19.2.4</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                  <span>Prisma ORM</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">v7.8.0</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                  <span>Çalışma Modu (NODE_ENV)</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50 uppercase">{process.env.NODE_ENV}</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 backdrop-blur-xl shadow-sm space-y-4">
              <h3 className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-indigo-500" /> Envanter Veritabanı ve Redis
              </h3>

              <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                  <span>Veritabanı Sağlayıcısı</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">PostgreSQL (pg)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                  <span>İş Kuyruğu / Arka Plan İşleri</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">BullMQ (Active)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                  <span>Önbellek (Cache) / Redis</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">ioredis (Connected)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Warehouse Modal */}
      {isWarehouseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeWarehouseForm} />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {editingWarehouseId ? 'Depo Bilgilerini Düzenle' : 'Yeni Depo Ekle'}
              </h2>
              <button onClick={closeWarehouseForm} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={warehouseForm.handleSubmit(onSubmitWarehouse)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Depo Adı *</label>
                <input
                  type="text"
                  {...warehouseForm.register('name', { required: 'Depo adı zorunludur' })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none"
                  placeholder="Örn: Kuzey Deposu"
                />
                {warehouseForm.formState.errors.name && (
                  <p className="text-xs text-red-500 mt-1">{warehouseForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Depo Adresi / Konumu</label>
                <input
                  type="text"
                  {...warehouseForm.register('address')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none"
                  placeholder="İstanbul, Türkiye"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Saat Dilimi</label>
                <select
                  {...warehouseForm.register('timezone')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                >
                  <option value="Europe/Istanbul">Europe/Istanbul (GMT+3)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="Europe/London">Europe/London (GMT+0)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeWarehouseForm}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={createWarehouse.isPending || updateWarehouse.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm disabled:opacity-50"
                >
                  {createWarehouse.isPending || updateWarehouse.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Warehouse Dialog */}
      {deleteWarehouseId && (
        <DeleteConfirmDialog
          isOpen={!!deleteWarehouseId}
          title="Depoyu Sil"
          description="Bu depoyu silmek istediğinize emin misiniz? (Depoya kayıtlı raf/lokasyon veya bu depoda çalışan personel varsa silme işlemi engellenecektir)"
          onConfirm={() => deleteWarehouse.mutate({ id: deleteWarehouseId })}
          onClose={() => setDeleteWarehouseId(null)}
          isLoading={deleteWarehouse.isPending}
        />
      )}
    </div>
  );
}
