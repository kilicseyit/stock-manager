'use client';

import React, { useState, useRef, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import { Search, HelpCircle, Package, Loader2, X, Menu, Compass, ScanLine, Zap } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { useDebounce } from '@/hooks/useDebounce';
import { useRouter } from 'next/navigation';
import { useSidebar } from './SidebarContext';


export default function Topbar() {
  const router = useRouter();
  const { toggleCollapsed } = useSidebar();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Barcode scan mode
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const [barcodeFeedback, setBarcodeFeedback] = useState<'scanning' | 'found' | 'notfound' | null>(null);
  const barcodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKeyTimeRef = useRef<number>(0);

  const activateBarcodeMode = () => {
    setBarcodeMode(true);
    setBarcodeBuffer('');
    setBarcodeFeedback('scanning');
    inputRef.current?.blur();
  };

  const deactivateBarcodeMode = () => {
    setBarcodeMode(false);
    setBarcodeBuffer('');
    setBarcodeFeedback(null);
    if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current);
  };

  // Global keydown listener for barcode scanner input
  useEffect(() => {
    if (!barcodeMode) return;

    const handleKey = (e: KeyboardEvent) => {
      const now = Date.now();
      const gap = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Escape') { deactivateBarcodeMode(); return; }

      if (e.key === 'Enter') {
        if (barcodeBuffer.trim().length > 0) {
          const term = barcodeBuffer.trim();
          setBarcodeBuffer('');
          // Navigate to product search with the scanned term
          setBarcodeFeedback('found');
          setTimeout(() => {
            deactivateBarcodeMode();
            router.push(`/urunler?search=${encodeURIComponent(term)}`);
          }, 600);
        }
        return;
      }

      // Only accept printable characters (barcode scanners send them < 100ms apart)
      if (e.key.length === 1) {
        // If gap > 300ms reset buffer (manual typing reset)
        setBarcodeBuffer((prev) => (gap > 300 && prev.length > 0 ? e.key : prev + e.key));

        // Auto-timeout buffer after 2s
        if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current);
        barcodeTimerRef.current = setTimeout(() => {
          setBarcodeBuffer('');
        }, 2000);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barcodeMode, barcodeBuffer, router]);

  const { data, isLoading } = trpc.product.getAll.useQuery(
    { search: debouncedQuery, limit: 6 },
    {
      enabled: debouncedQuery.trim().length > 1,
      placeholderData: (prev) => prev,
    }
  );

  const results = data?.items ?? [];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (sku: string) => {
    setQuery('');
    setIsOpen(false);
    router.push(`/urunler?search=${encodeURIComponent(sku)}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const showDropdown = isOpen && debouncedQuery.trim().length > 1;

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 transition-colors duration-300">
      {/* Global Search Input */}
      <div className="flex-1 max-w-lg hidden md:flex items-center gap-2" ref={containerRef}>
        {/* Barcode Mode Overlay */}
        {barcodeMode && (
          <div className="absolute top-full left-0 right-0 mt-1 mx-6 z-50 pointer-events-none">
            <div className={`mx-auto max-w-lg px-5 py-3 rounded-2xl border shadow-xl flex items-center gap-3 pointer-events-auto transition-all ${
              barcodeFeedback === 'found'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700'
                : 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-800'
            }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                barcodeFeedback === 'found' ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-indigo-100 dark:bg-indigo-900/40'
              }`}>
                {barcodeFeedback === 'found'
                  ? <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  : <ScanLine className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${barcodeFeedback === 'found' ? 'text-emerald-700 dark:text-emerald-300' : 'text-indigo-700 dark:text-indigo-300'}`}>
                  {barcodeFeedback === 'found' ? 'Barkod algılandı! Aranıyor...' : 'Barkod Tarama Modu Aktif'}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {barcodeBuffer ? `Okunuyor: ${barcodeBuffer}` : 'Barkodu okutun veya ESC ile çıkın'}
                </p>
              </div>
              <button onClick={deactivateBarcodeMode} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400 dark:text-zinc-500">
            {isLoading && debouncedQuery.length > 1 ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleInputChange}
            onFocus={() => query.length > 1 && setIsOpen(true)}
            placeholder="Hızlı arama yapın (SKU, ürün adı...)"
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute inset-y-0 right-2.5 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Dropdown Results */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-zinc-500 dark:text-zinc-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-medium">Aranıyor...</span>
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-zinc-400 dark:text-zinc-500">
                  <Search className="w-6 h-6" />
                  <p className="text-xs font-medium">Sonuç bulunamadı</p>
                  <p className="text-[10px] text-zinc-400">
                    &quot;{debouncedQuery}&quot; için eşleşme yok
                  </p>
                </div>
              ) : (
                <div>
                  <div className="px-3 pt-2.5 pb-1">
                    <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      {results.length} Sonuç
                    </p>
                  </div>
                  <ul>
                    {results.map((product) => {
                      const totalStock = product.stockItems?.reduce(
                        (acc: number, s: { quantity: number }) => acc + s.quantity,
                        0
                      ) ?? 0;
                      return (
                        <li key={product.id}>
                          <button
                            onClick={() => handleSelect(product.sku)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center shrink-0">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-8 h-8 rounded-lg object-cover"
                                />
                              ) : (
                                <Package className="w-4 h-4 text-indigo-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                {product.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                  {product.sku}
                                </span>
                                {product.category && (
                                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                                    {product.category.name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              totalStock === 0
                                ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {totalStock > 0 ? `${totalStock} stok` : 'Stok yok'}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="border-t border-zinc-100 dark:border-zinc-800 px-3 py-2">
                    <button
                      onClick={() => handleSelect(debouncedQuery)}
                      className="w-full text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline text-center"
                    >
                      &quot;{debouncedQuery}&quot; ile tüm ürünleri ara →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Barcode Scan Button */}
        <button
          onClick={barcodeMode ? deactivateBarcodeMode : activateBarcodeMode}
          title="Barkod / QR Tarama Modu"
          className={`p-2 rounded-xl border transition-all shrink-0 ${
            barcodeMode
              ? 'border-indigo-400 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
              : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <ScanLine className="w-4 h-4" />
        </button>
      </div>

      {/* Spacer for mobile */}
      <div className="md:hidden flex-1" />

      {/* Right-side Utilities */}
      <div className="flex items-center gap-3">
        {/* Onboarding Guide */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('restart-onboarding'))}
          title="Hızlı Tur Rehberini Başlat"
          className="p-2 rounded-lg text-zinc-550 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
        >
          <Compass className="w-5 h-5" />
        </button>

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
