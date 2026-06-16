// app/page.tsx
'use client';

import ChatWindow from '@/components/ChatWindow';   // <-- this points to index.tsx
import { useState } from 'react';

export default function Home() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return <ChatWindow theme={theme} onToggleTheme={toggleTheme} />;
}