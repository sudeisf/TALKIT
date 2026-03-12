'use client';

import { useParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BookOpen, MoreVertical, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import hljs from 'highlight.js/lib/core';
import api from '@/lib/api/axiosInstance'

// ----------------------------------------------------------------------
// HELPER FUNCTIONS 
// ----------------------------------------------------------------------
const isEmojiOnly = (text?: string) => {
  if (!text) return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  const emojiRegex = /[\p{Emoji_Presentation}\uFE0F\u200D\p{Extended_Pictographic}]/gu;
  const withoutEmoji = trimmed.replace(emojiRegex, '').trim();
  return withoutEmoji.length === 0;
};

const detectLanguage = (code?: string) => {
  if (!code?.trim()) return 'text';
  try {
    const result = hljs.highlightAuto(code);
    return result.language || 'text';
  } catch {
    return 'text';
  }
};

const parseMarkdownCodeBlock = (input?: string) => {
  if (!input) return null;
  const match = input.match(/```([\w+-]*)\n([\s\S]*?)```/);
  if (!match) return null;
  const [, lang, code] = match;
  return { language: lang?.trim() || undefined, code: code?.trimEnd() || '' };
};

const looksLikeCode = (input?: string) => {
  if (!input) return false;
  const text = input.trim();
  if (!text) return false;
  const hasMultipleLines = text.split('\n').length >= 3;
  const hasCodeSignals = /(from\s+\w+\s+import|import\s+\w+|def\s+\w+\(|class\s+\w+|const\s+\w+|let\s+\w+|function\s+\w+\(|=>|re_path\(|\{|\}|\[|\]|;)/m.test(text);
  return hasMultipleLines && hasCodeSignals;
};

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------
interface Message {
  id: string;
  text?: string;
  type?: 'text' | 'voice' | 'code';
  sender: 'user' | 'other';
  timestamp: Date;
  name: string;
  audioUrl?: string;
  codeSnippet?: string;
  codeLanguage?: string;
}

interface SessionDetails {
  title: string;
  description: string;
  tags: string[];
}

export default function ChatRoomPage() {
  const params = useParams();
  const ticketId = params?.id as string;

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // ⚠️ TODO: Replace this with your actual logged in User ID from context/Zustand
  const currentUserId = 1; 

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // ----------------------------------------------------------------------
  // FETCH SESSION DETAILS FROM DJANGO
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (!ticketId || ticketId === 'undefined') return;

    const fetchSession = async () => {
      try {
        // Ensure you have an endpoint in Django to get question details
        const res = await api.get(`/questions/${ticketId}/`);
        setSessionDetails({
          title: res.data.title,
          description: res.data.description,
          // Extract tag names if backend returns an array of objects
          tags: res.data.tags?.map((t: any) => typeof t === 'string' ? t : t.name) ||[]
        });
      } catch (error) {
        console.error("Failed to fetch session details:", error);
        setSessionDetails({
          title: 'Session Not Found',
          description: 'Could not load details for this session.',
          tags: []
        });
      }
    };

    fetchSession();
  },[ticketId]);

  // ----------------------------------------------------------------------
  // WEBSOCKET CONNECTION
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (!ticketId || ticketId === 'undefined') return;

    const wsUrl = `ws://127.0.0.1:8000/ws/chat/${ticketId}/`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log("🟢 Connected to Live War Room:", ticketId);
      setIsConnected(true);
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'chat_message') {
        setMessages((prev) =>[
          ...prev,
          {
            id: data.message_id?.toString() || Date.now().toString(),
            text: data.message,
            type: data.message_type === 'code' ? 'code' : 'text',
            sender: data.sender_id === currentUserId ? 'user' : 'other',
            timestamp: new Date(data.created_at || Date.now()),
            name: data.username || 'Unknown',
            codeSnippet: data.code_snippet,
            codeLanguage: detectLanguage(data.code_snippet),
            audioUrl: data.file_url,
          }
        ]);
      }
    };

    wsRef.current.onclose = () => {
      console.log("🔴 Disconnected from Chat");
      setIsConnected(false);
    };

    return () => {
      wsRef.current?.close();
    };
  }, [ticketId, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ----------------------------------------------------------------------
  // SEND MESSAGE HANDLER
  // ----------------------------------------------------------------------
  const sendCurrentMessage = () => {
    if (!messageInput.trim() || !wsRef.current) return;

    const rawMessage = messageInput;
    const parsedFence = parseMarkdownCodeBlock(rawMessage);
    const isAutoCode = looksLikeCode(rawMessage);
    const finalCode = parsedFence?.code || (isAutoCode ? rawMessage : "");
    const isCode = !!finalCode;

    const payload = {
      type: "message",
      message: isCode ? "Code snippet" : rawMessage,
      message_type: isCode ? "code" : "text",
      code_snippet: finalCode,
      code_language: parsedFence?.language || detectLanguage(finalCode)
    };

    wsRef.current.send(JSON.stringify(payload));
    setMessageInput('');
  };

  const handleComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendCurrentMessage();
    }
  };

  // ----------------------------------------------------------------------
  // GUARD CLAUSE: Show empty state if no chat selected
  // ----------------------------------------------------------------------
  if (!ticketId || ticketId === 'undefined') {
    return (
      <div className="flex flex-col h-[calc(100vh-50px)] items-center justify-center bg-gray-50/50 mt-2 mx-4 rounded-lg border border-dashed border-gray-300">
        <div className="w-16 h-16 bg-white border border-gray-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <MessageSquare className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-medium text-gray-700">No session selected</h2>
        <p className="text-gray-500 mt-1 text-sm">Select a chat from the sidebar or ask a new question.</p>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // RENDER UI
  // ----------------------------------------------------------------------
  return (
    <div className="flex rounded-lg border border-border bg-background mt-2 mx-4 shadow-sm flex-col h-[calc(100vh-50px)]">
      
      <div className="px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="font-medium text-lg text-foreground">
                  {sessionDetails?.title || `Loading Session #${ticketId}...`}
                </h2>
                <span className={cn("w-2 h-2 rounded-full animate-pulse", isConnected ? "bg-green-500" : "bg-red-500")} />
              </div>
              <div className="flex flex-wrap gap-2">
                {sessionDetails?.tags.map((cat, index) => (
                  <span key={index} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="hover:bg-muted">
            <MoreVertical className="h-5 w-5 text-foreground" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 bg-muted/20">
        <div className="p-4 space-y-6">
          
          {sessionDetails && (
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#03624c] flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">Problem Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {sessionDetails.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={cn('flex gap-3 max-w-[85%]', msg.sender === 'user' ? 'ml-auto flex-row-reverse' : '')}>
              <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                <AvatarFallback className={cn("text-xs text-white", msg.sender === 'user' ? "bg-[#03624c]" : "bg-slate-600")}>
                  {msg.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className={cn('flex flex-col gap-1', msg.sender === 'user' ? 'items-end' : 'items-start')}>
                <span className="text-[11px] text-muted-foreground px-1">{msg.name}</span>
                
                {(!msg.type || msg.type === 'text') && (
                  isEmojiOnly(msg.text) ? (
                    <div className="px-1 py-0.5"><p className="text-4xl leading-none">{msg.text}</p></div>
                  ) : (
                    <div className={cn('rounded-2xl px-4 py-2 break-words', 
                        msg.sender === 'user' ? 'bg-[#03624c] text-white rounded-tr-sm' : 'bg-white border border-border text-foreground rounded-tl-sm')}>
                      <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  )
                )}

                {msg.type === 'code' && msg.codeSnippet && (
                  <div className="w-full max-w-[500px] overflow-hidden rounded-lg border border-border bg-[#282c34] shadow-sm">
                    <div className="px-3 py-1.5 text-[11px] text-gray-400 border-b border-gray-700 bg-[#21252b] flex justify-between">
                      <span>{msg.codeLanguage || 'code'}</span>
                    </div>
                    <SyntaxHighlighter
                      language={msg.codeLanguage || 'text'}
                      style={oneDark}
                      customStyle={{ margin: 0, padding: '12px', fontSize: '13px', background: 'transparent' }}
                      wrapLongLines
                    >
                      {msg.codeSnippet}
                    </SyntaxHighlighter>
                    {msg.text && msg.text !== 'Code snippet' && (
                        <div className="p-2 text-sm text-gray-300 bg-[#21252b] border-t border-gray-700">
                            {msg.text}
                        </div>
                    )}
                  </div>
                )}

                <span className="text-[10px] text-muted-foreground px-1 mt-0.5">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 bg-card border-t border-border shrink-0">
        <div className="flex items-end gap-3 bg-muted/50 rounded-xl border border-border p-2 focus-within:ring-1 focus-within:ring-[#03624c] transition-all">
          <textarea
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder="Type a message or paste code..."
            rows={1}
            className="w-full max-h-32 min-h-[40px] resize-none overflow-y-auto bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button
            onClick={sendCurrentMessage}
            disabled={!messageInput.trim() || !isConnected}
            className="rounded-lg bg-[#03624c] hover:bg-[#024a3a] text-white shrink-0 mb-0.5"
          >
            {isConnected ? 'Send' : <Loader2 className="w-4 h-4 animate-spin" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Pro tip: Paste code blocks or use Markdown <code>```python</code> to automatically format code.
        </p>
      </div>
    </div>
  );
}