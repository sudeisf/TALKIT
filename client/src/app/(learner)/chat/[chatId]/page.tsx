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
import api from '@/lib/api/axiosInstance'
import { MessageInput, type OutgoingChatMessage } from '@/components/helper/inputBox';
import { Skeleton, SkeletonChatMessage } from '@/components/ui/skeleton';
import { useMinimumLoading } from '@/hooks/use-minimum-loading';

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

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read audio data.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read audio data.'));
    reader.readAsDataURL(blob);
  });

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
  avatarUrl?: string | null;
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
  const ticketId = (params?.chatId ?? params?.id) as string;

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [questionIdForWs, setQuestionIdForWs] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [owner, setOwner] = useState<{
    id: number | null;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    profile_image_url?: string | null;
  } | null>(null);
  const [participants, setParticipants] = useState<Array<{
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_image_url?: string | null;
  }>>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
  const showThreadSkeleton = useMinimumLoading(!historyLoaded);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const onlineParticipants = participants.filter((participant) =>
    onlineUserIds.includes(participant.id)
  );
  const offlineParticipants = participants.filter(
    (participant) => !onlineUserIds.includes(participant.id)
  );

  // ----------------------------------------------------------------------
  // FETCH SESSION DETAILS FROM DJANGO
  // ticketId can be session_id (from conversation list) or question_id (from create redirect)
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (!ticketId || ticketId === 'undefined') return;

    const fetchSession = async () => {
      try {
        // Try chat session API first (when navigating from conversation list - session_id)
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
          const mappedMessages: Message[] = data.messages.map((message: any) => {
            const firstName = message.sender?.first_name || '';
            const lastName = message.sender?.last_name || '';
            const fallbackName = message.sender?.username || 'User';
            const resolvedName = `${firstName} ${lastName}`.trim() || fallbackName;
            const isCode = message.message_type === 'code';
            const isVoice = message.message_type === 'audio' || message.message_type === 'voice';

            return {
              id: String(message.id),
              text: isCode ? 'Code snippet' : message.message_content,
              type: isCode ? 'code' : isVoice ? 'voice' : 'text',
              sender: message.is_mine ? 'user' : 'other',
              timestamp: new Date(message.created_at),
              name: resolvedName,
              avatarUrl: message.sender?.profile_image_url || undefined,
              codeSnippet: message.code_snippet || undefined,
              codeLanguage: isCode ? detectLanguage(message.code_snippet) : undefined,
              audioUrl: normalizeFileUrl(isVoice ? message.file_url || undefined : undefined),
            };
          });
          setMessages(mappedMessages);
        }
        setQuestionIdForWs(String(data.question_id));
        setHistoryLoaded(true);
      } catch {
        try {
          // Fallback: question detail API (when coming from create - question_id)
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
  }, [ticketId]);

  useEffect(() => {
    if (!questionIdForWs) return;
    api
      .get(`/chat/sessions/${questionIdForWs}/members/`)
      .then((res) => {
        const data = res.data as {
          participants?: Array<{
            id: number;
            username: string;
            first_name: string;
            last_name: string;
            profile_image_url?: string | null;
          }>;
          online_user_ids?: number[];
        };
        setParticipants(data.participants || []);
        setOnlineUserIds((data.online_user_ids || []).map((id) => Number(id)));
      })
      .catch(() => {
        // ignore
      });
  }, [questionIdForWs]);

  // ----------------------------------------------------------------------
  // WEBSOCKET CONNECTION (requires question_id - backend looks up session by question)
  // ----------------------------------------------------------------------
  useEffect(() => {
    const qId = questionIdForWs;
    if (!qId || !historyLoaded) return;

    const wsUrl = getChatWebSocketUrl(qId);
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log("🟢 Connected to Live War Room:", qId);
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
        setMessages((prev) =>[
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
            codeLanguage: detectLanguage(data.code_snippet),
            audioUrl: normalizeFileUrl(isVoice ? data.file_url : undefined),
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
  }, [questionIdForWs, currentUserId, historyLoaded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ----------------------------------------------------------------------
  // SEND MESSAGE HANDLER
  // ----------------------------------------------------------------------
  const handleSendMessage = (payload: OutgoingChatMessage) => {
    if (!wsRef.current || !isConnected) return;
    if (!payload.message.trim() && !payload.code_snippet?.trim()) return;
    wsRef.current.send(JSON.stringify(payload));
  };

  const handleVoiceMessage = async (audioBlob: Blob) => {
    if (!wsRef.current || !isConnected) return;
    try {
      const audioBase64 = await blobToBase64(audioBlob);
      wsRef.current.send(
        JSON.stringify({
          type: 'message',
          message: '',
          message_type: 'voice',
          audio_base64: audioBase64,
          file_name: `voice-${Date.now()}.webm`,
        })
      );
    } catch (error) {
      console.error('Failed to send voice message:', error);
    }
  };

  // ----------------------------------------------------------------------
  // GUARD CLAUSE: Show empty state if no chat selected
  // ----------------------------------------------------------------------
  if (!ticketId || ticketId === 'undefined') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50/50 mx-4 mt-2">
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
    <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-lg border border-border bg-background mt-2 mx-4 shadow-sm h-[calc(100vh-50px)]">
      
      <div className="min-w-0 shrink-0 border-b border-border bg-card px-4 py-3">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
              <div className="flex min-w-0 items-center gap-2">
                {owner && (
                  <Avatar className="h-10 w-10 border-4 border-white">
                    <AvatarImage src={owner.profile_image_url || undefined} />
                    <AvatarFallback>
                      {(owner.first_name || owner.username || 'S').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                {showThreadSkeleton ? (
                  <Skeleton className="h-6 w-56" />
                ) : (
                  <h2 className="min-w-0 truncate font-medium text-lg text-foreground">
                    {sessionDetails?.title || `Loading Session #${ticketId}...`}
                  </h2>
                )}
                <span className={cn("w-2 h-2 rounded-full animate-pulse", isConnected ? "bg-green-500" : "bg-red-500")} />
              </div>
              {owner && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={owner.profile_image_url || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {(owner.first_name || owner.username || 'S').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    {`${owner.first_name || ''} ${owner.last_name || ''}`.trim() ||
                      owner.username}
                  </span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {sessionDetails?.tags.map((cat, index) => (
                  <span key={index} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                    {cat}
                  </span>
                ))}
              </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-muted">
                  <div className="flex items-center -space-x-2">
                    {participants.slice(0, 3).map((participant) => {
                      const displayName =
                        `${participant.first_name || ''} ${participant.last_name || ''}`.trim() ||
                        participant.username ||
                        'U';
                      return (
                        <Avatar key={`sheet-avatar-${participant.id}`} className="h-6 w-6 border-2 border-background">
                          <AvatarImage src={participant.profile_image_url || undefined} />
                          <AvatarFallback className="text-[9px]">
                            {displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })}
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] text-muted-foreground">
                      +
                    </div>
                  </div>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <SheetHeader>
                      <SheetTitle className="text-base">Members</SheetTitle>
                    </SheetHeader>
                  </div>
                  <ScrollArea className="mt-4 h-[70vh] pr-3">
                    <div className="mb-4 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-success" />
                      ONLINE
                    </div>
                    <div className="grid gap-3">
                      {onlineParticipants.map((participant) => {
                        const displayName =
                          `${participant.first_name || ''} ${participant.last_name || ''}`.trim() ||
                          participant.username;
                        return (
                          <div key={`online-${participant.id}`} className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={participant.profile_image_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {(displayName || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium text-foreground">{displayName}</div>
                              <div className="text-xs text-muted-foreground">member</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-6 mb-4 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                      OFFLINE
                    </div>
                    <div className="grid gap-3">
                      {offlineParticipants.map((participant) => {
                        const displayName =
                          `${participant.first_name || ''} ${participant.last_name || ''}`.trim() ||
                          participant.username;
                        return (
                          <div key={`offline-${participant.id}`} className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={participant.profile_image_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {(displayName || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium text-foreground">{displayName}</div>
                              <div className="text-xs text-muted-foreground">member</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
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
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonChatMessage key={index} sent={index % 3 === 1} />
              ))}
            </div>
          ) : sessionDetails && (
            <div className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex min-w-0 items-start gap-3">
                {owner ? (
                  <Avatar className="h-10 w-10 shrink-0 border-2 border-background">
                    <AvatarImage src={owner.profile_image_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {(owner.first_name || owner.username || 'S').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                    <BookOpen className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="mb-1 font-medium text-foreground">Problem Description</h4>
                  <p className="break-words text-sm text-muted-foreground leading-relaxed">
                    {sessionDetails.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!showThreadSkeleton && messages.map((msg) => (
            <div key={msg.id} className={cn('flex gap-3 max-w-[85%]', msg.sender === 'user' ? 'ml-auto flex-row-reverse' : '')}>
              <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                <AvatarImage src={msg.avatarUrl || undefined} />
                <AvatarFallback className={cn("text-xs text-primary-foreground", msg.sender === 'user' ? "bg-primary" : "bg-slate-600")}>
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
                        msg.sender === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-white dark:bg-card border border-border text-foreground rounded-tl-sm')}>
                      <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
                        {msg.text ? renderLinkedText(msg.text) : null}
                      </p>
                    </div>
                  )
                )}

                {msg.type === 'code' && msg.codeSnippet && (
                  <div className="w-full max-w-[500px] overflow-hidden rounded-lg border border-border bg-muted shadow-sm">
                    <div className="px-3 py-1.5 text-[11px] text-gray-400 border-b border-gray-700 bg-background flex justify-between">
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
                        <div className="p-2 text-sm text-gray-300 bg-background border-t border-gray-700">
                            {msg.text}
                        </div>
                    )}
                  </div>
                )}

                {msg.type === 'voice' && msg.audioUrl && (
                  <VoiceMessageBubble audioUrl={msg.audioUrl} />
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

      <div className="border-t border-border shrink-0">
        <MessageInput onVoiceMessage={handleVoiceMessage} onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}

function VoiceMessageBubble({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (secs: number) => {
    const s = Math.floor(secs % 60)
      .toString()
      .padStart(2, '0');
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  };

  const timeLabel = formatTime(currentTime || duration || 0);
  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-sm w-[260px]">
      <button
        onClick={togglePlayback}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-primary-foreground"
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
      </button>
      <div className="flex-1">
        <div className="h-1 w-full rounded-full bg-muted">
          <div
            className="h-1 rounded-full bg-black"
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>
      </div>
      <span className="text-[11px] text-muted-foreground">{timeLabel}</span>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        className="hidden"
      />
    </div>
  );
}
