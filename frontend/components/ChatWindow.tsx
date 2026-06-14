'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './ChatWindow.module.css';

interface Message {
  id?: number;
  type: 'chat' | 'system';
  username: string;
  message: string;
  timestamp: Date;
  seenBy: string[];
}

interface ChatWindowProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function ChatWindow({ theme, onToggleTheme }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineMembers, setOnlineMembers] = useState<string[]>([]);
  const [input, setInput] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isUsernameSet, setIsUsernameSet] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const seenSentRef = useRef<Set<number>>(new Set());

  const markSeen = useCallback(async (msgId: number) => {
    if (seenSentRef.current.has(msgId)) return;
    seenSentRef.current.add(msgId);
    try {
      const resp = await fetch('http://localhost:8000/api/mark_seen/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: msgId, username }),
      });
      const data = await resp.json();
      if (data.success) {
        setMessages(prev => prev.map(m =>
          m.id === msgId ? { ...m, seenBy: data.seen_by } : m
        ));
      }
    } catch {
      seenSentRef.current.delete(msgId);
    }
  }, [username]);

  useEffect(() => {
    if (!isUsernameSet) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/chat/?username=${encodeURIComponent(username)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === 'online_users') {
        setOnlineMembers(data.users);
        return;
      }
      if (data.type === 'seen') {
        setMessages(prev => prev.map(m =>
          m.id === data.message_id ? { ...m, seenBy: data.seen_by } : m
        ));
        return;
      }
      if (data.type === 'history') {
        setMessages(data.messages.map((msg: any) => ({
          id: msg.id,
          type: 'chat',
          username: msg.username,
          message: msg.message,
          timestamp: new Date(msg.timestamp),
          seenBy: msg.seen_by || [],
        })));
        return;
      }
      setMessages(prev => [...prev, {
        id: data.id,
        type: data.type === 'system' ? 'system' : 'chat',
        username: data.username || '',
        message: data.message,
        timestamp: new Date(),
        seenBy: [],
      }]);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isUsernameSet, username]);

  useEffect(() => {
    if (!feedRef.current) return;
    feedRef.current.scrollTop = feedRef.current.scrollHeight;

    const visible = feedRef.current.querySelectorAll('[data-msg-id]');
    visible.forEach(el => {
      const id = parseInt(el.getAttribute('data-msg-id') || '0', 10);
      if (id) markSeen(id);
    });
  }, [messages, markSeen]);

  const sendMessage = () => {
    if (input.trim() && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        message: input,
        username: username
      }));
      setInput('');
    }
  };

  const handleSetUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setIsUsernameSet(true);
    }
  };

  if (!isUsernameSet) {
    return (
      <div className={styles.usernameOverlay}>
        <div className={styles.usernameCard}>
          <h1>Local Chat</h1>
          <p>Enter your username to join the chat</p>
          <form onSubmit={handleSetUsername}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoFocus
            />
            <button type="submit" className={styles.primaryBtn}>
              Join Chat
            </button>
          </form>
        </div>
      </div>
    );
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
        <div className={styles.messageFeed} ref={feedRef}>
          {messages.length === 0 && (
            <div className={styles.emptyState}>No messages yet. Start the conversation!</div>
          )}
          {messages.map((msg, idx) => (
            msg.type === 'system' ? (
              <div key={idx} className={styles.systemMessage}>
                {msg.message}
              </div>
            ) : (
              <div
                key={idx}
                data-msg-id={msg.id}
                className={`${styles.messageRow} ${msg.username === username ? styles.rowSelf : styles.rowOther}`}
              >
                <div className={`${styles.bubble} ${msg.username === username ? styles.bubbleSelf : styles.bubbleOther}`}>
                  {msg.username !== username && (
                    <div className={styles.senderName}>{msg.username}</div>
                  )}
                  <div className={styles.messageText}>{msg.message}</div>
                  <div className={styles.messageMeta}>
                    <span className={styles.messageTime}>
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                    {msg.username === username && msg.id && (
                      <span className={styles.seenStatus}>
                        {msg.seenBy.length > 0
                          ? `✓✓ ${msg.seenBy.filter(u => u !== username).length > 0 ? 'Read' : 'Sent'}`
                          : '✓'
                        }
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
        <aside className={styles.onlinePanel}>
          <div className={styles.onlineHeader}>
            Online ({onlineMembers.length})
          </div>
          <ul className={styles.onlineList}>
            {onlineMembers.map((user) => (
              <li key={user} className={styles.onlineItem}>
                <span className={styles.onlineDot} />
                {user}
              </li>
            ))}
          </ul>
        </aside>
      </main>

      <footer className={styles.inputBar}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className={styles.messageInput}
          disabled={!isConnected}
        />
        <button
          onClick={sendMessage}
          disabled={!isConnected}
          className={styles.sendBtn}
        >
          Send
        </button>
        {!isConnected && (
          <div className={styles.connectionError}>
            Connecting to server...
          </div>
        )}
      </footer>
    </div>
  );
}
