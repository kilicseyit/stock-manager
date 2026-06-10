'use client';

import React from 'react';

type EmptyVariant = 'products' | 'stock' | 'orders' | 'activity' | 'search' | 'generic';

const illustrations: Record<EmptyVariant, React.FC<{ className?: string }>> = {
  products: ({ className }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="60" y="40" width="80" height="80" rx="12" fill="currentColor" opacity="0.06" />
      <rect x="72" y="52" width="56" height="56" rx="8" stroke="currentColor" strokeWidth="2" opacity="0.2" strokeDasharray="4 3" />
      <path d="M100 72 L100 88 M92 80 L108 80" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
      <rect x="30" y="110" width="30" height="6" rx="3" fill="currentColor" opacity="0.08" />
      <rect x="68" y="110" width="64" height="6" rx="3" fill="currentColor" opacity="0.08" />
      <rect x="140" y="110" width="30" height="6" rx="3" fill="currentColor" opacity="0.08" />
      <circle cx="44" cy="44" r="6" fill="currentColor" opacity="0.1" />
      <circle cx="156" cy="116" r="4" fill="currentColor" opacity="0.1" />
    </svg>
  ),
  stock: ({ className }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="50" y="60" width="40" height="50" rx="4" fill="currentColor" opacity="0.07" />
      <rect x="98" y="45" width="40" height="65" rx="4" fill="currentColor" opacity="0.07" />
      <rect x="146" y="55" width="14" height="55" rx="4" fill="currentColor" opacity="0.07" />
      <rect x="50" y="60" width="40" height="50" rx="4" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
      <rect x="98" y="45" width="40" height="65" rx="4" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
      <rect x="146" y="55" width="14" height="55" rx="4" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
      <line x1="40" y1="112" x2="170" y2="112" stroke="currentColor" strokeWidth="1.5" opacity="0.15" strokeLinecap="round" />
      <path d="M78 80 Q88 70 98 80 Q108 90 118 75" stroke="currentColor" strokeWidth="2" opacity="0.25" strokeLinecap="round" fill="none" />
    </svg>
  ),
  orders: ({ className }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="55" y="35" width="90" height="110" rx="10" fill="currentColor" opacity="0.06" />
      <rect x="55" y="35" width="90" height="110" rx="10" stroke="currentColor" strokeWidth="1.5" opacity="0.15" />
      <line x1="72" y1="62" x2="128" y2="62" stroke="currentColor" strokeWidth="2" opacity="0.2" strokeLinecap="round" />
      <line x1="72" y1="76" x2="110" y2="76" stroke="currentColor" strokeWidth="2" opacity="0.2" strokeLinecap="round" />
      <line x1="72" y1="90" x2="120" y2="90" stroke="currentColor" strokeWidth="2" opacity="0.2" strokeLinecap="round" />
      <line x1="72" y1="104" x2="100" y2="104" stroke="currentColor" strokeWidth="2" opacity="0.2" strokeLinecap="round" />
      <circle cx="150" cy="120" r="18" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5" />
      <path d="M143 120 L148 125 L157 115" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />
    </svg>
  ),
  activity: ({ className }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="56" cy="50" r="8" fill="currentColor" opacity="0.12" />
      <circle cx="56" cy="80" r="8" fill="currentColor" opacity="0.08" />
      <circle cx="56" cy="110" r="8" fill="currentColor" opacity="0.06" />
      <line x1="56" y1="58" x2="56" y2="72" stroke="currentColor" strokeWidth="1.5" opacity="0.12" />
      <line x1="56" y1="88" x2="56" y2="102" stroke="currentColor" strokeWidth="1.5" opacity="0.1" />
      <line x1="72" y1="50" x2="148" y2="50" stroke="currentColor" strokeWidth="2" opacity="0.15" strokeLinecap="round" />
      <line x1="72" y1="58" x2="120" y2="58" stroke="currentColor" strokeWidth="1.5" opacity="0.1" strokeLinecap="round" />
      <line x1="72" y1="80" x2="140" y2="80" stroke="currentColor" strokeWidth="2" opacity="0.12" strokeLinecap="round" />
      <line x1="72" y1="88" x2="110" y2="88" stroke="currentColor" strokeWidth="1.5" opacity="0.08" strokeLinecap="round" />
      <line x1="72" y1="110" x2="130" y2="110" stroke="currentColor" strokeWidth="2" opacity="0.1" strokeLinecap="round" />
    </svg>
  ),
  search: ({ className }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="88" cy="76" r="36" stroke="currentColor" strokeWidth="2.5" opacity="0.18" />
      <line x1="114" y1="102" x2="148" y2="136" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.18" />
      <path d="M76 68 Q88 60 100 68" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.2" fill="none" />
      <path d="M80 84 Q88 90 96 84" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.2" fill="none" />
    </svg>
  ),
  generic: ({ className }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="60" y="50" width="80" height="70" rx="10" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="1.5" />
      <path d="M85 85 Q100 70 115 85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.2" />
      <circle cx="88" cy="78" r="3" fill="currentColor" opacity="0.2" />
      <circle cx="112" cy="78" r="3" fill="currentColor" opacity="0.2" />
    </svg>
  ),
};

interface EmptyStateProps {
  variant?: EmptyVariant;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ variant = 'generic', title, description, action, className }: EmptyStateProps) {
  const Illustration = illustrations[variant];

  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center gap-4 ${className ?? ''}`}>
      <div className="text-zinc-300 dark:text-zinc-700">
        <Illustration className="w-40 h-32" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-zinc-700 dark:text-zinc-300">{title}</h3>
        {description && (
          <p className="text-sm text-zinc-500 dark:text-zinc-500 max-w-xs mx-auto leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
