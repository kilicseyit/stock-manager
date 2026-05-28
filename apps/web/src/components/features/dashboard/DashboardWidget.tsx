'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface DashboardWidgetProps {
  id: string;
  className?: string;
  children: React.ReactNode;
  title: string;
  icon?: React.ReactNode;
}

export default function DashboardWidget({
  id,
  className = '',
  children,
  title,
  icon,
}: DashboardWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1)',
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl shadow-sm transition-all overflow-hidden ${className} ${
        isDragging ? 'ring-2 ring-indigo-500/50 shadow-2xl border-indigo-500/50 scale-[1.01]' : ''
      }`}
    >
      {/* Widget Header with Drag Handle */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20">
        <div className="flex items-center gap-2">
          {icon && <span className="text-indigo-500">{icon}</span>}
          <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            {title}
          </h4>
        </div>
        
        {/* Grab Handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-150 dark:hover:bg-zinc-850 cursor-grab active:cursor-grabbing transition-colors"
          title="Sürükle"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col min-h-0">
        {children}
      </div>
    </div>
  );
}
