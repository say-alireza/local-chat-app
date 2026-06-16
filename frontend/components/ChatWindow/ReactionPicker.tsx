import { useState, useRef, useEffect } from 'react';
import styles from './ChatWindow.module.css';

interface ReactionPickerProps {
  messageId: number;
  onReact: (messageId: number, emoji: string) => void;
  currentReactions?: Record<string, string[]>;
  username: string;
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '💯', '🎉', '🤔'];

export function ReactionPicker({ messageId, onReact, currentReactions, username }: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiClick = (emoji: string) => {
    onReact(messageId, emoji);
    setIsOpen(false);
  };

  // Get total reactions count (for badge)
  const totalReactions = currentReactions 
    ? Object.values(currentReactions).reduce((sum, users) => sum + users.length, 0)
    : 0;

  return (
    <div className={styles.reactionContainer} ref={pickerRef}>
      <button 
        className={styles.reactionToggle} 
        onClick={() => setIsOpen(!isOpen)}
      >
        {totalReactions > 0 ? `😊 ${totalReactions}` : '😊'}
      </button>

      {isOpen && (
        <div className={styles.reactionPicker}>
          {EMOJIS.map((emoji) => {
            const count = currentReactions?.[emoji]?.length || 0;
            const isReacted = currentReactions?.[emoji]?.includes(username) || false;
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
  );
}