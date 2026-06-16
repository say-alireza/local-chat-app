'use client';

import { useState, useCallback } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
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

  // =============================================
  // HANDLE REACTION UPDATE FROM WEBSOCKET
  // =============================================
  const handleReactionUpdate = useCallback((messageId: number, emoji: string, username: string, reactions: Record<string, string[]>) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, reactions } : m
    ));
  }, []);

  // =============================================
  // HANDLE REACTION CLICK (SEND TO API)
  // =============================================
  const handleReaction = useCallback(async (messageId: number, emoji: string) => {
    try {
      const response = await fetch('https://localhost:8000/api/toggle_reaction/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message_id: messageId, emoji }),
      });
      const data = await response.json();
      if (data.success) {
        setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, reactions: data.reactions } : m
        ));
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  }, []);

  // =============================================
  // USE WEBSOCKET – WITH onReactionUpdate
  // =============================================
  const { isConnected, sendMessage } = useWebSocket({
    username,
    onMessage: handleMessage,
    onOnlineUsers: handleOnlineUsers,
    onHistory: handleHistory,
    onSeen: handleSeen,
    onReactionUpdate: handleReactionUpdate, // ← ADD THIS
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

  // =============================================
  // RETURN – WITH DARK THEME CLASS
  // =============================================
  return (
    <div className={`${styles.app} ${theme === 'dark' ? styles.dark : ''}`}>
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
          onReaction={handleReaction}
        />
        <OnlinePanel users={onlineMembers} />
      </main>

      <InputBar isConnected={isConnected} onSend={sendMessage} />
    </div>
  );
}