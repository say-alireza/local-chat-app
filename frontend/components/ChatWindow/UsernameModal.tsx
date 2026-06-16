// components/ChatWindow/UsernameModal.tsx
import { useState } from 'react';
import styles from './ChatWindow.module.css';

interface Props {
  onUsernameSet: (username: string) => void;
}

export function UsernameModal({ onUsernameSet }: Props) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onUsernameSet(username);
    }
  };

  return (
    <div className={styles.usernameOverlay}>
      <div className={styles.usernameCard}>
        <h1>Local Chat</h1>
        <p>Enter your username to join the chat</p>
        <form onSubmit={handleSubmit}>
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