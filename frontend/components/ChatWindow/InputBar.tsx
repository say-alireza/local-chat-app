import { useState } from 'react';
import styles from './ChatWindow.module.css';

interface Props {
  isConnected: boolean;
  onSend: (message: string) => void;
}

export function InputBar({ isConnected, onSend }: Props) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <footer className={styles.inputBar}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        placeholder="Type a message..."
        className={styles.messageInput}
        disabled={!isConnected}
      />
      <button onClick={handleSend} disabled={!isConnected} className={styles.sendBtn}>
        Send
      </button>
      {!isConnected && (
        <div className={styles.connectionError}>Connecting to server...</div>
      )}
    </footer>
  );
}