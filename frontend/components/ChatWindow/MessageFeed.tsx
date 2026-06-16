// components/ChatWindow/MessageFeed.tsx
import { useRef, useEffect } from 'react';
import { Message } from '@/types';
import { MessageBubble } from './MessageBubble';
import styles from './ChatWindow.module.css';

interface Props {
  messages: Message[];
  username: string;
  onMessageVisible: (id: number) => void;
}

export function MessageFeed({ messages, username, onMessageVisible }: Props) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!feedRef.current) return;
    feedRef.current.scrollTop = feedRef.current.scrollHeight;

    const visible = feedRef.current.querySelectorAll('[data-msg-id]');
    visible.forEach(el => {
      const id = parseInt(el.getAttribute('data-msg-id') || '0', 10);
      if (id) onMessageVisible(id);
    });
  }, [messages, onMessageVisible]);

  return (
    <div className={styles.messageFeed} ref={feedRef}>
      {messages.length === 0 && (
        <div className={styles.emptyState}>No messages yet. Start the conversation!</div>
      )}
      {messages.map((msg, idx) =>
        msg.type === 'system' ? (
          <div key={idx} className={styles.systemMessage}>{msg.message}</div>
        ) : (
          <MessageBubble
            key={idx}
            message={msg}
            isSelf={msg.username === username}
            username={username}
          />
        )
      )}
    </div>
  );
}