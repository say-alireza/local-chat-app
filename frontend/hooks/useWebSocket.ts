// hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { Message } from '@/types';

interface UseWebSocketOptions {
  username: string;
  onMessage: (msg: Message) => void;
  onOnlineUsers: (users: string[]) => void;
  onHistory: (messages: Message[]) => void;
  onSeen: (messageId: number, seenBy: string[]) => void;
}

export function useWebSocket({
  username,
  onMessage,
  onOnlineUsers,
  onHistory,
  onSeen,
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ message, username }));
      return true;
    }
    return false;
  }, [username]);

  useEffect(() => {
    const ws = new WebSocket(`wss://localhost:8000/ws/chat/?username=${encodeURIComponent(username)}`);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => setIsConnected(false);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'online_users':
          onOnlineUsers(data.users);
          break;
        case 'seen':
          onSeen(data.message_id, data.seen_by);
          break;
        case 'history':
          onHistory(data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })));
          break;
        default:
          onMessage({
            id: data.id,
            type: data.type === 'system' ? 'system' : 'chat',
            username: data.username || '',
            message: data.message,
            timestamp: new Date(),
            seenBy: [],
          });
      }
    };

    return () => {
      ws.close();
    };
  }, [username, onMessage, onOnlineUsers, onHistory, onSeen]);

  return { isConnected, sendMessage };
}