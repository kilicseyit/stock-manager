'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  MapPin, 
  Truck, 
  FileSpreadsheet, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  User,
  ShieldAlert,
  FolderTree,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Users,
  Activity,
} from 'lucide-react';
import { useSidebar } from './SidebarContext';

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = !isCollapsed || isHovered;

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Ürünler', href: '/urunler', icon: Package },
    { name: 'Kategoriler', href: '/kategoriler', icon: FolderTree },
    { name: 'Stok', href: '/stok', icon: Boxes },
    { name: 'Sayım', href: '/sayim', icon: ClipboardCheck },
    { name: 'Lokasyonlar', href: '/lokasyonlar', icon: MapPin },
    { name: 'Tedarikçiler', href: '/tedarikciler', icon: Truck },
    { name: 'Siparişler', href: '/siparisler', icon: FileSpreadsheet },
    { name: 'Raporlar', href: '/raporlar', icon: BarChart3 },
    ...(user?.role === 'SUPER_ADMIN' ? [{ name: 'Kullanıcılar', href: '/kullanicilar', icon: Users }] : []),
    { name: 'Aktivite', href: '/aktivite', icon: Activity },
    { name: 'Ayarlar', href: '/ayarlar', icon: Settings },
  ];

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-md focus:outline-none"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed inset-y-0 left-0 z-40 flex flex-col justify-between border-r border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl transition-all duration-300 ease-in-out
          ${isExpanded ? 'w-64' : 'w-16'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col flex-1 pt-6 overflow-y-auto overflow-x-hidden min-h-0">
          {/* Logo / Header */}
          <div className={`mb-8 flex items-center transition-all duration-300 ${isExpanded ? 'justify-between px-6' : 'justify-center px-4'}`}>
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-600/30 shrink-0">
                S
              </div>
              <span
                className={`font-bold text-xl bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent whitespace-nowrap transition-all duration-300 overflow-hidden ${
                  isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0 hidden'
                }`}
              >
                StockManager
              </span>
            </div>

            <button
              onClick={toggleCollapsed}
              className={`items-center justify-center p-1.5 rounded-lg text-zinc-500 hover:text-zinc-855 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer shrink-0 z-50 ${
                isExpanded ? 'hidden lg:flex' : 'hidden'
              }`}
              title={isCollapsed ? 'Genişlet' : 'Daralt'}
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className={`flex-1 space-y-1 transition-all duration-300 ${isExpanded ? 'px-4' : 'px-2'}`}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  title={!isExpanded ? item.name : undefined}
                  className={`flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                    ${isExpanded ? 'px-4 justify-start' : 'px-2 justify-center'}
                    ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'
                    }`}
                  />
                  <span
                    className={`flex-1 whitespace-nowrap overflow-hidden transition-all duration-300 ${
                      isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0 hidden'
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / User Profile & Logout */}
        <div className={`border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-3 transition-all duration-300 ${isExpanded ? 'p-4' : 'p-2'}`}>
          {/* User Card */}
          {user && isExpanded && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/40">
              <div className="w-9 h-9 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {user.name || 'Bilinmeyen Kullanıcı'}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <ShieldAlert className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                  <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    {user.role === 'SUPER_ADMIN' ? 'Admin' : 'Personel'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* User icon when collapsed */}
          {user && !isExpanded && (
            <div
              className="flex items-center justify-center p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/40"
              title={user.name || 'Kullanıcı'}
            >
              <User className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title={!isExpanded ? 'Çıkış Yap' : undefined}
            className={`flex items-center w-full py-2.5 rounded-xl border border-red-200/50 dark:border-red-900/20 text-red-600 dark:text-red-400 font-medium text-sm hover:bg-red-50 dark:hover:bg-red-950/20 transition-all active:scale-[0.98]
              ${isExpanded ? 'justify-center gap-2 px-4' : 'justify-center px-2'}
            `}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0 hidden'
              }`}
            >
              Çıkış Yap
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
