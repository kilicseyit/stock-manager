'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, QrCode } from 'lucide-react';

interface QrCodeModalProps {
  product: {
    sku: string;
    name: string;
    barcode: string | null;
  } | null;
  onClose: () => void;
}

export default function QrCodeModal({ product, onClose }: QrCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!product || !canvasRef.current) return;

    setLoading(true);
    setError(null);

    const qrData = JSON.stringify({
      sku: product.sku,
      name: product.name,
      barcode: product.barcode || '',
    });

    QRCode.toCanvas(
      canvasRef.current,
      qrData,
      {
        width: 256,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (err) => {
        setLoading(false);
        if (err) {
          console.error(err);
          setError('QR kod üretilirken bir hata oluştu.');
        }
      }
    );
  }, [product]);

  if (!product) return null;

  const handleDownload = () => {
    if (!canvasRef.current) return;

    const dataUrl = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QR_${product.sku}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden animate-slideUpSimple"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-150 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-150">
              Ürün QR Kodu
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="relative w-64 h-64 bg-zinc-50 dark:bg-white rounded-xl border border-zinc-100 dark:border-zinc-700 p-2 flex items-center justify-center shadow-inner">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 dark:bg-white rounded-xl">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {error ? (
              <p className="text-xs text-rose-500 font-semibold px-4">{error}</p>
            ) : (
              <canvas ref={canvasRef} className="w-full h-full max-w-full rounded-lg" />
            )}
          </div>

          <div className="space-y-1 w-full">
            <span className="inline-flex px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 border border-zinc-200/30 dark:border-zinc-700/50">
              {product.sku}
            </span>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-xs">
              {product.name}
            </h4>
            {product.barcode && (
              <p className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                Barkod: {product.barcode}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-150 dark:border-zinc-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-750 text-zinc-700 dark:text-zinc-300 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Kapat
          </button>
          <button
            onClick={handleDownload}
            disabled={loading || !!error}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-md shadow-indigo-600/10"
          >
            <Download className="w-4 h-4" />
            PNG İndir
          </button>
        </div>
      </div>
    </div>
  );
}
