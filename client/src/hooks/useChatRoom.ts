import { useState, useRef, useEffect, useCallback } from 'react';
import api from '@/lib/api/axiosInstance';
import { OutgoingChatMessage } from '@/components/helper/inputBox';

// Define Message types based on the original component
export interface ChatMessage {
  id: string;
  text?: string;
  type?: 'text' | 'voice' | 'code';
  sender: 'user' | 'other';
  timestamp: Date;
  name: string;
  avatarUrl?: string | null;
  audioUrl?: string;
  codeSnippet?: string;
  codeLanguage?: string;
}

const getChatWebSocketUrl = (questionId: string) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  try {
    const parsed = new URL(apiUrl);
    const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${parsed.host}/ws/chat/${encodeURIComponent(questionId)}/`;
  } catch {
    return `ws://localhost:8000/ws/chat/${encodeURIComponent(questionId)}/`;
  }
};

const normalizeFileUrl = (url?: string | null) => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  try {
    const parsed = new URL(apiUrl);
    return `${parsed.origin}${url.startsWith('/') ? url : `/${url}`}`;
  } catch {
    return url;
  }
};

const detectLanguage = (code?: string) => {
    // This function is kept from the original file, it might need to import hljs
    return 'text'; 
};

export const useChatRoom = (ticketId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [questionIdForWs, setQuestionIdForWs] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback((qId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = getChatWebSocketUrl(qId);
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('🟢 Connected to Live War Room:', qId);
      setIsConnected(true);
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'presence_update' && Array.isArray(data.online_user_ids)) {
        setOnlineUserIds(data.online_user_ids.map((id: number) => Number(id)));
        return;
      }

      if (data.type === 'chat_message') {
        const isVoice = data.message_type === 'audio' || data.message_type === 'voice';
        setMessages((prev) => [
          ...prev,
          {
            id: data.message_id?.toString() || Date.now().toString(),
            text: data.message,
            type: data.message_type === 'code' ? 'code' : isVoice ? 'voice' : 'text',
            sender: Number(data.sender_id) === Number(currentUserId) ? 'user' : 'other',
            timestamp: new Date(data.created_at || Date.now()),
            name: data.username || 'Unknown',
            avatarUrl: data.sender_avatar_url || undefined,
            codeSnippet: data.code_snippet,
            audioUrl: normalizeFileUrl(isVoice ? data.file_url : undefined),
          },
        ]);
      }
    };

    wsRef.current.onclose = () => {
      console.log('🔴 Disconnected from Chat, attempting reconnect...');
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(() => connect(qId), 3000);
    };
  }, [currentUserId]);

  const sendMessage = useCallback((payload: OutgoingChatMessage) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (!payload.message.trim() && !payload.code_snippet?.trim()) return;
    wsRef.current.send(JSON.stringify(payload));
  }, []);

  useEffect(() => {
    if (questionIdForWs) {
      connect(questionIdForWs);
    }
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [questionIdForWs, connect]);
  
  return {
    messages,
    isConnected,
    sendMessage,
    participants,
    onlineUserIds,
    questionIdForWs,
    setQuestionIdForWs,
    setCurrentUserId,
    setMessages,
    setParticipants,
    setOnlineUserIds
  };
};
