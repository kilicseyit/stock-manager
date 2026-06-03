import { useEffect } from 'react';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Input veya textarea gibi yazı alanlarında kısayolların tetiklenmesini engelle
      const target = e.target as HTMLElement;
      if (!target) return;
      
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isInput) return;

      // Ctrl + N (Yeni kayıt modalı)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('trigger-new-modal'));
      }

      // Escape (Aktif modalı kapat)
      if (e.key === 'Escape') {
        window.dispatchEvent(new CustomEvent('close-active-modal'));
      }

      // ? (Kısayol modalı)
      if (e.key === '?') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('toggle-shortcuts-modal'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
