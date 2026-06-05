'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  username: string;
  message: string;
  timestamp: Date;
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isUsernameSet, setIsUsernameSet] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/chat/');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to chat server');
      setIsConnected(true);
    };

    ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, {
        username: data.username,
        message: data.message,
        timestamp: new Date()
      }]);
    };

    ws.onclose = () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    };

    ws.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
    };

    // Cleanup on component unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const sendMessage = () => {
    if (input.trim() && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        message: input,
        username: username
      }));
      setInput('');
    }
  };

  const handleSetUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setIsUsernameSet(true);
    }
  };

  // Username setup screen
  if (!isUsernameSet) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="bg-white rounded-lg shadow-xl p-8 w-96">
          <h1 className="text-2xl font-bold text-center mb-6">Local Chat</h1>
          <p className="text-gray-600 text-center mb-6">Enter your username to join the chat</p>
          <form onSubmit={handleSetUsername}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600 transition"
            >
              Join Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4 border-b">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Local Chat</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Logged in as:</span>
            <span className="font-medium text-blue-600">{username}</span>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.username === username ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                msg.username === username
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 shadow'
              }`}
            >
              {msg.username !== username && (
                <div className="text-xs font-semibold text-gray-500 mb-1">
                  {msg.username}
                </div>
              )}
              <div>{msg.message}</div>
              <div className={`text-xs mt-1 ${msg.username === username ? 'text-blue-100' : 'text-gray-400'}`}>
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="bg-white border-t px-6 py-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isConnected}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected}
            className="bg-blue-500 text-white rounded-lg px-6 py-2 hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        {!isConnected && (
          <p className="text-red-500 text-sm mt-2 text-center">
            Connecting to server... Make sure Django is running on port 8000
          </p>
        )}
      </div>
    </div>
  );
}