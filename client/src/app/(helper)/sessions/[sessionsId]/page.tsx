'use client';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BookOpen, MoreVertical, Mic, Play, Square, Users } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useParams } from 'next/navigation';
import {
  MessageInput,
  type OutgoingChatMessage,
} from '@/components/helper/inputBox';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useChatSessionDetailQuery } from '@/query/questionMutation';
import api from '@/lib/api/axiosInstance';
import type { ChatSessionParticipantItem } from '@/types/question';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const STATUS_LABEL_ONLINE = 'ONLINE';
const STATUS_LABEL_OFFLINE = 'OFFLINE';

interface Message {
  id: string;
  text?: string;
  type: 'text' | 'voice' | 'code';
  sender: 'user' | 'other';
  timestamp: Date;
  avatar?: string;
  avatarUrl?: string | null;
  name: string;
  audioUrl?: string;
  codeSnippet?: string;
  codeLanguage?: string;
}

// simple emoji-only check
const isEmojiOnly = (text?: string) => {
  if (!text) return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  // remove all emoji characters and check if anything remains
  const emojiRegex =
    /[\p{Emoji_Presentation}\uFE0F\u200D\p{Extended_Pictographic}]/gu;
  const onlyEmoji = trimmed.replace(emojiRegex, '').trim().length === 0;
  return onlyEmoji;
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
          className="text-[#03624C] underline underline-offset-2"
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

export default function sessionBox() {
  const params = useParams<{ sessionsId: string }>();
  const sessionId = Number(params?.sessionsId || 0);
  const {
    data: sessionDetail,
    isLoading: isSessionLoading,
    isError: isSessionError,
  } = useChatSessionDetailQuery(sessionId);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [participants, setParticipants] = useState<ChatSessionParticipantItem[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const currentUserId =
    sessionDetail?.current_user_id ??
    sessionDetail?.messages.find((message) => message.is_mine)?.sender.id ??
    null;

  useEffect(() => {
    if (!sessionDetail) return;

    const mappedMessages: Message[] = sessionDetail.messages.map((message) => {
      const firstName = message.sender.first_name || '';
      const lastName = message.sender.last_name || '';
      const fallbackName = message.sender.username || 'User';
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
        avatarUrl: message.sender.profile_image_url || undefined,
        codeSnippet: message.code_snippet || undefined,
        codeLanguage: isCode ? 'javascript' : undefined,
        audioUrl: normalizeFileUrl(isVoice ? message.file_url || undefined : undefined),
      };
    });

    setMessages(mappedMessages);
    setHistoryLoaded(true);
  }, [sessionDetail]);

  useEffect(() => {
    const questionId = sessionDetail?.question_id;
    if (!questionId) return;

    api
      .get(`/chat/sessions/${questionId}/members/`)
      .then((res) => {
        const data = res.data as {
          participants?: ChatSessionParticipantItem[];
          online_user_ids?: number[];
        };
        setParticipants(data.participants || []);
        setOnlineUserIds(data.online_user_ids || []);
      })
      .catch(() => {
        setParticipants(sessionDetail?.participants || []);
      });
  }, [sessionDetail]);

  useEffect(() => {
    const questionId = sessionDetail?.question_id;
    if (!questionId || !historyLoaded) return;

    const wsUrl = getChatWebSocketUrl(String(questionId));
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setIsConnected(true);
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'presence_update' && Array.isArray(data.online_user_ids)) {
        setOnlineUserIds(data.online_user_ids.map((id: number) => Number(id)));
        return;
      }
      if (data.type !== 'chat_message') return;

      const isCode = data.message_type === 'code';
      const isVoice = data.message_type === 'audio' || data.message_type === 'voice';
      const senderId = Number(data.sender_id);
      const resolvedCurrentUserId = currentUserId != null ? Number(currentUserId) : null;

      setMessages((prev) => [
        ...prev,
        {
          id: data.message_id?.toString() || Date.now().toString(),
          text: isCode ? 'Code snippet' : data.message,
          type: isCode ? 'code' : isVoice ? 'voice' : 'text',
          sender:
            resolvedCurrentUserId != null && senderId === resolvedCurrentUserId
              ? 'user'
              : 'other',
          timestamp: new Date(data.created_at || Date.now()),
          name: data.username || 'User',
          avatarUrl: data.sender_avatar_url || undefined,
          codeSnippet: data.code_snippet,
          codeLanguage: isCode ? 'javascript' : undefined,
          audioUrl: normalizeFileUrl(isVoice ? data.file_url || undefined : undefined),
        },
      ]);
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      wsRef.current?.close();
    };
  }, [sessionDetail?.question_id, currentUserId, historyLoaded]);

  const owner = sessionDetail?.asked_by;
  const ownerName =
    owner && (owner.first_name || owner.last_name)
      ? `${owner.first_name || ''} ${owner.last_name || ''}`.trim()
      : owner?.username || 'Session Owner';

  const onlineParticipants = participants.filter((participant) =>
    onlineUserIds.includes(participant.id)
  );
  const offlineParticipants = participants.filter(
    (participant) => !onlineUserIds.includes(participant.id)
  );

  const handleSendTextMessage = (payload: OutgoingChatMessage) => {
    if (!payload.message.trim() && !payload.code_snippet?.trim()) return;

    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify(payload));
    }
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex rounded-lg border border-border mt-4 mx-4 shadow-xs flex-col h-[calc(100vh-100px)] bg-background">
      {isSessionLoading && (
        <div className="p-4 text-sm text-muted-foreground border-b border-border">
          Loading session...
        </div>
      )}
      {isSessionError && (
        <div className="p-4 text-sm text-red-500 border-b border-border">
          Could not load this session.
        </div>
      )}

      {/* Message Header */}
      <div className="px-4 py-2 border-b rounded-t-lg border-border bg-card shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex jus items-center gap-2">
            <Avatar className="w-12 h-12 border-4 border-white">
              <AvatarImage src={owner?.profile_image_url || undefined} />
              <AvatarFallback>{ownerName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <h2 className="font-medium text-md font-sans text-foreground">
                {sessionDetail?.title ||
                  'How to integrate payment gateway in React?'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{ownerName}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(sessionDetail?.tags || []).map((cat, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full"
                  >
                    {cat}
                  </span>
                ))}
            </div>
          </div>
            </div>
            <div className="flex flex-col justify-end items-end">
              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-accent">
                      <Users className="h-5 w-5 text-foreground" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" >
                    <div className=" p-4">
                      <div className="flex items-center justify-between">
                        <SheetHeader>
                          <SheetTitle className="text-base">Members</SheetTitle>
                        </SheetHeader>
                      </div>
                      <ScrollArea className="mt-4 h-[70vh] pr-3">
                        <div className="mb-4 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          {STATUS_LABEL_ONLINE}
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
                                  <div className="text-xs text-muted-foreground">{participant.role || 'member'}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-6 mb-4 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-slate-400" />
                          {STATUS_LABEL_OFFLINE}
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
                                  <div className="text-xs text-muted-foreground">{participant.role || 'member'}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  </SheetContent>
                </Sheet>
                <Button variant="ghost" size="icon" className="hover:bg-accent">
                  <MoreVertical className="h-5 w-5 text-foreground" />
                </Button>
              </div>
            </div>
          </div>
        </div>


      {/* Message Area */}
      <ScrollArea className="flex-1 min-h-[400px] max-h-[calc(100vh-212px)]">
        <div
          className="flex-1 p-4 space-y-4 bg-muted/30 overflow-y-auto"
          style={{ scrollBehavior: 'smooth' }}
        >
          {sessionDetail?.description && (
            <div className="bg-card border border-border rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#03624C] flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">
                    Question Description
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {sessionDetail.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Messages list as its own component */}
          <MessageList
            messages={messages}
            formatTime={formatTime}
            messagesEndRef={messagesEndRef}
          />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <MessageInput
        onVoiceMessage={handleVoiceMessage}
        onSendMessage={handleSendTextMessage}
      />
    </div>
  );
}

/** Renders the whole messages list */
function MessageList({
  messages,
  formatTime,
  messagesEndRef,
}: {
  messages: Message[];
  formatTime: (d: Date) => string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <>
      {messages.map((message) => (
        <ChatMessageRow
          key={message.id}
          message={message}
          formatTime={formatTime}
        />
      ))}
      <div ref={messagesEndRef} />
    </>
  );
}

/** Renders a single chat message row (avatar + bubble) */
function ChatMessageRow({
  message,
  formatTime,
}: {
  message: Message;
  formatTime: (d: Date) => string;
}) {
  return (
    <div
      className={cn(
        'flex gap-3 max-w-[80%]',
        message.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
      )}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={message.avatarUrl || undefined} />
        <AvatarFallback className="bg-muted text-foreground text-xs">
          {message.sender === 'user' ? 'YU' : 'SC'}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          'flex flex-col gap-1',
          message.sender === 'user' ? 'items-end' : 'items-start'
        )}
      >
        {/* text bubble */}
        {message.type === 'text' && (
          isEmojiOnly(message.text) ? (
            <div className="px-1 py-0.5">
              <p className="text-3xl leading-none">{message.text}</p>
            </div>
          ) : (
            <div
              className={cn(
                'rounded-lg px-4 py-2 max-w-md break-words',
                message.sender === 'user'
                  ? 'bg-[#03624C] text-white'
                  : 'bg-card text-foreground border border-border'
              )}
            >
              <p className="text-sm leading-relaxed">
                {message.text ? renderLinkedText(message.text) : null}
              </p>
            </div>
          )
        )}

        {/* code bubble */}
        {message.type === 'code' && message.codeSnippet && (
          <div className="w-full max-w-md overflow-hidden rounded-lg border border-border bg-card">
            <div className="px-3 py-1 text-[11px] text-muted-foreground border-b border-border">
              {message.codeLanguage || 'code'}
            </div>
            <SyntaxHighlighter
              language={message.codeLanguage || 'javascript'}
              style={oneDark}
              customStyle={{
                margin: 0,
                borderRadius: 0,
                background: 'transparent',
                fontSize: '0.8rem',
              }}
              showLineNumbers
              wrapLongLines
            >
              {message.codeSnippet}
            </SyntaxHighlighter>
          </div>
        )}

        {/* voice bubble */}
        {message.type === 'voice' && message.audioUrl && (
          <VoiceMessageBubble
            audioUrl={message.audioUrl}
            isUser={message.sender === 'user'}
          />
        )}

        <span className="text-xs text-muted-foreground px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

// Compact card-style voice bubble: white rounded card, play + Instagram-style line visualizer
function VoiceMessageBubble({
  audioUrl,
  isUser,
}: {
  audioUrl: string;
  isUser: boolean;
}) {
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

  // heights pattern for bars (0–1)
  const barPattern = [
    0.2, 0.4, 0.7, 0.9, 0.8, 0.6, 0.35, 0.25,
    0.5, 0.85, 0.7, 0.55, 0.4, 0.3, 0.45, 0.65,
    0.7, 0.6, 0.45, 0.3, 0.2,
  ];

  return (
    <div className="flex items-end gap-2 max-w-md w-full">
      {/* small gray mic circle */}
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-1">
        <Mic className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* main pill */}
      <div className="flex items-center w-[280px] bg-card rounded-full shadow-xs border border-border px-4 py-3">
        {/* play button */}
        <button
          onClick={togglePlayback}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-black text-white mr-3 flex-shrink-0"
          aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
        >
          {isPlaying ? (
            <Square className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-[1px]" />
          )}
        </button>

        {/* full-width line visualizer */}
        <div className="flex-1 h-7 flex items-center">
          <div className="w-full h-full flex items-center justify-between">
            {barPattern.map((v, idx) => {
              const played = idx / barPattern.length < progress;
              const color = played ? '#000000' : '#d4d4d8'; // black / gray-300
              const heightPct = 25 + v * 65; // 25–90%

              return (
                <div
                  key={idx}
                  style={{
                    width: 2,
                    borderRadius: 9999,
                    backgroundColor: color,
                    height: `${heightPct}%`,
                    minHeight: '20%',
                    transition: 'background-color 0.2s ease',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* optional time label on the very right; remove if you don't want it */}
        <span className="ml-3 text-[11px] text-muted-foreground">{timeLabel}</span>
      </div>

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
