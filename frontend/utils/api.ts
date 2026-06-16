
// utils/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8000';

export async function markSeen(messageId: number, username: string) {
  const resp = await fetch(`${API_BASE}/api/mark_seen/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message_id: messageId, username }),
  });
  return resp.json();
}

export async function getCurrentUser() {
  const resp = await fetch(`${API_BASE}/api/user/`, {
    credentials: 'include',
  });
  return resp.json();
}

export async function login(username: string, password: string) {
  const resp = await fetch(`${API_BASE}/api/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });
  return resp.json();
}