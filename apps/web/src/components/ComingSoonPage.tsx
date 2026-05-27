'use client';

import React from 'react';
import { Rocket, Clock, Bell, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ComingSoonPageProps {
  title: string;
  description: string;
  plannedFeatures: string[];
  icon: React.ElementType;
  accentColor: string;
}

export default function ComingSoonPage({
  title,
  description,
  plannedFeatures,
  icon: Icon,
  accentColor,
}: ComingSoonPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-fadeIn">
      {/* Icon */}
      <div className={`relative w-24 h-24 rounded-3xl ${accentColor} flex items-center justify-center mb-8 shadow-xl`}>
        <Icon className="w-12 h-12 text-white" />
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg">
          <Clock className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Badge */}
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-semibold mb-4 border border-amber-200 dark:border-amber-700/50">
        <Rocket className="w-3.5 h-3.5" />
        Yakında Geliyor
      </span>

      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
        {title}
      </h1>
      <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-10 leading-relaxed">
        {description}
      </p>

      {/* Planned Features */}
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 mb-8 text-left shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Planlanan Özellikler</span>
        </div>
        <ul className="space-y-2.5">
          {plannedFeatures.map((feature, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {i + 1}
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Dashboard&apos;a Dön
      </Link>
    </div>
  );
}
