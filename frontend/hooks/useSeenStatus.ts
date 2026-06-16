// hooks/useSeenStatus.ts
import { useRef, useCallback } from 'react';
import { markSeen as markSeenApi } from '@/utils/api';

export function useSeenStatus(username: string) {
  const seenSentRef = useRef<Set<number>>(new Set());

  const markSeen = useCallback(async (msgId: number) => {
    if (seenSentRef.current.has(msgId)) return;
    seenSentRef.current.add(msgId);
    try {
      await markSeenApi(msgId, username);
    } catch {
      seenSentRef.current.delete(msgId);
    }
  }, [username]);

  return { markSeen };
}