'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-100 dark:border-emerald-900',
          text: 'text-emerald-800 dark:text-emerald-300',
          icon: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
        };
      case 'error':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/90 border-rose-100 dark:border-rose-900',
          text: 'text-rose-800 dark:text-rose-300',
          icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/90 border-amber-100 dark:border-amber-900',
          text: 'text-amber-800 dark:text-amber-300',
          icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-indigo-50 dark:bg-indigo-950/90 border-indigo-100 dark:border-indigo-900',
          text: 'text-indigo-800 dark:text-indigo-300',
          icon: <Info className="w-5 h-5 text-indigo-500 shrink-0" />,
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast container floating on screen */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const styles = getToastStyles(toast.type);
          return (
            <div
              key={toast.id}
              className={`p-4 rounded-2xl border shadow-xl flex items-center justify-between gap-3 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300 ${styles.bg} ${styles.text}`}
            >
              <div className="flex items-center gap-3">
                {styles.icon}
                <span className="text-xs font-semibold leading-relaxed">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
