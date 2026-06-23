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
    console.log('[ChatWindow] handleReactionUpdate:', { messageId, emoji, username, reactions });
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, reactions } : m
    ));
  }, []);

  // =============================================
  // USE WEBSOCKET – WITH onReactionUpdate
  // =============================================
  const { isConnected, sendMessage, sendReaction } = useWebSocket({
    username,
    onMessage: handleMessage,
    onOnlineUsers: handleOnlineUsers,
    onHistory: handleHistory,
    onSeen: handleSeen,
    onReactionUpdate: handleReactionUpdate,
  });

  // =============================================
  // HANDLE REACTION CLICK (SEND VIA WEBSOCKET)
  // =============================================
  const handleReaction = useCallback((messageId: number, emoji: string) => {
    console.log('[ChatWindow] handleReaction:', { messageId, emoji });
    sendReaction(messageId, emoji);
  }, [sendReaction]);

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
        <OnlinePanel users={onlineMembers} />
        <div className={styles.chatColumn}>
          <MessageFeed
            messages={messages}
            username={username}
            onMessageVisible={handleMessageVisible}
            onReaction={handleReaction}
          />
          <InputBar isConnected={isConnected} onSend={sendMessage} />
        </div>
      </main>
    </div>
  );
}