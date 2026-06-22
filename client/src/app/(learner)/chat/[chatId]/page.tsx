'use client';

import { useParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BookOpen, MessageSquare, MoreVertical, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import hljs from 'highlight.js/lib/core';
import api from '@/lib/api/axiosInstance';
import { MessageInput } from '@/components/helper/inputBox';
import { Skeleton, SkeletonChatMessage } from '@/components/ui/skeleton';
import { useMinimumLoading } from '@/hooks/use-minimum-loading';
import { useChatRoom } from '@/hooks/useChatRoom';

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

const renderLinkedText = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (!part) return null;
    if (/^(https?:\/\/|www\.)/i.test(part)) {
      const href = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a
          key={`link-${index}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline underline-offset-2"
        >
          {part}
        </a>
      );
    }
    return <span key={`text-${index}`}>{part}</span>;
  });
};

interface SessionDetails {
  title: string;
  description: string;
  tags: string[];
}

export default function ChatRoomPage() {
  const params = useParams();
  const ticketId = (params?.chatId ?? params?.id) as string;

  const { 
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
  } = useChatRoom(ticketId);

  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [owner, setOwner] = useState<any | null>(null);
  const showThreadSkeleton = useMinimumLoading(!historyLoaded);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const onlineParticipants = participants.filter((p) => onlineUserIds.includes(p.id));
  const offlineParticipants = participants.filter((p) => !onlineUserIds.includes(p.id));

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  useEffect(() => {
    if (!ticketId || ticketId === 'undefined') return;

    const fetchSession = async () => {
      try {
        const sessionRes = await api.get(`/chat/sessions/${ticketId}/`);
        const data = sessionRes.data;
        setSessionDetails({
          title: data.title,
          description: data.description,
          tags: Array.isArray(data.tags) ? data.tags : [],
        });
        setOwner(data.asked_by || null);
        setParticipants(Array.isArray(data.participants) ? data.participants : []);
        setCurrentUserId(typeof data.current_user_id === 'number' ? data.current_user_id : null);
        if (Array.isArray(data.messages)) {
          const mappedMessages = data.messages.map((message: any) => {
            const firstName = message.sender?.first_name || '';
            const lastName = message.sender?.last_name || '';
            const fallbackName = message.sender?.username || 'User';
            const resolvedName = `${firstName} ${lastName}`.trim() || fallbackName;

            return {
              id: String(message.id),
              text: message.message_content,
              type: message.message_type || 'text',
              sender: message.is_mine ? 'user' : 'other',
              timestamp: new Date(message.created_at),
              name: resolvedName,
              avatarUrl: message.sender?.profile_image_url || undefined,
              codeSnippet: message.code_snippet || undefined,
              codeLanguage: message.message_type === 'code' ? detectLanguage(message.code_snippet) : undefined,
              audioUrl: normalizeFileUrl(message.file_url || undefined),
              fileUrl: normalizeFileUrl(message.file_url || undefined),
              fileName: message.file_name || undefined,
            };
          });
          setMessages(mappedMessages);
        }
        setQuestionIdForWs(String(data.question_id));
        setHistoryLoaded(true);
      } catch {
        try {
          const res = await api.get(`/questions/${ticketId}/`);
          setSessionDetails({
            title: res.data.title,
            description: res.data.description,
            tags: res.data.tags?.map((t: any) => typeof t === 'string' ? t : t.name) || [],
          });
          setQuestionIdForWs(ticketId);
          setHistoryLoaded(true);
        } catch (err) {
          console.error("Failed to fetch session details:", err);
          setSessionDetails({
            title: 'Session Not Found',
            description: 'Could not load details for this session.',
            tags: [],
          });
          setQuestionIdForWs(null);
          setHistoryLoaded(true);
        }
      }
    };
    fetchSession();
  }, [ticketId, setQuestionIdForWs, setCurrentUserId, setMessages, setParticipants]);

  useEffect(() => {
    if (!questionIdForWs) return;
    api.get(`/chat/sessions/${questionIdForWs}/members/`).then((res) => {
      setParticipants(res.data.participants || []);
      setOnlineUserIds((res.data.online_user_ids || []).map((id: number) => Number(id)));
    });
  }, [questionIdForWs, setParticipants, setOnlineUserIds]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!ticketId || ticketId === 'undefined') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50/50 mx-4 mt-2">
        <div className="w-16 h-16 bg-white border border-gray-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <MessageSquare className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-medium text-gray-700">No session selected</h2>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-lg border border-border bg-background mt-2 mx-4 shadow-sm h-[calc(100vh-50px)]">
      <div className="min-w-0 shrink-0 border-b border-border bg-card px-4 py-3">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
              <div className="flex min-w-0 items-center gap-2">
                {owner && (
                  <Avatar className="h-10 w-10 border-4 border-white">
                    <AvatarImage src={owner.profile_image_url || undefined} />
                    <AvatarFallback>{(owner.first_name || owner.username || 'S').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                {showThreadSkeleton ? <Skeleton className="h-6 w-56" /> : <h2 className="min-w-0 truncate font-medium text-lg text-foreground">{sessionDetails?.title || `Loading Session #${ticketId}...`}</h2>}
                <span className={cn("w-2 h-2 rounded-full animate-pulse", isConnected ? "bg-green-500" : "bg-red-500")} />
              </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
             {/* Participants UI would be updated to use the participants array from hook */}
             <Button variant="ghost" size="icon" className="hover:bg-muted">
              <MoreVertical className="h-5 w-5 text-foreground" />
            </Button>
          </div>
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1 bg-muted/20">
        <div className="min-h-0 p-4 space-y-6">
          {showThreadSkeleton ? (
            <div className="space-y-5">
              {Array.from({ length: 6 }).map((_, index) => <SkeletonChatMessage key={index} sent={index % 3 === 1} />)}
            </div>
          ) : sessionDetails && (
            <div className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-sm">
              <p className="break-words text-sm text-muted-foreground leading-relaxed">{sessionDetails.description}</p>
            </div>
          )}
          {!showThreadSkeleton && messages.map((msg) => (
            <div key={msg.id} className={cn('flex gap-3 max-w-[85%]', msg.sender === 'user' ? 'ml-auto flex-row-reverse' : '')}>
              <div className={cn('flex flex-col gap-1', msg.sender === 'user' ? 'items-end' : 'items-start')}>
                {(!msg.type || msg.type === 'text') && (
                    <div className={cn('rounded-2xl px-4 py-2 break-words', 
                        msg.sender === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-white dark:bg-card border border-border text-foreground rounded-tl-sm')}>
                      <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
                        {msg.text ? renderLinkedText(msg.text) : null}
                      </p>
                    </div>
                )}
                {msg.type === 'code' && (
                  <div className="rounded-lg overflow-hidden border border-border w-full max-w-full my-1">
                    <SyntaxHighlighter
                      language={msg.codeLanguage || 'javascript'}
                      style={oneDark}
                      customStyle={{ margin: 0 }}
                    >
                      {msg.codeSnippet || msg.text || ''}
                    </SyntaxHighlighter>
                  </div>
                )}
                {(msg.type === 'voice' || msg.type === 'audio') && msg.audioUrl && (
                  <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2 border border-border mt-1">
                    <audio src={msg.audioUrl} controls className="h-10 max-w-xs" />
                  </div>
                )}
                {msg.type === 'image' && msg.fileUrl && (
                  <div className="rounded-lg overflow-hidden border border-border max-w-md my-1 shadow-sm hover:scale-[1.01] transition-transform duration-200">
                    <img src={msg.fileUrl} alt={msg.fileName || 'Image'} className="w-full h-auto max-h-[300px] object-cover" />
                  </div>
                )}
                {(msg.type === 'document' || msg.type === 'other') && msg.fileUrl && (
                  <div className="flex items-center gap-3 bg-white dark:bg-card rounded-xl p-3 border border-border mt-1 shadow-xs max-w-sm">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{msg.fileName || msg.text || 'Attached file'}</p>
                      <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Download file</a>
                    </div>
                  </div>
                )}
                <span className="text-[10px] text-muted-foreground px-1 mt-0.5">{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="border-t border-border shrink-0">
        <MessageInput onSendMessage={sendMessage} />
      </div>
    </div>
  );
}
