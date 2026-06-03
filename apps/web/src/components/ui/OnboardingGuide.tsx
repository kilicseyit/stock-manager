'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { X, ArrowRight, ArrowLeft, Check, Sparkles, Compass } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OnboardingGuideProps {
  userId: string;
}

export default function OnboardingGuide({ userId }: OnboardingGuideProps) {
  const router = useRouter();
  const pathname = usePathname();

  const stepKey = `onboarding_step_${userId}`;
  const completedKey = `onboarding_completed_${userId}`;

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  // İlk yüklemede durumu kontrol et
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isCompleted = localStorage.getItem(completedKey) === 'true';
      if (!isCompleted) {
        setIsOpen(true);
        const savedStep = localStorage.getItem(stepKey);
        if (savedStep) {
          setStep(Number(savedStep));
        } else {
          setStep(1);
        }
      }
    }
  }, [userId, completedKey, stepKey]);

  // Sayfa değişimlerinde veya adım değişimlerinde adım sayısına göre sayfaları doğrula
  useEffect(() => {
    if (!isOpen) return;

    // Kullanıcı adımı kendisi değiştirmediyse, bulunduğu sayfaya göre adım eşleme yapabiliriz
    if (step === 2 && pathname !== '/ayarlar') {
      // Yönlendirme aşamasındaysa veya kullanıcı başka sayfaya saptıysa kılavuzu açık tut
    }
  }, [pathname, step, isOpen]);

  // Yeniden başlatma event dinleyicisi
  useEffect(() => {
    const handleRestart = () => {
      localStorage.removeItem(completedKey);
      localStorage.setItem(stepKey, '1');
      setStep(1);
      setIsOpen(true);
      router.push('/dashboard');
    };

    window.addEventListener('restart-onboarding', handleRestart);
    return () => window.removeEventListener('restart-onboarding', handleRestart);
  }, [completedKey, stepKey, router]);

  const handleNext = () => {
    let nextStep = step + 1;

    if (step === 1) {
      router.push('/ayarlar');
    } else if (step === 2) {
      router.push('/urunler');
    } else if (step === 3) {
      router.push('/stok');
    } else if (step === 4) {
      // Adım 5 tebrik ekranı
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    } else if (step === 5) {
      handleComplete();
      return;
    }

    setStep(nextStep);
    localStorage.setItem(stepKey, String(nextStep));
  };

  const handleBack = () => {
    if (step === 1) return;
    let prevStep = step - 1;

    if (prevStep === 1) {
      router.push('/dashboard');
    } else if (prevStep === 2) {
      router.push('/ayarlar');
    } else if (prevStep === 3) {
      router.push('/urunler');
    } else if (prevStep === 4) {
      router.push('/stok');
    }

    setStep(prevStep);
    localStorage.setItem(stepKey, String(prevStep));
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(completedKey, 'true');
    localStorage.removeItem(stepKey);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const stepsContent = [
    {
      title: 'StockManager\'a Hoş Geldiniz! 🚀',
      desc: 'Depo yönetim sisteminizi kolayca yapılandırmak ve yönetmek için hazırladığımız hızlı tur rehberine hoş geldiniz. Birkaç adımda sisteminizi hazır hale getirelim.',
      badge: 'Giriş',
    },
    {
      title: 'Depo & Raf Lokasyonları Oluşturma 🏢',
      desc: 'Ürünleri stoklayabilmek için önce en az bir depo ve bu depoda raf lokasyonları tanımlamalısınız. Şimdi sizi Ayarlar sayfasına yönlendiriyoruz.',
      badge: '1. Adım',
    },
    {
      title: 'İlk Ürün Tanımını Yapın 📦',
      desc: 'SKU, barkod, asgari stok seviyesi gibi bilgileri girerek sisteme ürünlerinizi tanımlayın. Şimdi Ürünler sayfasındayız.',
      badge: '2. Adım',
    },
    {
      title: 'İlk Stok Hareketini Kaydedin 🔄',
      desc: 'Tanımladığınız ürünlerin depoya girişini (IN), çıkışını (OUT) veya lokasyonlar arası transferini Stok sayfasından yapabilirsiniz.',
      badge: '3. Adım',
    },
    {
      title: 'Her Şey Hazır! 🎉',
      desc: 'Tebrikler! Depo yönetim sisteminin temel akışını öğrendiniz. Kısayollar menüsü için istediğiniz zaman klavyeden "?" tuşuna basabilirsiniz.',
      badge: 'Hazırsın',
    },
  ];

  const current = stepsContent[step - 1];

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-sm w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 overflow-hidden flex flex-col gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 uppercase tracking-wider">
          {current.badge}
        </span>
        <button onClick={handleSkip} className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1.5">
        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
          {step === 5 && <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />}
          {current.title}
        </h4>
        <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">
          {current.desc}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        {step > 1 && step < 5 ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Geri
          </button>
        ) : step < 5 ? (
          <button
            onClick={handleSkip}
            className="text-xs font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:underline"
          >
            Rehberi Atla
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={handleNext}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/10"
        >
          {step === 5 ? (
            <>
              Tamamla
              <Check className="w-3.5 h-3.5" />
            </>
          ) : step === 1 ? (
            <>
              Turu Başlat
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              İlerle
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
