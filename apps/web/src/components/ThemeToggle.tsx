'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | undefined>(undefined);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved === 'dark' || saved === 'light' ? saved : prefersDark ? 'dark' : 'light';

    if (initial === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setTheme(initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  // Render nothing until mounted (avoids hydration mismatch)
  if (theme === undefined) {
    return <div className="w-9 h-9" />;
  }

  return (
    <button
      id="theme-toggle-btn"
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-5 h-5 overflow-hidden">
        {/* Sun Icon — visible in dark mode */}
        <div
          className={`absolute inset-0 transition-transform duration-300 ${
            theme === 'dark'
              ? 'translate-y-0 rotate-0'
              : 'translate-y-8 rotate-45'
          }`}
        >
          <Sun className="w-5 h-5 text-amber-500" />
        </div>
        {/* Moon Icon — visible in light mode */}
        <div
          className={`absolute inset-0 transition-transform duration-300 ${
            theme === 'light'
              ? 'translate-y-0 rotate-0'
              : '-translate-y-8 -rotate-45'
          }`}
        >
          <Moon className="w-5 h-5 text-indigo-500" />
        </div>
      </div>
    </button>
  );
}
