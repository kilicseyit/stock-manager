'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-8 animate-fadeIn">
          <div className="relative w-20 h-20 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-6 shadow-md border border-rose-200 dark:border-rose-800/50">
            <AlertTriangle className="w-10 h-10 text-rose-600 dark:text-rose-400 animate-pulse" />
          </div>

          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Bir Şeyler Yanlış Gitti
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8 text-sm leading-relaxed">
            Beklenmedik bir sistem hatası oluştu. Sayfayı yenileyerek tekrar deneyebilir veya kontrol paneline dönebilirsiniz.
          </p>

          {/* Details wrapper */}
          {this.state.error && (
            <div className="w-full max-w-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4 text-left mb-8 shadow-sm">
              <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                Hata Mesajı
              </div>
              <div className="text-sm font-mono text-rose-600 dark:text-rose-400 break-all">
                {this.state.error.toString()}
              </div>
              
              {this.state.errorInfo && (
                <details className="mt-3">
                  <summary className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer select-none outline-none">
                    Hata Ayrıntılarını Göster
                  </summary>
                  <pre className="mt-2 text-xs font-mono text-zinc-600 dark:text-zinc-400 overflow-x-auto whitespace-pre-wrap max-h-48 leading-relaxed">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={this.handleReset}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all shadow-md shadow-indigo-600/10"
            >
              <RefreshCw className="w-4 h-4" />
              Yeniden Dene
            </button>
            <a
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              <Home className="w-4 h-4" />
              Dashboard&apos;a Git
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
