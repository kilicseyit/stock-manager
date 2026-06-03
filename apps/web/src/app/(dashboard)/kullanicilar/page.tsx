'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/trpc/client';
import { useForm } from 'react-hook-form';
import {
  Users,
  ShieldAlert,
  UserPlus,
  Edit2,
  Lock,
  UserCheck,
  UserX,
  X,
  Warehouse,
  Mail,
  Shield,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';

type UserRole = 'SUPER_ADMIN' | 'WAREHOUSE_MANAGER' | 'STAFF' | 'VIEWER';

interface UserFormValues {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  warehouseId: string | null;
  password?: string;
}

export default function KullanicilarPage() {
  const { showToast } = useToast();
  const { data: session, status } = useSession();
  const utils = trpc.useUtils();

  // Tablo & Modal Durumları
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserFormValues | null>(null);

  // tRPC Queries
  const usersQuery = trpc.user.getAll.useQuery(undefined, {
    enabled: session?.user?.role === 'SUPER_ADMIN',
    refetchOnWindowFocus: false,
  });

  const warehousesQuery = trpc.location.getWarehouses.useQuery(undefined, {
    enabled: session?.user?.role === 'SUPER_ADMIN',
    refetchOnWindowFocus: false,
  });

  // tRPC Mutations
  const createUserMutation = trpc.user.create.useMutation({
    onSuccess: () => {
      utils.user.getAll.invalidate();
      closeModal();
      showToast('Kullanıcı başarıyla oluşturuldu.', 'success');
    },
    onError: (err) => {
      showToast(err.message || 'Kullanıcı oluşturulurken hata oluştu.', 'error');
    },
  });

  const updateUserMutation = trpc.user.update.useMutation({
    onSuccess: () => {
      utils.user.getAll.invalidate();
      closeModal();
      showToast('Kullanıcı bilgileri güncellendi.', 'success');
    },
    onError: (err) => {
      showToast(err.message || 'Kullanıcı güncellenirken hata oluştu.', 'error');
    },
  });

  const toggleStatusMutation = trpc.user.deactivate.useMutation({
    onSuccess: () => {
      utils.user.getAll.invalidate();
      showToast('Kullanıcı durumu güncellendi.', 'success');
    },
    onError: (err) => {
      showToast(err.message || 'Durum değiştirilirken hata oluştu.', 'error');
    },
  });

  // react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UserFormValues>({
    defaultValues: {
      name: '',
      email: '',
      role: 'VIEWER',
      warehouseId: null,
      password: '',
    },
  });

  // Loading Session
  if (status === 'loading') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-650" />
      </div>
    );
  }

  // SUPER_ADMIN Yetki Kontrolü
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl border border-zinc-250 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Neon Glow effect */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl" />

          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 animate-pulse">
              <ShieldAlert className="w-12 h-12 text-rose-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Yetkisiz Erişim
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Bu sayfaya erişim yetkiniz bulunmamaktadır. Kullanıcı yönetimi paneline sadece 
              <strong className="text-indigo-600 dark:text-indigo-400"> SUPER_ADMIN </strong> 
              rolüne sahip hesaplar erişebilir.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-850 hover:bg-zinc-800 dark:hover:bg-zinc-800 text-white font-medium text-xs transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Paneline Geri Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const openAddModal = () => {
    setEditingUser(null);
    reset({
      name: '',
      email: '',
      role: 'VIEWER',
      warehouseId: '',
      password: '',
    });
    setIsOpen(true);
  };

  const openEditModal = (user: any) => {
    const editData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      warehouseId: user.warehouseId || '',
      password: '', // Şifre düzenleme modunda boş gelir
    };
    setEditingUser(editData);
    reset(editData);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingUser(null);
  };

  const onSubmit = (data: UserFormValues) => {
    // dropdown'dan gelen boş string'i null yap
    const wId = data.warehouseId === '' ? null : data.warehouseId;

    if (editingUser?.id) {
      updateUserMutation.mutate({
        id: editingUser.id,
        name: data.name,
        email: data.email,
        role: data.role,
        warehouseId: wId,
      });
    } else {
      if (!data.password || data.password.length < 6) {
        showToast('Yeni kullanıcılar için en az 6 karakterlik şifre zorunludur.', 'warning');
        return;
      }
      createUserMutation.mutate({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        warehouseId: wId,
      });
    }
  };

  const handleToggleActive = (user: any) => {
    if (user.id === session?.user?.id) {
      showToast('Kendi hesabınızı deaktive edemezsiniz.', 'warning');
      return;
    }
    toggleStatusMutation.mutate({
      id: user.id,
      isActive: !user.isActive,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-8 h-8 text-indigo-650" />
            Kullanıcı Yönetimi
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Sisteme kayıtlı personelleri yönetin, rol ve depo yetkilerini düzenleyin.
          </p>
        </div>
        <div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Yeni Kullanıcı Ekle
          </button>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl overflow-hidden shadow-sm">
        {usersQuery.isLoading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
            ))}
          </div>
        ) : !usersQuery.data?.length ? (
          <div className="py-16 text-center text-zinc-400">Kayıtlı kullanıcı bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-650 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-6 py-4">Kullanıcı</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Görev Yeri (Depo)</th>
                  <th className="px-6 py-4">Kayıt Tarihi</th>
                  <th className="px-6 py-4 text-center">Durum</th>
                  <th className="px-6 py-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                {usersQuery.data.map((u) => {
                  const isSelf = u.id === session?.user?.id;
                  return (
                    <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                            {u.name}
                            {isSelf && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-normal">
                                Siz
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-450 font-mono mt-0.5">{u.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30'
                            : u.role === 'WAREHOUSE_MANAGER'
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-450 border border-blue-100 dark:border-blue-900/30'
                            : u.role === 'STAFF'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Warehouse className="w-4 h-4 text-zinc-450" />
                          <span className={u.warehouse ? 'font-medium' : 'text-zinc-400 text-xs'}>
                            {u.warehouse?.name || 'Tüm Depolar / Atanmamış'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-450 font-mono text-xs">
                        {new Date(u.createdAt).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleToggleActive(u)}
                            disabled={isSelf || toggleStatusMutation.isPending}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                              u.isActive
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 dark:hover:bg-emerald-950/40'
                                : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30 dark:hover:bg-rose-950/40'
                            } disabled:opacity-50 cursor-pointer`}
                          >
                            {u.isActive ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                Aktif
                              </>
                            ) : (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                Deaktif
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-2 rounded-lg text-zinc-500 hover:text-indigo-650 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
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

      {/* Add / Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                {editingUser ? 'Kullanıcı Yetkilerini Güncelle' : 'Sisteme Yeni Kullanıcı Kaydet'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-250 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-450 uppercase mb-1.5">Ad Soyad *</label>
                  <input
                    type="text"
                    {...register('name', { required: 'Ad Soyad zorunludur' })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-indigo-500"
                    placeholder="Ahmet Yılmaz"
                  />
                  {errors.name && (
                    <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-450 uppercase mb-1.5 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> E-posta Adresi *
                  </label>
                  <input
                    type="email"
                    {...register('email', { required: 'E-posta zorunludur' })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-indigo-500"
                    placeholder="ahmet@sirket.com"
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-450 uppercase mb-1.5">Sistem Rolü *</label>
                  <select
                    {...register('role')}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Tam Yetki)</option>
                    <option value="WAREHOUSE_MANAGER">WAREHOUSE_MANAGER (Depo Yöneticisi)</option>
                    <option value="STAFF">STAFF (Depo Personeli)</option>
                    <option value="VIEWER">VIEWER (Sadece Görüntüleme)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-450 uppercase mb-1.5 flex items-center gap-1">
                    <Warehouse className="w-3.5 h-3.5" /> Görev Yeri (Depo Ataması)
                  </label>
                  <select
                    {...register('warehouseId')}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Tüm Depolar / Atanmamış</option>
                    {warehousesQuery.data?.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-bold text-zinc-455 uppercase mb-1.5 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Şifre Belirle *
                  </label>
                  <input
                    type="password"
                    {...register('password', {
                      required: 'Şifre zorunludur',
                      minLength: { value: 6, message: 'Şifre en az 6 karakter olmalıdır' },
                    })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-indigo-500"
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>
                  )}
                </div>
              )}

              {editingUser && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[11px] text-zinc-500">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">Bilgi: </span>
                  Kullanıcı şifre sıfırlama işlemi profil/ayarlar sekmesinden veya doğrudan kullanıcının kendi paneli üzerinden yapılabilir. Bu ekrandan yalnızca rol, isim, e-posta ve depo yetkileri güncellenebilir.
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-250 hover:bg-zinc-50 dark:border-zinc-750 dark:hover:bg-zinc-800 text-xs font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending || updateUserMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  {createUserMutation.isPending || updateUserMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
