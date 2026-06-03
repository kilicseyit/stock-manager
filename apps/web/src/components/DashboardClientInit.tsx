'use client';

import React, { useState, useEffect } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal';
import OnboardingGuide from '@/components/ui/OnboardingGuide';

interface DashboardClientInitProps {
  userId: string;
}

export default function DashboardClientInit({ userId }: DashboardClientInitProps) {
  useKeyboardShortcuts();
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => {
      setIsShortcutsOpen((prev) => !prev);
    };
    const handleClose = () => {
      setIsShortcutsOpen(false);
    };

    window.addEventListener('toggle-shortcuts-modal', handleToggle);
    window.addEventListener('close-active-modal', handleClose);

    return () => {
      window.removeEventListener('toggle-shortcuts-modal', handleToggle);
      window.removeEventListener('close-active-modal', handleClose);
    };
  }, []);

  return (
    <>
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
      <OnboardingGuide userId={userId} />
    </>
  );
}
