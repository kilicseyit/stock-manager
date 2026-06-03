import React from 'react';
import { X, Keyboard, Navigation, Play, AppWindow } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const sections = [
    {
      title: 'İşlemler',
      icon: <Play className="w-4 h-4 text-indigo-500" />,
      shortcuts: [
        { keys: ['Ctrl', 'N'], desc: 'Yeni kayıt oluşturma modalını açar (Bulunduğunuz sayfaya göre)' },
        { keys: ['Esc'], desc: 'Açık olan herhangi bir modalı kapatır' },
      ],
    },
    {
      title: 'Genel',
      icon: <AppWindow className="w-4 h-4 text-emerald-500" />,
      shortcuts: [
        { keys: ['?'], desc: 'Bu kısayol listesi modalını açar / kapatır' },
      ],
    },
    {
      title: 'Gezinme (Sidebar Sayfaları)',
      icon: <Navigation className="w-4 h-4 text-sky-500" />,
      shortcuts: [
        { keys: ['/'], desc: 'Hızlı gezinme için menüyü veya sayfaları açabilirsiniz' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-150 dark:border-zinc-800/80 mb-4">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Klavye Kısayolları
            </h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-zinc-100 dark:border-zinc-850">
                {section.icon}
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {section.title}
                </h3>
              </div>
              <div className="space-y-3">
                {section.shortcuts.map((shortcut, kIdx) => (
                  <div key={kIdx} className="flex items-center justify-between gap-4 py-0.5">
                    <span className="text-xs text-zinc-605 dark:text-zinc-400 font-medium">
                      {shortcut.desc}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {shortcut.keys.map((key, keyIdx) => (
                        <kbd
                          key={keyIdx}
                          className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono font-bold text-zinc-800 dark:text-zinc-200 shadow-sm"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800/80 flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-850 dark:hover:bg-zinc-750 text-white font-medium text-xs transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
