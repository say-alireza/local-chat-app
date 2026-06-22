'use client';

import { useState, useEffect, useRef } from 'react';
import loginStyles from '@/components/Login/Login.module.css';

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
      const res = await fetch('http://localhost:8000/api/request_join/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name }),
      });
      const data = await res.json();

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
    <div className={loginStyles.loginPage}>
      <div className={loginStyles.loginCard}>
        <div className={loginStyles.loginLeft}>
          <h1 className={loginStyles.loginTitle}>Local Chat</h1>
          <form className={loginStyles.loginForm} onSubmit={handleSubmit}>
            <div className={loginStyles.loginFormInner}>
              <label className={loginStyles.loginLabel} htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className={loginStyles.loginInput}
                placeholder="Type your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                disabled={status === 'submitting'}
              />

              {errorMsg && (
                <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>{errorMsg}</p>
              )}

              {status === 'pending' && (
                <p style={{ color: '#C9956B', fontSize: '14px', marginBottom: '12px' }}>
                  Waiting for admin approval...
                </p>
              )}

              {status === 'approved' && (
                <p style={{ color: '#22c55e', fontSize: '14px', marginBottom: '12px' }}>
                  Approved! Joining chat...
                </p>
              )}

              <button
                type="submit"
                className={loginStyles.loginBtn}
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? 'Submitting...' : 'Request Access'}
              </button>
            </div>
          </form>
        </div>
        <div className={loginStyles.loginRight}>
          <img
            src="/login-image.jpg"
            alt="Cozy desk setup"
            className={loginStyles.loginImage}
          />
        </div>
      </div>
    </div>
  );
}
