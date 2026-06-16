// components/ChatWindow/MessageBubble.tsx
import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types';
import styles from './ChatWindow.module.css';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '💯', '🎉', '🤔'];

interface Props {
  message: Message;
  isSelf: boolean;
  username: string;
  onReaction: (messageId: number, emoji: string) => void;
}

export function MessageBubble({ message, isSelf, username, onReaction }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Safely access seenBy array
  const seenBy = message.seenBy || [];
  const seenCount = seenBy.filter(u => u !== username).length;

  // Reactions from message
  const reactions = message.reactions || {};

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiClick = (emoji: string) => {
    if (message.id) {
      onReaction(message.id, emoji);
      setShowPicker(false);
    }
  };

  const totalReactions = Object.values(reactions).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div
      data-msg-id={message.id}
      className={`${styles.messageRow} ${isSelf ? styles.rowSelf : styles.rowOther}`}
    >
      <div className={`${styles.bubble} ${isSelf ? styles.bubbleSelf : styles.bubbleOther}`}>
        {!isSelf && <div className={styles.senderName}>{message.username}</div>}
        
        <div className={styles.messageText}>{message.message}</div>
        
        {/* Reactions display */}
        {Object.keys(reactions).length > 0 && (
          <div className={styles.reactionsDisplay}>
            {Object.entries(reactions).map(([emoji, users]) => (
              <span key={emoji} className={styles.reactionBadge}>
                {emoji} {users.length}
              </span>
            ))}
          </div>
        )}

        <div className={styles.messageMeta}>
          <span className={styles.messageTime}>
            {message.timestamp.toLocaleTimeString()}
          </span>
          {isSelf && message.id && (
            <span className={styles.seenStatus}>
              {seenBy.length > 0
                ? `✓✓ ${seenCount > 0 ? 'Read' : 'Sent'}`
                : '✓'}
            </span>
          )}
          {/* Reaction button */}
          {message.id && (
            <div className={styles.reactionContainer} ref={pickerRef}>
              <button
                className={styles.reactionToggle}
                onClick={() => setShowPicker(!showPicker)}
              >
                {totalReactions > 0 ? `😊 ${totalReactions}` : '😊'}
              </button>
              {showPicker && (
                <div className={styles.reactionPicker}>
                  {EMOJIS.map((emoji) => {
                    const count = reactions[emoji]?.length || 0;
                    const isReacted = reactions[emoji]?.includes(username) || false;
                    return (
                      <button
                        key={emoji}
                        className={`${styles.emojiOption} ${isReacted ? styles.emojiReacted : ''}`}
                        onClick={() => handleEmojiClick(emoji)}
                      >
                        {emoji}
                        {count > 0 && <span className={styles.emojiCount}>{count}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}