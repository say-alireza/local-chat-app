import { useState, useEffect, useRef } from 'react';
import styles from './ChatWindow.module.css';

interface Props {
  onUsernameSet: (username: string) => void;
}

type ApprovalStatus = 'idle' | 'submitting' | 'pending' | 'approved' | 'error';

export function UsernameModal({ onUsernameSet }: Props) {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<ApprovalStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    if (status === 'pending') {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(
            `http://localhost:8000/api/check_approval/?username=${encodeURIComponent(username)}`
          );
          const data = await res.json();
          if (data.status === 'approved') {
            clearInterval(pollingRef.current!);
            pollingRef.current = null;
            setStatus('approved');
          }
        } catch {}
      }, 3000);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [status, username]);

  useEffect(() => {
    if (status === 'approved') {
      onUsernameSet(username);
    }
  }, [status, username, onUsernameSet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = username.trim();
    if (!name) return;

    setStatus('submitting');
    setErrorMsg('');

    try {
      console.log('[UsernameModal] Sending request_join for:', name);
      const res = await fetch('http://localhost:8000/api/request_join/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name }),
      });
      console.log('[UsernameModal] Response status:', res.status);
      const data = await res.json();
      console.log('[UsernameModal] Response data:', data);

      if (data.status === 'pending') {
        setStatus('pending');
      } else if (data.error) {
        setErrorMsg(data.error);
        setStatus('idle');
      } else {
        setStatus('idle');
      }
    } catch {
      setErrorMsg('Failed to connect to server');
      setStatus('idle');
    }
  };

  return (
    <div className={styles.usernameOverlay}>
      <div className={styles.usernameCard}>
        <h1>Local Chat</h1>

        {status === 'pending' && (
          <div>
            <p>Your request is pending admin approval.</p>
            <p className={styles.pendingDots}>Waiting for approval...</p>
          </div>
        )}

        {status === 'approved' && (
          <p>Approved! Joining chat...</p>
        )}

        {(status === 'idle' || status === 'submitting') && (
          <form onSubmit={handleSubmit}>
            <p>Enter your username to request access</p>
            {errorMsg && <p className={styles.errorText}>{errorMsg}</p>}
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoFocus
              disabled={status === 'submitting'}
            />
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? 'Submitting...' : 'Request Access'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
