// components/ChatWindow/index.tsx
'use client';

import { useState, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useSeenStatus } from '@/hooks/useSeenStatus';
import { Message } from '@/types';
import { MessageFeed } from './MessageFeed';
import { OnlinePanel } from './OnlinePanel';
import { InputBar } from './InputBar';
import { UsernameModal } from './UsernameModal';
import styles from './ChatWindow.module.css';

interface ChatWindowProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function ChatWindow({ theme, onToggleTheme }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineMembers, setOnlineMembers] = useState<string[]>([]);
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);

  const { markSeen } = useSeenStatus(username);

  const handleMessage = useCallback((msg: Message) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const handleOnlineUsers = useCallback((users: string[]) => {
    setOnlineMembers(users);
  }, []);

  const handleHistory = useCallback((history: Message[]) => {
    setMessages(history);
  }, []);

  const handleSeen = useCallback((messageId: number, seenBy: string[]) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, seenBy } : m
    ));
  }, []);

  const { isConnected, sendMessage } = useWebSocket({
    username,
    onMessage: handleMessage,
    onOnlineUsers: handleOnlineUsers,
    onHistory: handleHistory,
    onSeen: handleSeen,
  });

  const handleMessageVisible = useCallback((id: number) => {
    markSeen(id);
  }, [markSeen]);

  const handleUsernameSet = useCallback((name: string) => {
    setUsername(name);
    setIsUsernameSet(true);
  }, []);

  if (!isUsernameSet) {
    return <UsernameModal onUsernameSet={handleUsernameSet} />;
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Local Chat</h1>
          <span className={styles.statusDot} data-connected={isConnected} />
          <span className={styles.statusText}>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.userLabel}>{username}</span>
          <button onClick={onToggleTheme} className={styles.themeBtn}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        <MessageFeed
          messages={messages}
          username={username}
          onMessageVisible={handleMessageVisible}
        />
        <OnlinePanel users={onlineMembers} />
      </main>

      <InputBar isConnected={isConnected} onSend={sendMessage} />
    </div>
  );
}