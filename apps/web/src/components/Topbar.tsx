'use client';

import React from 'react';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import { Search, HelpCircle } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 transition-colors duration-300">
      {/* Search Input */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400 dark:text-zinc-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="search"
            placeholder="Hızlı arama yapın (SKU, ürün adı, sipariş...)"
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Spacer for mobile */}
      <div className="md:hidden flex-1" />

      {/* Right-side Utilities */}
      <div className="flex items-center gap-3">
        {/* Help Center */}
        <button className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <NotificationBell />

        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1" />

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}

