'use client';

import { useEffect, useState } from 'react';
import ChatWindow from '@/components/ChatWindow';

export default function Home() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <ChatWindow theme={theme} onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} />;
}
