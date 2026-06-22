'use client';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BookOpen, MoreVertical, Play, Square } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useParams } from 'next/navigation';
import { MessageInput, type OutgoingChatMessage } from '@/components/helper/inputBox';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useChatSessionDetailQuery } from '@/query/questionMutation';
import { useChatRoom, ChatMessage } from '@/hooks/useChatRoom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SkeletonChatMessage } from '@/components/ui/skeleton';
import { useMinimumLoading } from '@/hooks/use-minimum-loading';

const STATUS_LABEL_ONLINE = 'ONLINE';
const STATUS_LABEL_OFFLINE = 'OFFLINE';

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

export default function SessionBox() {
  const params = useParams<{ sessionsId: string }>();
  const sessionId = Number(params?.sessionsId || 0);
  const {
    data: sessionDetail,
    isLoading: isSessionLoading,
    isError: isSessionError,
  } = useChatSessionDetailQuery(sessionId);
  
  const showThreadSkeleton = useMinimumLoading(isSessionLoading);

  const {
    messages,
    isConnected,
    sendMessage,
    participants,
    onlineUserIds,
    setQuestionIdForWs,
    setCurrentUserId,
    setMessages,
    setParticipants,
    setOnlineUserIds
  } = useChatRoom(String(sessionDetail?.question_id || ''));

  useEffect(() => {
    if (sessionDetail) {
      setQuestionIdForWs(String(sessionDetail.question_id));
      setCurrentUserId(Number(sessionDetail.current_user_id));
      setParticipants(sessionDetail.participants || []);

      const mappedMessages: ChatMessage[] = sessionDetail.messages.map((m: any) => ({
        id: String(m.id),
        text: m.message_content,
        type: m.message_type || 'text',
        sender: m.is_mine ? 'user' : 'other',
        timestamp: new Date(m.created_at),
        name: `${m.sender.first_name} ${m.sender.last_name}`.trim() || m.sender.username,
        avatarUrl: m.sender.profile_image_url || undefined,
        codeSnippet: m.code_snippet,
        audioUrl: normalizeFileUrl(m.file_url || undefined),
        fileUrl: normalizeFileUrl(m.file_url || undefined),
        fileName: m.file_name || undefined,
      }));
      setMessages(mappedMessages);
    }
  }, [sessionDetail, setQuestionIdForWs, setCurrentUserId, setMessages, setParticipants]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const owner = sessionDetail?.asked_by;
  const ownerName = owner ? `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || owner.username : 'Session Owner';

  const onlineParticipants = participants.filter((p) => onlineUserIds.includes(p.id));
  const offlineParticipants = participants.filter((p) => !onlineUserIds.includes(p.id));

  return (
    <div className="flex min-h-0 rounded-lg border border-border mt-4 mx-4 shadow-xs flex-col h-[calc(100vh-100px)] bg-background">
      {isSessionError && <div className="p-4 text-sm text-red-500 border-b border-border">Could not load session.</div>}

      <div className="px-4 py-2 border-b rounded-t-lg border-border bg-card shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Avatar className="w-12 h-12 border-4 border-white">
              <AvatarImage src={owner?.profile_image_url || undefined} />
              <AvatarFallback>{ownerName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="font-medium text-md text-foreground">{sessionDetail?.title || 'Loading...'}</h2>
              <p className="text-xs text-muted-foreground">{ownerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <div className="flex items-center -space-x-2">
                    {participants.slice(0, 3).map((p) => (
                      <Avatar key={p.id} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={p.profile_image_url || undefined} />
                        <AvatarFallback className="text-[9px]">{(p.first_name || 'U').charAt(0)}</AvatarFallback>
                      </Avatar>
                    ))}
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] text-muted-foreground">+</div>
                  </div>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="p-4">
                  <h3 className="text-base font-semibold">Members</h3>
                  <ScrollArea className="mt-4 h-[70vh]">
                    <div className="text-xs font-semibold text-muted-foreground mb-2">{STATUS_LABEL_ONLINE}</div>
                    {onlineParticipants.map((p) => <div key={p.id}>{p.username}</div>)}
                    <div className="text-xs font-semibold text-muted-foreground mt-4 mb-2">{STATUS_LABEL_OFFLINE}</div>
                    {offlineParticipants.map((p) => <div key={p.id}>{p.username}</div>)}
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
            <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 bg-muted/20">
        <div className="p-4 space-y-4">
          {showThreadSkeleton ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonChatMessage key={i} sent={i % 3 === 1} />)
          ) : sessionDetail?.description && (
            <div className="bg-card border p-4 rounded-lg text-sm">{sessionDetail.description}</div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cn('flex gap-3', m.sender === 'user' ? 'ml-auto flex-row-reverse' : '')}>
              <Avatar className="h-8 w-8"><AvatarImage src={m.avatarUrl || undefined} /><AvatarFallback>{m.name.charAt(0)}</AvatarFallback></Avatar>
              <div className={cn('flex flex-col', m.sender === 'user' ? 'items-end' : 'items-start')}>
                {(!m.type || m.type === 'text') && (
                  <div className={cn('px-4 py-2 rounded-lg text-sm', m.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border')}>
                    {m.text}
                  </div>
                )}
                {m.type === 'code' && (
                  <div className="rounded-lg overflow-hidden border border-border w-full max-w-full my-1">
                    <SyntaxHighlighter
                      language={m.codeLanguage || 'javascript'}
                      style={oneDark}
                      customStyle={{ margin: 0 }}
                    >
                      {m.codeSnippet || m.text || ''}
                    </SyntaxHighlighter>
                  </div>
                )}
                {(m.type === 'voice' || m.type === 'audio') && m.audioUrl && (
                  <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2 border border-border mt-1">
                    <audio src={m.audioUrl} controls className="h-10 max-w-xs" />
                  </div>
                )}
                {m.type === 'image' && m.fileUrl && (
                  <div className="rounded-lg overflow-hidden border border-border max-w-md my-1 shadow-sm hover:scale-[1.01] transition-transform duration-200">
                    <img src={m.fileUrl} alt={m.fileName || 'Image'} className="w-full h-auto max-h-[300px] object-cover" />
                  </div>
                )}
                {(m.type === 'document' || m.type === 'other') && m.fileUrl && (
                  <div className="flex items-center gap-3 bg-white dark:bg-card rounded-xl p-3 border border-border mt-1 shadow-xs max-w-sm">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{m.fileName || m.text || 'Attached file'}</p>
                      <a href={m.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Download file</a>
                    </div>
                  </div>
                )}
                <span className="text-[10px] text-muted-foreground">{formatTime(m.timestamp)}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <MessageInput onSendMessage={sendMessage} />
    </div>
  );
}
