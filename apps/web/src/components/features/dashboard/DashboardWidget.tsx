'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Maximize2, X } from 'lucide-react';

interface DashboardWidgetProps {
  id: string;
  className?: string;
  children: React.ReactNode;
  title: string;
  icon?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  onSizeChange?: (size: 'small' | 'medium' | 'large') => void;
  onRemove?: () => void;
}

export default function DashboardWidget({
  id,
  className = '',
  children,
  title,
  icon,
  size,
  onSizeChange,
  onRemove,
}: DashboardWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

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
      {/* Widget Header with Size Dropdown & Drag Handle */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20">
        <div className="flex items-center gap-2">
          {icon && <span className="text-indigo-500">{icon}</span>}
          <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            {title}
          </h4>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Size Selection Dropdown */}
          {onSizeChange && size && (
            <div className="relative flex items-center" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-350 hover:bg-zinc-150/80 dark:hover:bg-zinc-850/80 transition-colors"
                title="Boyut Ayarla"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-40 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl shadow-xl z-50 py-1.5 animate-fadeIn">
                  <div className="px-3 py-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800/60 mb-1">
                    Widget Boyutu
                  </div>
                  <button
                    onClick={() => {
                      onSizeChange('small');
                      setIsMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors ${
                      size === 'small' ? 'text-indigo-650 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10' : 'text-zinc-700 dark:text-zinc-350'
                    }`}
                  >
                    Küçük (1/3)
                  </button>
                  <button
                    onClick={() => {
                      onSizeChange('medium');
                      setIsMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors ${
                      size === 'medium' ? 'text-indigo-650 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10' : 'text-zinc-700 dark:text-zinc-350'
                    }`}
                  >
                    Orta (2/3)
                  </button>
                  <button
                    onClick={() => {
                      onSizeChange('large');
                      setIsMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors ${
                      size === 'large' ? 'text-indigo-650 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10' : 'text-zinc-700 dark:text-zinc-350'
                    }`}
                  >
                    Büyük (3/3)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Remove Widget Button */}
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1 rounded-md text-zinc-400 hover:text-rose-500 dark:hover:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
              title="Kaldır"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Grab Handle */}
          <button
            {...attributes}
            {...listeners}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-350 hover:bg-zinc-150/80 dark:hover:bg-zinc-850/80 cursor-grab active:cursor-grabbing transition-colors"
            title="Sürükle"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col min-h-0">
        {children}
      </div>
    </div>
  );
}
