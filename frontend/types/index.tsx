export interface Message {
  id?: number;
  type: 'chat' | 'system';
  username: string;
  message: string;
  timestamp: Date;
  seenBy: string[];
  reactions?: Record<string, string[]>;
}

export interface ChatState {
  messages: Message[];
  onlineMembers: string[];
  isConnected: boolean;
  username: string;
}