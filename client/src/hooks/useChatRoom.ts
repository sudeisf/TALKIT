import { useState, useRef, useEffect, useCallback } from 'react';
import api from '@/lib/api/axiosInstance';
import { OutgoingChatMessage, OptimisticMessage } from '@/components/helper/inputBox';

// Define Message types based on the original component
export interface ChatMessage {
  id: string;
  text?: string;
  type?: 'text' | 'voice' | 'audio' | 'code' | 'image' | 'document' | 'other';
  sender: 'user' | 'other';
  timestamp: Date;
  name: string;
  avatarUrl?: string | null;
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  codeSnippet?: string;
  codeLanguage?: string;
  isOptimistic?: boolean; // temp flag while waiting for server echo
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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

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
        const isMine = Number(data.sender_id) === Number(currentUserId);
        setMessages((prev) => {
          // Remove the first optimistic placeholder of same type (only for own messages)
          let removed = false;
          const filtered = isMine
            ? prev.filter((m) => {
                if (!removed && m.isOptimistic && m.type === data.message_type) {
                  removed = true;
                  return false;
                }
                return true;
              })
            : prev;
          return [
            ...filtered,
            {
              id: data.message_id?.toString() || Date.now().toString(),
              text: data.message,
              type: data.message_type,
              sender: isMine ? 'user' : 'other',
              timestamp: new Date(data.created_at || Date.now()),
              name: data.username || 'Unknown',
              avatarUrl: data.sender_avatar_url || undefined,
              codeSnippet: data.code_snippet,
              audioUrl: normalizeFileUrl(isVoice ? data.file_url : undefined),
              fileUrl: normalizeFileUrl(data.file_url),
              fileName: data.file_name || undefined,
            },
          ];
        });
      }
    };

    wsRef.current.onclose = () => {
      console.log('🔴 Disconnected from Chat, attempting reconnect...');
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(() => connect(qId), 3000);
    };
  }, [currentUserId]);

  const sendMessage = useCallback((payload: OutgoingChatMessage, optimistic?: OptimisticMessage) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (!payload.message?.trim() && !payload.code_snippet?.trim() && !payload.audio_base64 && !payload.file_base64) return;

    if (optimistic) {
      const tempId = `optimistic-${Date.now()}`;
      const optimisticMsg: ChatMessage = {
        id: tempId,
        sender: 'user',
        timestamp: new Date(),
        name: optimistic.name || '',
        type: (optimistic.type as ChatMessage['type']) || 'text',
        text: optimistic.text,
        fileUrl: optimistic.fileUrl,
        fileName: optimistic.fileName,
        audioUrl: optimistic.audioUrl,
        isOptimistic: true,
      };
      setMessages((prev) => [...prev, optimisticMsg]);
    }

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
