// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import ChatWindow from '@/components/ChatWindow';

export default function Home() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Apply data-theme to html element when theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return <ChatWindow theme={theme} onToggleTheme={toggleTheme} />;
}