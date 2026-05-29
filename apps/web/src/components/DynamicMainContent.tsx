'use client';

import React from 'react';
import { useSidebar } from './SidebarContext';

export default function DynamicMainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div
      className={`flex flex-1 flex-col min-w-0 transition-all duration-300 ${
        isCollapsed ? 'lg:pl-16' : 'lg:pl-64'
      }`}
    >
      {children}
    </div>
  );
}
