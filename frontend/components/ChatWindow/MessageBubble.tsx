// components/ChatWindow/MessageBubble.tsx
import { Message } from '@/types';
import styles from './ChatWindow.module.css';

interface Props {
  message: Message;
  isSelf: boolean;
  username: string;
}

export function MessageBubble({ message, isSelf, username }: Props) {
  // Safely access seenBy array
  const seenBy = message.seenBy || [];
  const seenCount = seenBy.filter(u => u !== username).length;

  return (
    <div
      data-msg-id={message.id}
      className={`${styles.messageRow} ${isSelf ? styles.rowSelf : styles.rowOther}`}
    >
      <div className={`${styles.bubble} ${isSelf ? styles.bubbleSelf : styles.bubbleOther}`}>
        {!isSelf && <div className={styles.senderName}>{message.username}</div>}
        <div className={styles.messageText}>{message.message}</div>
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
        </div>
      </div>
    </div>
  );
}