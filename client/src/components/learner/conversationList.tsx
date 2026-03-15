'use client';

import { Dot, MessageCircle, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import ChatTabs from './chatTabs';
import SearchSessions from './sessionSearch';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useChatSessionsQuery } from '@/query/questionMutation';
import { toggleQuestionBookmark } from '@/lib/api/questionApi';
import { type ChatTabKey } from './chatTabs';

export default function ChatList() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ChatTabKey>('active');
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<number, boolean>>({});
  const [pendingFavorites, setPendingFavorites] = useState<Record<number, boolean>>({});
  const { data: sessions = [], isLoading, isError } = useChatSessionsQuery(debouncedSearch);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchValue.trim());
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [searchValue]);

  const getIsFavorite = (sessionId: number, serverValue?: boolean) => {
    if (sessionId in favoriteOverrides) {
      return favoriteOverrides[sessionId];
    }
    return Boolean(serverValue);
  };

  const activeSessionId = useMemo(() => {
    const match = pathname.match(/^\/chat\/(\d+)/);
    return match ? Number(match[1]) : null;
  }, [pathname]);

  const toRelative = (value: string | null) => {
    if (!value) return 'now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'now';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  };

  const isArchivedSession = (session: (typeof sessions)[number]) => {
    return !session.is_active || ['answered', 'closed'].includes(session.status);
  };

  const tabCounts = useMemo(() => {
    const archivedCount = sessions.filter(isArchivedSession).length;
    const allCount = sessions.length;
    const activeCount = allCount - archivedCount;
    const favoritesCount = sessions.filter((session) =>
      getIsFavorite(session.session_id, session.is_favorite)
    ).length;

    return {
      active: activeCount,
      all: allCount,
      favorites: favoritesCount,
      archived: archivedCount,
    } as Record<ChatTabKey, number>;
  }, [sessions, favoriteOverrides]);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const aTime = new Date(a.last_message_at || a.updated_at || 0).getTime();
      const bTime = new Date(b.last_message_at || b.updated_at || 0).getTime();
      return bTime - aTime;
    });
  }, [sessions]);

  const visibleSessions = useMemo(() => {
    if (activeTab === 'all') return sortedSessions;
    if (activeTab === 'active') return sortedSessions.filter((session) => !isArchivedSession(session));
    if (activeTab === 'archived') return sortedSessions.filter(isArchivedSession);
    return sortedSessions.filter((session) =>
      getIsFavorite(session.session_id, session.is_favorite)
    );
  }, [activeTab, sortedSessions, favoriteOverrides]);

  const searchedSessions = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    if (!normalized) return visibleSessions;

    return visibleSessions.filter((session) => {
      const haystack = [
        session.title,
        session.description,
        session.last_message || '',
        ...session.tags,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [searchValue, visibleSessions]);

  const toggleFavorite = async (sessionId: number, questionId: number) => {
    if (pendingFavorites[sessionId]) return;
    const currentValue = getIsFavorite(sessionId, sessions.find((s) => s.session_id === sessionId)?.is_favorite);
    const nextValue = !currentValue;

    setFavoriteOverrides((prev) => ({ ...prev, [sessionId]: nextValue }));
    setPendingFavorites((prev) => ({ ...prev, [sessionId]: true }));

    try {
      const result = await toggleQuestionBookmark(questionId);
      setFavoriteOverrides((prev) => ({ ...prev, [sessionId]: result.is_favorite }));
    } catch {
      // revert on failure
      setFavoriteOverrides((prev) => ({ ...prev, [sessionId]: currentValue }));
    } finally {
      setPendingFavorites((prev) => {
        const next = { ...prev };
        delete next[sessionId];
        return next;
      });
    }
  };

  const getEmptyStateText = () => {
    if (searchValue.trim()) {
      return {
        title: 'No matching sessions',
        description: 'Try another keyword or clear your search.',
      };
    }
    if (activeTab === 'favorites') {
      return {
        title: 'No favorites yet',
        description: 'Tap the star icon on a session to keep it here.',
      };
    }
    if (activeTab === 'archived') {
      return {
        title: 'No archived sessions',
        description: 'Archived conversations will appear here once sessions are closed.',
      };
    }
    return {
      title: 'No chats yet',
      description: 'Ask a question to start your first learning session.',
    };
  };

  const emptyState = getEmptyStateText();

  return (
    <div className="flex h-full w-[30%] min-w-[260px] max-w-[360px] shrink-0 flex-col border-r border-border bg-background text-foreground">
      <div className="px-4 py-2 border-b">
        <h1 className="text-lg font-medium mb-4 text-primary">Learning Sessions</h1>
        <SearchSessions value={searchValue} onChange={setSearchValue} />
      </div>
      <ChatTabs activeTab={activeTab} counts={tabCounts} onTabChange={setActiveTab} />
      <ScrollArea className="flex-1 min-h-0 [&_[data-slot=scroll-area-scrollbar]]:hidden">
        {isLoading && (
          <div className="p-4 text-sm text-muted-foreground">Loading sessions...</div>
        )}

        {isError && (
          <div className="p-4 text-sm text-red-500">Could not load sessions.</div>
        )}

        {!isLoading && !isError && searchedSessions.length === 0 && (
          <div className="flex min-h-[250px] items-center justify-center p-6">
            <div className="text-center space-y-2 max-w-[260px]">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageCircle className="h-5 w-5" />
              </div>
              <p className="text-foreground font-medium">{emptyState.title}</p>
              <p className="text-sm text-muted-foreground">{emptyState.description}</p>
            </div>
          </div>
        )}

        {searchedSessions.map((session) => {
          const isActive = activeSessionId === session.session_id;
          const isFavorite = getIsFavorite(session.session_id, session.is_favorite);
          const ownerName =
            `${session.asked_by?.first_name || ''} ${session.asked_by?.last_name || ''}`.trim() ||
            session.asked_by?.username ||
            'Unassigned';

          return (
            <div
              onClick={() => router.push(`/chat/${session.session_id}`)}
              key={`convo-${session.session_id}`}
              className={`mx-3 my-3 rounded-2xl border transition-all min-w-0 cursor-pointer ${
                isActive
                  ? 'border-[#03624C] bg-[#F3FAF7] dark:bg-emerald-950/20 shadow-sm'
                  : 'border-border/60 bg-card hover:border-[#03624C]/40 hover:bg-muted/30'
              }`}
            >
              <div className="flex items-start justify-between px-4 pt-4">
                <div className="flex gap-2">
                  {session.tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={`tag-${index}`}
                      className="bg-[#DDF3EE] text-[#0F766E] text-xs px-2 py-0.5 rounded-md font-medium uppercase tracking-wide"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {toRelative(session.last_message_at || session.updated_at)}
                  </p>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleFavorite(session.session_id, session.question_id);
                    }}
                    className="inline-flex items-center justify-center"
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    disabled={pendingFavorites[session.session_id]}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        isFavorite
                          ? 'fill-primary text-primary'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                </div>
              </div>
              <div className="px-4 pt-2">
                <h1 className="text-[15px] font-medium text-foreground whitespace-normal break-words [overflow-wrap:anywhere]">
                  {session.title}
                </h1>
              </div>
              <div className="px-4 pb-4 pt-1 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {session.last_message || session.description || 'No messages yet'}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={normalizeAvatarUrl(session.asked_by?.profile_image_url)} />
                    <AvatarFallback className="text-[10px]">
                      {(session.asked_by?.first_name ||
                        session.asked_by?.username ||
                        'U')
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>Assigned: {ownerName}</span>
                </div>
              </div>
            </div>
          );
        })}
      </ScrollArea>
    </div>
  );
}
const normalizeAvatarUrl = (url?: string | null) => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) {
    return url.replace(/^http:\/\//i, 'https://');
  }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const parsed = new URL(apiUrl);
      return `${parsed.origin}${url.startsWith('/') ? url : `/${url}`}`;
    } catch {
      return url;
    }
};
